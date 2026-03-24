import { RestaurantModel, IRestaurant } from '../models/restaurant';
import { PipelineStage }               from 'mongoose';

// ─────────────────────────────────────────────────────────────────────────────
// CRUD
// ─────────────────────────────────────────────────────────────────────────────

const createRestaurant = async (data: Partial<IRestaurant>): Promise<IRestaurant> => {
    const restaurant = new RestaurantModel(data);
    return restaurant.save();
};

const getRestaurant = async (restaurantId: string): Promise<IRestaurant | null> => {
    return RestaurantModel.findById(restaurantId).active().populate('rewards').lean();
};

const getAllRestaurants = async (): Promise<IRestaurant[]> => {
    return RestaurantModel.find().active().sort({ 'profile.rating': -1 }).populate('rewards').lean();
};

const updateRestaurant = async ( restaurantId: string, data: Partial<IRestaurant> ): Promise<IRestaurant | null> => {
    const restaurant = await RestaurantModel.findById(restaurantId).active();
    if (!restaurant) return null;
    restaurant.set(data);
    return restaurant.save();
};

// ─────────────────────────────────────────────────────────────────────────────
// Delete / restore
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Soft-delete: sets deletedAt to now.
 * Returns null if the restaurant is not found OR is already soft-deleted.
 */
const softDeleteRestaurant = async (restaurantId: string): Promise<IRestaurant | null> => {
    return RestaurantModel.findOneAndUpdate(
        { _id: restaurantId, deletedAt: null },          // guard: only active docs
        { deletedAt: new Date() },
        { new: true }
    ).lean();
};

/**
 * Restore: clears deletedAt, making the restaurant active again.
 * Returns null if the restaurant is not found OR is already active.
 */
const restoreRestaurant = async (restaurantId: string): Promise<IRestaurant | null> => {
    return RestaurantModel.findOneAndUpdate(
        { _id: restaurantId, deletedAt: { $ne: null } }, // guard: only deleted docs
        { deletedAt: null },
        { new: true }
    ).lean();
};

/**
 * Hard-delete: permanently removes the document.
 * Use only for admin operations or GDPR erasure requests.
 */
const hardDeleteRestaurant = async (restaurantId: string): Promise<IRestaurant | null> => {
    return RestaurantModel.findByIdAndDelete(restaurantId).lean();
};

// ─────────────────────────────────────────────────────────────────────────────
// Read variants
// ─────────────────────────────────────────────────────────────────────────────

const getRestaurantWithCustomers = async (restaurantId: string): Promise<IRestaurant | null> => {
    return RestaurantModel
        .findById(restaurantId).active().populate({ path: 'visits', populate: { path: 'customer_id' } })
        .lean();
};

const getRestaurantFull = async (restaurantId: string): Promise<IRestaurant | null> => {
    return RestaurantModel
        .findById(restaurantId).active().populate('employees').populate('rewards')
        .populate('badges').populate('statistics')
        .populate('visits').lean();
};

const getNearby = async ( lng: number, lat: number,
 maxDistance: number ): Promise<IRestaurant[]> => {
    return RestaurantModel
        .find({ deletedAt: null,'profile.location.coordinates': {
                $near: {
                    $geometry: { type: 'Point', coordinates: [lng, lat] },
                    $maxDistance: maxDistance,
                } } }).lean();
};

const getBadges = async (restaurantId: string): Promise<IRestaurant | null> => {
    return RestaurantModel.findById(restaurantId)
        .active().select('badges').populate('badges').lean();
};

const getStatistics = async (restaurantId: string): Promise<IRestaurant | null> => {
    return RestaurantModel
        .findById(restaurantId).active().select('statistics').populate('statistics')
        .lean();
};

// ─────────────────────────────────────────────────────────────────────────────
// Rating recalculation
// ─────────────────────────────────────────────────────────────────────────────

const updateRating = async ( restaurantId: string, newAverage: number
): Promise<IRestaurant | null> => {
    const clamped = Math.min(10, Math.max(0, newAverage));
    return RestaurantModel.findByIdAndUpdate( restaurantId, { 'profile.rating': clamped },
            { new: true, runValidators: true } ).lean();
};

// ─────────────────────────────────────────────────────────────────────────────
// Advanced filtering
// ─────────────────────────────────────────────────────────────────────────────

export interface RestaurantFilterParams {
    lng?: number;
    lat?: number;
    radiusMeters?: number;
    categories?: string[];
    minRating?: number;
    city?: string;
    openNow?: boolean;
    openAt?: string;
}

export interface RestaurantWithDistance extends IRestaurant {
    distance?: number;
}

function getDayKey(date: Date): string {
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    return days[date.getDay()];
}

function buildOpenAtStages(date: Date): PipelineStage[] {
    const dayKey         = getDayKey(date);
    const currentMinutes = date.getHours() * 60 + date.getMinutes();

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

const getFilteredRestaurants = async (
    params: RestaurantFilterParams
): Promise<RestaurantWithDistance[]> => {
    const { lng, lat, radiusMeters = 5_000, categories, minRating, city, openNow, openAt } = params;

    const hasGeo = lng !== undefined && lat !== undefined && isFinite(lng) && isFinite(lat);
    const pipeline: PipelineStage[] = [];
    const baseFilter: Record<string, unknown> = { deletedAt: null };

    if (hasGeo) {
        if (city)               baseFilter['profile.location.city'] = { $regex: city, $options: 'i' };
        if (minRating)          baseFilter['profile.rating']        = { $gte: minRating };
        if (categories?.length) baseFilter['profile.category']      = { $in: categories };

        pipeline.push({
            $geoNear: {
                near:          { type: 'Point', coordinates: [lng!, lat!] },
                distanceField: 'distance',
                maxDistance:   radiusMeters,
                spherical:     true,
                query:         baseFilter,
            },
        } as PipelineStage);
    }
    else {
        if (city)               baseFilter['profile.location.city'] = { $regex: city, $options: 'i' };
        if (minRating)          baseFilter['profile.rating']        = { $gte: minRating };
        if (categories?.length) baseFilter['profile.category']      = { $in: categories };

        pipeline.push({ $match: baseFilter });
    }

    const targetDate = openAt ? new Date(openAt) : openNow ? new Date() : null;
    if (targetDate && isFinite(targetDate.getTime())) {
        pipeline.push(...buildOpenAtStages(targetDate));
    }

    if (!hasGeo) {
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
    softDeleteRestaurant,
    restoreRestaurant,
    hardDeleteRestaurant,
    getRestaurantWithCustomers,
    getRestaurantFull,
    getNearby,
    getBadges,
    getStatistics,
    updateRating,
    getFilteredRestaurants,
};