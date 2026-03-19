import { RestaurantModel, IRestaurant } from '../models/restaurant';
import { PipelineStage }               from 'mongoose';

// ─────────────────────────────────────────────────────────────────────────────
// CRUD
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Creates a new restaurant document.
 * Mongoose will run all schema validators and the pre-save hook automatically.
 */
const createRestaurant = async (data: Partial<IRestaurant>): Promise<IRestaurant> => {
    const restaurant = new RestaurantModel(data);
    return restaurant.save();
};

/**
 * Returns a single active restaurant by ID, with its rewards populated.
 * Returns null if not found or soft-deleted.
 */
const getRestaurant = async (restaurantId: string): Promise<IRestaurant | null> => {
    return RestaurantModel
        .findById(restaurantId)
        .active()                   // ← excludes soft-deleted
        .populate('rewards')
        .lean();
};

/**
 * Returns all active restaurants, sorted by rating descending.
 */
const getAllRestaurants = async (): Promise<IRestaurant[]> => {
    return RestaurantModel
        .find()
        .active()
        .sort({ 'profile.rating': -1 })
        .populate('rewards')
        .lean();
};

/**
 * Partially updates a restaurant.
 * Uses `restaurant.set(data)` so Mongoose validators run on the changed paths.
 */
const updateRestaurant = async (
    restaurantId: string,
    data: Partial<IRestaurant>
): Promise<IRestaurant | null> => {
    const restaurant = await RestaurantModel.findById(restaurantId).active();
    if (!restaurant) return null;
    restaurant.set(data);
    return restaurant.save();
};

/**
 * Hard-delete (permanent removal).
 * Prefer `softDeleteRestaurant` in production unless you truly need permanent removal.
 */
const deleteRestaurant = async (restaurantId: string): Promise<IRestaurant | null> => {
    return RestaurantModel.findByIdAndDelete(restaurantId).lean();
};

/**
 * Soft-delete: marks `deletedAt` with the current timestamp.
 * The restaurant is excluded from all `.active()` queries thereafter.
 */
const softDeleteRestaurant = async (restaurantId: string): Promise<IRestaurant | null> => {
    return RestaurantModel.findByIdAndUpdate(
        restaurantId,
        { deletedAt: new Date() },
        { new: true }
    ).lean();
};

// ─────────────────────────────────────────────────────────────────────────────
// Read variants
// ─────────────────────────────────────────────────────────────────────────────

/** Restaurant + all customer visits (customers populated via visits). */
const getRestaurantWithCustomers = async (restaurantId: string): Promise<IRestaurant | null> => {
    return RestaurantModel
        .findById(restaurantId)
        .active()
        .populate({ path: 'visits', populate: { path: 'customer_id' } })
        .lean();
};

/** Restaurant with every relation populated. */
const getRestaurantFull = async (restaurantId: string): Promise<IRestaurant | null> => {
    return RestaurantModel
        .findById(restaurantId)
        .active()
        .populate('employees')
        .populate('rewards')
        .populate('badges')
        .populate('statistics')
        .populate('visits')
        .lean();
};

/** Nearby restaurants within `maxDistance` metres (uses 2dsphere index). */
const getNearby = async (
    lng: number,
    lat: number,
    maxDistance: number
): Promise<IRestaurant[]> => {
    return RestaurantModel
        .find({
            deletedAt: null,
            'profile.location.coordinates': {
                $near: {
                    $geometry: { type: 'Point', coordinates: [lng, lat] },
                    $maxDistance: maxDistance,
                },
            },
        })
        .lean();
};

/** Returns only the badges subdocument for a restaurant. */
const getBadges = async (restaurantId: string): Promise<IRestaurant | null> => {
    return RestaurantModel
        .findById(restaurantId)
        .active()
        .select('badges')
        .populate('badges')
        .lean();
};

/** Returns only the statistics subdocument for a restaurant. */
const getStatistics = async (restaurantId: string): Promise<IRestaurant | null> => {
    return RestaurantModel
        .findById(restaurantId)
        .active()
        .select('statistics')
        .populate('statistics')
        .lean();
};

// ─────────────────────────────────────────────────────────────────────────────
// Rating recalculation
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Recalculates and persists the restaurant's average rating.
 * Called by the Review service after every create / update / delete of a review.
 *
 * @param restaurantId  - Mongo ObjectId string of the restaurant.
 * @param newAverage    - Pre-computed average (0–10) from the review aggregation.
 */
const updateRating = async (
    restaurantId: string,
    newAverage: number
): Promise<IRestaurant | null> => {
    // Clamp defensively – the schema pre-save hook does the same, but doing it
    // here keeps the value correct even if the caller made a mistake.
    const clamped = Math.min(10, Math.max(0, newAverage));
    return RestaurantModel
        .findByIdAndUpdate(
            restaurantId,
            { 'profile.rating': clamped },
            { new: true, runValidators: true }
        )
        .lean();
};

// ─────────────────────────────────────────────────────────────────────────────
// Advanced filtering (aggregation pipeline)
// ─────────────────────────────────────────────────────────────────────────────

export interface RestaurantFilterParams {
    /** User longitude */
    lng?: number;
    /** User latitude */
    lat?: number;
    /** Search radius in metres (default: 5 000) */
    radiusMeters?: number;
    /** Category strings – must match schema enum */
    categories?: string[];
    /** Minimum inclusive rating (0–10) */
    minRating?: number;
    /** City name (case-insensitive partial match) */
    city?: string;
    /** If true, filters restaurants that are open right now */
    openNow?: boolean;
    /** ISO datetime string – filters restaurants open at this exact moment */
    openAt?: string;
}

export interface RestaurantWithDistance extends IRestaurant {
    /** Present only when a geolocation filter is active; value is in metres. */
    distance?: number;
}

// ── Internal helpers ─────────────────────────────────────────────────────────

function getDayKey(date: Date): string {
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    return days[date.getDay()];
}

/**
 * Builds three aggregation pipeline stages that compute a boolean `_isOpen`
 * field (via $reduce over the timetable slots for the target day), match only
 * open restaurants, then remove the helper field.
 */
function buildOpenAtStages(date: Date): PipelineStage[] {
    const dayKey         = getDayKey(date);
    const currentMinutes = date.getHours() * 60 + date.getMinutes();

    // MongoDB expression to convert "HH:MM" field reference to minutes-since-midnight.
    const toMinutes = (fieldRef: string) => ({
        $add: [
            {
                $multiply: [
                    { $toInt: { $arrayElemAt: [{ $split: [fieldRef, ':'] }, 0] } },
                    60,
                ],
            },
            { $toInt: { $arrayElemAt: [{ $split: [fieldRef, ':'] }, 1] } },
        ],
    });

    const addFieldsStage: PipelineStage = {
        $addFields: {
            _isOpen: {
                $reduce: {
                    input:        { $ifNull: [`$profile.timetable.${dayKey}`, []] },
                    initialValue: false,
                    in: {
                        $or: [
                            '$$value',
                            {
                                $and: [
                                    { $gte: [currentMinutes, toMinutes('$$this.open')]  },
                                    { $lt:  [currentMinutes, toMinutes('$$this.close')] },
                                ],
                            },
                        ],
                    },
                },
            },
        },
    };

    return [
        addFieldsStage,
        { $match:   { _isOpen: true } },
        { $project: { _isOpen: 0   } },
    ];
}

/**
 * Returns a filtered list of active restaurants.
 *
 * All parameters are optional and fully composable:
 * - With `lng` + `lat`: pipeline starts with $geoNear (distance sort + `distance` field).
 * - Without geo: falls back to a standard $match + rating-desc sort.
 * - `openNow` / `openAt`: appended as $addFields→$match stages after the initial filter.
 */
const getFilteredRestaurants = async (
    params: RestaurantFilterParams
): Promise<RestaurantWithDistance[]> => {
    const {
        lng,
        lat,
        radiusMeters = 5_000,
        categories,
        minRating,
        city,
        openNow,
        openAt,
    } = params;

    const hasGeo =
        lng !== undefined && lat !== undefined && isFinite(lng) && isFinite(lat);

    const pipeline: PipelineStage[] = [];

    // Base filter applied to all paths – always exclude soft-deleted restaurants.
    const baseFilter: Record<string, unknown> = { deletedAt: null };

    // ── 1. Geospatial / standard initial stage ───────────────────────────────
    if (hasGeo) {
        // Fold cheap scalar filters into the $geoNear `query` so MongoDB can
        // leverage the 2dsphere index for pre-filtering.
        if (city)            baseFilter['profile.location.city'] = { $regex: city, $options: 'i' };
        if (minRating)       baseFilter['profile.rating']        = { $gte: minRating };
        if (categories?.length) baseFilter['profile.category']   = { $in: categories };

        pipeline.push({
            $geoNear: {
                near:          { type: 'Point', coordinates: [lng!, lat!] },
                distanceField: 'distance',
                maxDistance:   radiusMeters,
                spherical:     true,
                query:         baseFilter,
            },
        } as PipelineStage);
    } else {
        if (city)            baseFilter['profile.location.city'] = { $regex: city, $options: 'i' };
        if (minRating)       baseFilter['profile.rating']        = { $gte: minRating };
        if (categories?.length) baseFilter['profile.category']   = { $in: categories };

        pipeline.push({ $match: baseFilter });
    }

    // ── 2. "Open at" / "Open now" filter ────────────────────────────────────
    const targetDate = openAt
        ? new Date(openAt)
        : openNow
            ? new Date()
            : null;

    if (targetDate && isFinite(targetDate.getTime())) {
        pipeline.push(...buildOpenAtStages(targetDate));
    }

    // ── 3. Sort ──────────────────────────────────────────────────────────────
    if (!hasGeo) {
        // $geoNear already sorts by distance; only apply when no geo filter.
        pipeline.push({ $sort: { 'profile.rating': -1, 'profile.name': 1 } });
    }

    return RestaurantModel.aggregate<RestaurantWithDistance>(pipeline).exec();
};

// ─────────────────────────────────────────────────────────────────────────────
// Exports
// ─────────────────────────────────────────────────────────────────────────────

export default {
    createRestaurant,
    getRestaurant,
    getAllRestaurants,
    updateRestaurant,
    deleteRestaurant,
    softDeleteRestaurant,
    getRestaurantWithCustomers,
    getRestaurantFull,
    getNearby,
    getBadges,
    getStatistics,
    updateRating,
    getFilteredRestaurants,
};