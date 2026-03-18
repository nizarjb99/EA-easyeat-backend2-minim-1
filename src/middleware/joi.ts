import Joi, { ObjectSchema } from 'joi';
import { NextFunction, Request, Response } from 'express';
import { IBadge } from '../models/badge';
import { ICustomer } from '../models/customer';
import { IEmployee } from '../models/employee';
import { IPointsWallet } from '../models/pointsWallet';
import { IRestaurant } from '../models/restaurant';
import { IReview } from '../models/review';
import { IReward } from '../models/reward';
import { IRewardRedemption } from '../models/rewardRedemption';
import { IStatistics } from '../models/statistics';
import { IVisit } from '../models/visit';

import Logging from '../library/logging';

export const ValidateJoi = (schema: ObjectSchema) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            console.log("BODY RECIBIDO:", JSON.stringify(req.body));
            await schema.validateAsync(req.body);

            next();
        } catch (error) {
            Logging.error(error);
            return res.status(422).json({ error });
        }
    };
};

const timetableDaySchema = Joi.array().items(
    Joi.object({
        open: Joi.string(),
        close: Joi.string()
    })
);

const timetableSchema = Joi.object({
    monday: timetableDaySchema,
    tuesday: timetableDaySchema,
    wednesday: timetableDaySchema,
    thursday: timetableDaySchema,
    friday: timetableDaySchema,
    saturday: timetableDaySchema,
    sunday: timetableDaySchema
});

const categoryEnum = [
    'Italià', 'Japonès', 'Sushi', 'Mexicà', 'Xinès', 'Indi', 'Tailandès', 'Francès',
    'Espanyol', 'Grec', 'Turc', 'Coreà', 'Vietnamita', 'Alemany', 'Brasileny', 'Peruà',
    'Vegà', 'Vegetarià', 'Marisc', 'Carn', 'Pizzeria', 'Cafeteria', 'Ramen', 'Gluten Free',
    'Gourmet', 'Fast Food', 'Buffet', 'Food Truck', 'Lounge', 'Pub', 'Wine Bar', 'Rooftop',
    'Bar', 'Taperia', 'Gelateria', 'Estrella Michelin'
];

const objectId = Joi.string().length(24).hex();

// Password rules centralitzades — fàcil de modificar en un sol lloc
const passwordSchema = Joi.string().min(8).max(128);
const passwordUpdateSchema = Joi.string().min(8).max(128); // opcional en update

export const Schemas = {

    badge: {
        create: Joi.object<IBadge>({
            title: Joi.string().required(),
            description: Joi.string().required(),
            type: Joi.string().required()
        }),
        update: Joi.object<IBadge>({
            title: Joi.string(),
            description: Joi.string(),
            type: Joi.string()
        })
    },

    customer: {
        // El client envia 'password' (text pla). El controller el hasheja abans de guardar.
        create: Joi.object<ICustomer>({
            name: Joi.string().required(),
            email: Joi.string().email().required(),
            password: passwordSchema,
            profilePictures: Joi.array().items(Joi.string().uri()),
            pointsWallet: Joi.array().items(objectId),
            visitHistory: Joi.array().items(objectId),
            favoriteRestaurants: Joi.array().items(objectId),
            badges: Joi.array().items(objectId),
            reviews: Joi.array().items(objectId)
        }),
        update: Joi.object<ICustomer>({
            name: Joi.string(),
            email: Joi.string().email(),
            password: passwordUpdateSchema,
            profilePictures: Joi.array().items(Joi.string().uri()),
            pointsWallet: Joi.array().items(objectId),
            visitHistory: Joi.array().items(objectId),
            favoriteRestaurants: Joi.array().items(objectId),
            badges: Joi.array().items(objectId),
            reviews: Joi.array().items(objectId)
        })
    },

    employee: {
        // El client envia 'password' (text pla). El controller el hasheja abans de guardar.
        create: Joi.object<IEmployee>({
            restaurant_id: objectId.required(),
            profile: Joi.object({
                name: Joi.string().required(),
                email: Joi.string().email(),
                phone: Joi.string().trim(),
                password: passwordSchema,
                role: Joi.string().valid('owner', 'staff').default('staff').required()
            }).required(),
            isActive: Joi.boolean().default(true)
        }),
        update: Joi.object<IEmployee>({
            profile: Joi.object({
                name: Joi.string(),
                email: Joi.string().email(),
                phone: Joi.string().trim(),
                password: passwordSchema,
                role: Joi.string().valid('owner', 'staff')
            }),
            isActive: Joi.boolean()
        })
    },

    pointsWallet: {
        create: Joi.object<IPointsWallet>({
            customer_id: objectId.required(),
            restaurant_id: objectId.required(),
            points: Joi.number().min(0).default(0)
        }),
        update: Joi.object<IPointsWallet>({
            points: Joi.number().min(0).required()
        })
    },

    rewardRedemption: {
        create: Joi.object<IRewardRedemption>({
            customer_id: objectId.required(),
            restaurant_id: objectId.required(),
            reward_id: objectId.required(),
            employee_id: objectId,
            pointsUsed: Joi.number().min(0).required(),
            status: Joi.string().valid('pending', 'approved', 'redeemed', 'cancelled', 'expired').default('pending'),
            redeemedAt: Joi.date().default(() => new Date()),
            notes: Joi.string().trim()
        }),
        update: Joi.object<IRewardRedemption>({
            employee_id: objectId,
            pointsUsed: Joi.number().min(0),
            status: Joi.string().valid('pending', 'approved', 'redeemed', 'cancelled', 'expired'),
            redeemedAt: Joi.date(),
            notes: Joi.string().trim()
        })
    },

    review: {
        create: Joi.object<IReview>({
            customer_id: objectId.required(),
            restaurant_id: objectId.required(),
            date: Joi.date().required(),
            ratings: Joi.object({
                foodQuality: Joi.number().min(0).max(10),
                staffService: Joi.number().min(0).max(10),
                cleanliness: Joi.number().min(0).max(10),
                environment: Joi.number().min(0).max(10)
            }),
            comment: Joi.string(),
            photos: Joi.array().items(Joi.string().uri()),
            likes: Joi.number().min(0).default(0),
            extraPoints: Joi.number().min(0).default(0)
        }),
        update: Joi.object<IReview>({
            date: Joi.date(),
            ratings: Joi.object({
                foodQuality: Joi.number().min(0).max(10),
                staffService: Joi.number().min(0).max(10),
                cleanliness: Joi.number().min(0).max(10),
                environment: Joi.number().min(0).max(10)
            }),
            comment: Joi.string(),
            photos: Joi.array().items(Joi.string().uri()),
            likes: Joi.number().min(0),
            extraPoints: Joi.number().min(0)
        })
    },

    reward: {
        create: Joi.object<IReward>({
            restaurant_id: objectId.required(),
            name: Joi.string().required(),
            description: Joi.string().required(),
            pointsRequired: Joi.number().min(0),
            active: Joi.boolean().default(true),
            expiry: Joi.date(),
            timesRedeemed: Joi.number().min(0).default(0)
        }),
        update: Joi.object<IReward>({
            name: Joi.string(),
            description: Joi.string(),
            pointsRequired: Joi.number().min(0),
            active: Joi.boolean(),
            expiry: Joi.date(),
            timesRedeemed: Joi.number().min(0)
        })
    },

    statistics: {
        create: Joi.object<IStatistics>({
            restaurant_id: objectId.required(),
            totalPointsGiven: Joi.number().min(0).default(0),
            loyalCustomers: Joi.number().min(0).default(0),
            mostRequestedRewards: Joi.array().items(objectId),
            averagePointsPerVisit: Joi.number().min(0).default(0)
        }),
        update: Joi.object<IStatistics>({
            totalPointsGiven: Joi.number().min(0),
            loyalCustomers: Joi.number().min(0),
            mostRequestedRewards: Joi.array().items(objectId),
            averagePointsPerVisit: Joi.number().min(0)
        })
    },

    visit: {
        create: Joi.object<IVisit>({
            customer_id: objectId.required(),
            restaurant_id: objectId.required(),
            date: Joi.date().default(() => new Date()),
            pointsEarned: Joi.number().min(0).default(0),
            billAmount: Joi.number().min(0).default(0)
        }),
        update: Joi.object<IVisit>({
            date: Joi.date(),
            pointsEarned: Joi.number().min(0),
            billAmount: Joi.number().min(0)
        })
    },

    restaurant: {
        create: Joi.object<IRestaurant>({
            profile: Joi.object({
                name: Joi.string().required(),
                description: Joi.string().required(),
                category: Joi.array().items(Joi.string().valid(...categoryEnum)).min(1).required(),
                location: Joi.object({
                    city: Joi.string().required(),
                    // Remove .required() from address and coordinates
                    address: Joi.string().allow(''),
                    coordinates: Joi.object({
                        type: Joi.string().valid('Point').default('Point'),
                        coordinates: Joi.array().items(Joi.number()).length(2)
                    }).optional()
                }).required()
            }).required(),

            employees: Joi.array().items(objectId),
            dishes: Joi.array().items(objectId),
            rewards: Joi.array().items(objectId),
            statistics: objectId,
            badges: Joi.array().items(objectId)
        }),
        update: Joi.object<IRestaurant>({
            profile: Joi.object({
                name: Joi.string(),
                description: Joi.string(),
                rating: Joi.number().min(0).max(10),
                category: Joi.array().items(Joi.string().valid(...categoryEnum)),
                timetable: timetableSchema,
                image: Joi.array().items(Joi.string().uri()),

                contact: Joi.object({
                    phone: Joi.string(),
                    email: Joi.string().email()
                }),

                location: Joi.object({
                    city: Joi.string(),
                    address: Joi.string(),
                    googlePlaceId: Joi.string(),
                    coordinates: Joi.object({
                        type: Joi.string().valid('Point'),
                        coordinates: Joi.array().items(Joi.number()).length(2)
                    })
                })
            }),

            employees: Joi.array().items(objectId),
            dishes: Joi.array().items(objectId),
            rewards: Joi.array().items(objectId),
            statistics: objectId,
            badges: Joi.array().items(objectId)
        })
    }
};