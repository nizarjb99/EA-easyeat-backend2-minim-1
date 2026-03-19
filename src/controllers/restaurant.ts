import { NextFunction, Request, Response } from 'express';
import RestaurantService from '../services/restaurant.js';

// ─────────────────────────────────────────────────────────────────────────────
// CRUD
// ─────────────────────────────────────────────────────────────────────────────

const createRestaurant = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const saved = await RestaurantService.createRestaurant(req.body);
        return res.status(201).json(saved);
    } catch (error: any) {
        // Surface Mongoose duplicate-key errors as 409 Conflict
        if (error?.code === 11000) {
            return res.status(409).json({
                message: 'A restaurant with this name already exists in this city.',
                error,
            });
        }
        return res.status(500).json({ error });
    }
};

const readRestaurant = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const restaurant = await RestaurantService.getRestaurant(req.params.restaurantId);
        return restaurant
            ? res.status(200).json(restaurant)
            : res.status(404).json({ message: 'Restaurant not found.' });
    } catch (error) {
        return res.status(500).json({ error });
    }
};

const readAll = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const restaurants = await RestaurantService.getAllRestaurants();
        return res.status(200).json(restaurants);
    } catch (error) {
        return res.status(500).json({ error });
    }
};

const updateRestaurant = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const restaurant = await RestaurantService.updateRestaurant(
            req.params.restaurantId,
            req.body
        );
        return restaurant
            ? res.status(200).json(restaurant)
            : res.status(404).json({ message: 'Restaurant not found.' });
    } catch (error: any) {
        if (error?.code === 11000) {
            return res.status(409).json({
                message: 'A restaurant with this name already exists in this city.',
                error,
            });
        }
        return res.status(500).json({ error });
    }
};

/** Hard-delete – only use in admin/dev contexts. */
const deleteRestaurant = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const restaurant = await RestaurantService.deleteRestaurant(req.params.restaurantId);
        return restaurant
            ? res.status(200).json(restaurant)
            : res.status(404).json({ message: 'Restaurant not found.' });
    } catch (error) {
        return res.status(500).json({ error });
    }
};

/**
 * Soft-delete – marks `deletedAt` and excludes the restaurant from
 * all regular queries.  This is the recommended deletion endpoint.
 */
const softDeleteRestaurant = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const restaurant = await RestaurantService.softDeleteRestaurant(req.params.restaurantId);
        return restaurant
            ? res.status(200).json({ message: 'Restaurant deactivated.', restaurant })
            : res.status(404).json({ message: 'Restaurant not found.' });
    } catch (error) {
        return res.status(500).json({ error });
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// Read variants
// ─────────────────────────────────────────────────────────────────────────────

const getRestaurantWithCustomers = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const restaurant = await RestaurantService.getRestaurantWithCustomers(
            req.params.restaurantId
        );
        return restaurant
            ? res.status(200).json(restaurant)
            : res.status(404).json({ message: 'Restaurant not found.' });
    } catch (error) {
        return res.status(500).json({ error });
    }
};

const getRestaurantFull = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const restaurant = await RestaurantService.getRestaurantFull(req.params.restaurantId);
        return restaurant
            ? res.status(200).json(restaurant)
            : res.status(404).json({ message: 'Restaurant not found.' });
    } catch (error) {
        return res.status(500).json({ error });
    }
};

const getNearby = async (req: Request, res: Response, next: NextFunction) => {
    const { lng, lat, maxDistance } = req.query;
    if (!lng || !lat)
        return res.status(400).json({ message: 'lng and lat query params are required.' });

    try {
        const restaurants = await RestaurantService.getNearby(
            parseFloat(lng as string),
            parseFloat(lat as string),
            maxDistance ? parseFloat(maxDistance as string) : 5_000
        );
        return res.status(200).json(restaurants);
    } catch (error) {
        return res.status(500).json({ error });
    }
};

const getBadges = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const badges = await RestaurantService.getBadges(req.params.restaurantId);
        return badges
            ? res.status(200).json(badges)
            : res.status(404).json({ message: 'Restaurant not found.' });
    } catch (error) {
        return res.status(500).json({ error });
    }
};

const getStatistics = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const statistics = await RestaurantService.getStatistics(req.params.restaurantId);
        return statistics
            ? res.status(200).json(statistics)
            : res.status(404).json({ message: 'Restaurant not found.' });
    } catch (error) {
        return res.status(500).json({ error });
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// Advanced filtering
// ─────────────────────────────────────────────────────────────────────────────

const getFiltered = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { lng, lat, radiusMeters, categories, minRating, city, openNow, openAt } = req.query;

        const results = await RestaurantService.getFilteredRestaurants({
            lng:          lng          ? parseFloat(lng          as string) : undefined,
            lat:          lat          ? parseFloat(lat          as string) : undefined,
            radiusMeters: radiusMeters ? parseFloat(radiusMeters as string) : undefined,
            categories:   categories   ? (categories as string).split(',')  : undefined,
            minRating:    minRating    ? parseFloat(minRating    as string) : undefined,
            city:         city         ? (city as string)                   : undefined,
            openNow:      openNow === 'true',
            openAt:       openAt       ? (openAt as string)                 : undefined,
        });

        return res.status(200).json(results);
    } catch (error) {
        return res.status(500).json({ error });
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// Exports
// ─────────────────────────────────────────────────────────────────────────────

export default {
    createRestaurant,
    readRestaurant,
    readAll,
    updateRestaurant,
    deleteRestaurant,
    softDeleteRestaurant,
    getRestaurantWithCustomers,
    getRestaurantFull,
    getNearby,
    getBadges,
    getStatistics,
    getFiltered,
};