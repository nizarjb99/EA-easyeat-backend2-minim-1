import { NextFunction, Request, Response } from 'express';
import RestaurantService from '../services/restaurant.js';

const createRestaurant = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const savedRestaurant = await RestaurantService.createRestaurant(req.body);
        return res.status(201).json(savedRestaurant);
    } catch (error) {
        return res.status(500).json({ error });
    }
};

const readRestaurant = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const restaurant = await RestaurantService.getRestaurant(req.params.restaurantId);
        return restaurant ? res.status(200).json(restaurant) : res.status(404).json({ message: 'not found' });
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
    const restaurantId = req.params.restaurantId;
    try {
        const restaurant = await RestaurantService.updateRestaurant(restaurantId, req.body);
        return restaurant ? res.status(200).json(restaurant) : res.status(404).json({ message: 'not found' });
    } catch (error) {
        return res.status(500).json({ error });
    }
};

const deleteRestaurant = async (req: Request, res: Response, next: NextFunction) => {
    const restaurantId = req.params.restaurantId;
    try {
        const restaurant = await RestaurantService.deleteRestaurant(restaurantId);
        return restaurant ? res.status(200).json(restaurant) : res.status(404).json({ message: 'not found' });
    } catch (error) {
        return res.status(500).json({ error });
    }
};

const getRestaurantWithCustomers = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const restaurant = await RestaurantService.getRestaurantWithCustomers(req.params.restaurantId);
        if (!restaurant) return res.status(404).json({ message: 'Restaurant not found' });
        return res.status(200).json(restaurant);
    } catch (error) {
        return res.status(500).json({ error });
    }
};

const getRestaurantFull = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const restaurant = await RestaurantService.getRestaurantFull(req.params.restaurantId);
        if (!restaurant) return res.status(404).json({ message: 'Restaurant not found' });
        return res.status(200).json(restaurant);
    } catch (error) {
        return res.status(500).json({ error });
    }
};

const getNearby = async (req: Request, res: Response, next: NextFunction) => {
    const { lng, lat, maxDistance } = req.query;
    if (!lng || !lat) return res.status(400).json({ message: 'lng and lat query params are required' });
    try {
        const restaurants = await RestaurantService.getNearby(
            parseFloat(lng as string),
            parseFloat(lat as string),
            maxDistance ? parseFloat(maxDistance as string) : 5000
        );
        return res.status(200).json(restaurants);
    } catch (error) {
        return res.status(500).json({ error });
    }
};

const getBadges = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const badges = await RestaurantService.getBadges(req.params.restaurantId);
        if (!badges) return res.status(404).json({ message: 'Restaurant not found' });
        return res.status(200).json(badges);
    } catch (error) {
        return res.status(500).json({ error });
    }
};

const getStatistics = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const statistics = await RestaurantService.getStatistics(req.params.restaurantId);
        if (!statistics) return res.status(404).json({ message: 'Restaurant not found' });
        return res.status(200).json(statistics);
    } catch (error) {
        return res.status(500).json({ error });
    }
};

const getFiltered = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { lng, lat, radiusMeters, categories, minRating, city, openNow, openAt } = req.query;
        const results = await RestaurantService.getFilteredRestaurants({
            lng:          lng          ? parseFloat(lng as string)          : undefined,
            lat:          lat          ? parseFloat(lat as string)          : undefined,
            radiusMeters: radiusMeters ? parseFloat(radiusMeters as string) : undefined,
            categories:   categories   ? (categories as string).split(',')  : undefined,
            minRating:    minRating    ? parseFloat(minRating as string)    : undefined,
            city:         city         ? (city as string)                   : undefined,
            openNow:      openNow      === 'true',
            openAt:       openAt       ? (openAt as string)                 : undefined,
        });
        return res.status(200).json(results);
    } catch (error) {
        return res.status(500).json({ error });
    }
};

export default {
    createRestaurant,
    readRestaurant,
    readAll,
    updateRestaurant,
    deleteRestaurant,
    getRestaurantWithCustomers: getRestaurantWithCustomers,
    getRestaurantFull,
    getNearby,
    getBadges,
    getStatistics,
    getFiltered
};