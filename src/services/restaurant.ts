import { RestaurantModel, IRestaurant } from '../models/restaurant';
import { PipelineStage } from 'mongoose';

const createRestaurant = async (data: Partial<IRestaurant>): Promise<IRestaurant> => {
    const restaurant = new RestaurantModel({ ...data });
    return await restaurant.save();
};

const getRestaurant = async (restaurantId: string): Promise<IRestaurant | null> => {
    return await RestaurantModel.findById(restaurantId);
};

const getAllRestaurants = async (): Promise<IRestaurant[]> => {
    return await RestaurantModel.find();
};

const updateRestaurant = async (restaurantId: string, data: Partial<IRestaurant>): Promise<IRestaurant | null> => {
    const restaurant = await RestaurantModel.findById(restaurantId);
    if (restaurant) {
        restaurant.set(data);
        return await restaurant.save();
    }
    return null;
};

const deleteRestaurant = async (restaurantId: string): Promise<IRestaurant | null> => {
    return await RestaurantModel.findByIdAndDelete(restaurantId);
};

const getRestaurantWithCustomers = async (restaurantId: string): Promise<IRestaurant | null> => {
    return await RestaurantModel.findById(restaurantId).populate('customers', '-restaurant').lean();
};

const getRestaurantFull = async (restaurantId: string): Promise<IRestaurant | null> => {
    return await RestaurantModel.findById(restaurantId)
        .populate('employees')
        .populate('rewards')
        .populate('badges')
        .populate('statistics')
        .lean();
};

const getNearby = async (lng: number, lat: number, maxDistance: number): Promise<IRestaurant[]> => {
    return await RestaurantModel.find({
        'profile.location.coordinates': {
            $near: {
                $geometry: { type: 'Point', coordinates: [lng, lat] },
                $maxDistance: maxDistance
            }
        }
    }).lean();
};

const getBadges = async (restaurantId: string): Promise<IRestaurant | null> => {
    return await RestaurantModel.findById(restaurantId)
        .select('badges')
        .populate('badges')
        .lean();
};

const getStatistics = async (restaurantId: string): Promise<IRestaurant | null> => {
    return await RestaurantModel.findById(restaurantId)
        .select('statistics')
        .populate('statistics')
        .lean();
};





// ############ NEW FILTERING FEATURE  ########


// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

export interface RestaurantFilterParams {
    /** User longitude */
    lng?: number;
    /** User latitude */
    lat?: number;
    /** Search radius in meters (default: 5000) */
    radiusMeters?: number;
    /** Category strings (must match schema enum) */
    categories?: string[];
    /** Minimum rating (0–10) */
    minRating?: number;
    /** Filter by city name */
    city?: string;
    /** If true, filters restaurants open right now */
    openNow?: boolean;
    /** ISO datetime string – filters restaurants open at this exact moment */
    openAt?: string;
}

export interface RestaurantWithDistance extends IRestaurant {
    distance?: number; // metres, present only when geolocation filter is active
}

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

/**
 * Maps a JS Date to the timetable day key used in the schema.
 */
function getDayKey(date: Date): string {
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    return days[date.getDay()];
}

/**
 * Converts a "HH:MM" string to total minutes since midnight.
 */
function timeToMinutes(time: string): number {
    const [h, m] = time.split(':').map(Number);
    return h * 60 + (m || 0);
}

/**
 * Builds the $match stage that checks whether any slot for a given day
 * contains the target time.  Because MongoDB cannot evaluate JS expressions
 * inside a standard $match, we add a post-filter step via $addFields +
 * $match using $filter + $gt.
 *
 * Strategy:
 *   1. $addFields: compute a boolean "isOpen" by scanning the day's slots.
 *   2. $match: { isOpen: true }
 *   3. $project: remove the helper field.
 */
function buildOpenAtStages(date: Date): PipelineStage[] {
    const dayKey = getDayKey(date);
    const currentMinutes = date.getHours() * 60 + date.getMinutes();

    // Use $reduce over the timetable slots for the target day.
    // Each slot has open/close as "HH:MM" strings → convert with $split + $arrayElemAt.
    const minutesExpr = (timeField: string) => ({
        $add: [
            {
                $multiply: [
                    { $toInt: { $arrayElemAt: [{ $split: [timeField, ':'] }, 0] } },
                    60
                ]
            },
            { $toInt: { $arrayElemAt: [{ $split: [timeField, ':'] }, 1] } }
        ]
    });

    const addFieldsStage: PipelineStage = {
        $addFields: {
            _isOpen: {
                $reduce: {
                    input: { $ifNull: [`$profile.timetable.${dayKey}`, []] },
                    initialValue: false,
                    in: {
                        $or: [
                            '$$value',
                            {
                                $and: [
                                    { $gte: [currentMinutes, minutesExpr('$$this.open')] },
                                    { $lt:  [currentMinutes, minutesExpr('$$this.close')] }
                                ]
                            }
                        ]
                    }
                }
            }
        }
    };

    const matchStage: PipelineStage  = { $match: { _isOpen: true } };
    const cleanupStage: PipelineStage = { $project: { _isOpen: 0 } };

    return [addFieldsStage, matchStage, cleanupStage];
}

// ─────────────────────────────────────────────
// Main service method
// ─────────────────────────────────────────────

/**
 * Retrieves a filtered list of restaurants.
 *
 * All parameters are optional and fully combinable:
 *   • If `lng`/`lat` are supplied the pipeline starts with $geoNear so that
 *     results are sorted by distance and each document gets a `distance` field.
 *   • All other filters are appended as $match stages after the initial stage.
 *   • "open now" / "open at" logic is handled via $addFields so that it works
 *     even when the timetable is absent (treated as closed).
 */
export const getFilteredRestaurants = async (
    params: RestaurantFilterParams
): Promise<RestaurantWithDistance[]> => {
    const {
        lng,
        lat,
        radiusMeters = 5000,
        categories,
        minRating,
        city,
        openNow,
        openAt
    } = params;

    const hasGeo = lng !== undefined && lat !== undefined
        && isFinite(lng) && isFinite(lat);

    const pipeline: PipelineStage[] = [];

    // ── 1. Geospatial stage ──────────────────────────────────────────────────
    if (hasGeo) {
        // $geoNear MUST be the first stage in an aggregation pipeline.
        // It adds a `distance` field and sorts by proximity.
        const geoNearStage: PipelineStage = {
            $geoNear: {
                near: { type: 'Point', coordinates: [lng!, lat!] },
                distanceField: 'distance',         // metres
                maxDistance: radiusMeters,
                spherical: true,
                // We can pre-filter with the query option to leverage the 2dsphere index
                // before the pipeline even starts (helps performance).
                query: {}
            }
        };

        // Fold cheap scalar filters into the $geoNear query object so MongoDB
        // can apply them at the index scan level.
        const geoQuery: Record<string, unknown> = {};
        if (city)      geoQuery['profile.location.city'] = { $regex: city, $options: 'i' };
        if (minRating) geoQuery['profile.rating']        = { $gte: minRating };
        if (categories?.length) {
            geoQuery['profile.category'] = { $in: categories };
        }

        (geoNearStage as any).$geoNear.query = geoQuery;
        pipeline.push(geoNearStage);

    } else {
        // ── 2. Standard $match when no geo filter ────────────────────────────
        const match: Record<string, unknown> = {};

        if (city)      match['profile.location.city'] = { $regex: city, $options: 'i' };
        if (minRating) match['profile.rating']        = { $gte: minRating };
        if (categories?.length) {
            match['profile.category'] = { $in: categories };
        }

        if (Object.keys(match).length) {
            pipeline.push({ $match: match });
        }
    }

    // ── 3. "Open at" / "Open now" filter ────────────────────────────────────
    const targetDate = openAt ? new Date(openAt) : openNow ? new Date() : null;
    if (targetDate && isFinite(targetDate.getTime())) {
        pipeline.push(...buildOpenAtStages(targetDate));
    }

    // ── 4. Sort ──────────────────────────────────────────────────────────────
    if (!hasGeo) {
        // Without geo: sort by rating desc, then name asc as a tiebreaker.
        pipeline.push({ $sort: { 'profile.rating': -1, 'profile.name': 1 } });
    }
    // With geo: $geoNear already sorts by distance asc – no extra $sort needed.

    // ── 5. Execute ───────────────────────────────────────────────────────────
    return RestaurantModel.aggregate<RestaurantWithDistance>(pipeline).exec();
};



export default {
    createRestaurant,
    getRestaurant,
    getAllRestaurants,
    updateRestaurant,
    deleteRestaurant,
    getRestaurantWithCustomers,
    getRestaurantFull,
    getNearby,
    getBadges,
    getStatistics,
    getFilteredRestaurants  // ← add this
};