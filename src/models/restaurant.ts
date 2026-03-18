import { Schema, model, Types } from "mongoose";

// 1️⃣ Interface
export interface IRestaurant {
    _id?: Types.ObjectId;
    profile: {
        name: string;
        description: string;
        rating?: number;
        category: string[];
        timetable?: {
            monday?: [{ open: string, close: string }];
            tuesday?: [{ open: string, close: string }];
            wednesday?: [{ open: string, close: string }];
            thursday?: [{ open: string, close: string }];
            friday?: [{ open: string, close: string }];
            saturday?: [{ open: string, close: string }];
            sunday?: [{ open: string, close: string }];
        };
        image?: string[];
        contact?: {
            phone?: string;
            email?: string;
        };
        location: {
            city: string;
            address?: string;
            googlePlaceId?: string;
            coordinates?: {
                type: string;
                coordinates: [number, number];
            };
        };
    };
    employees?: Types.ObjectId[];
    dishes?: Types.ObjectId[];
    rewards?: Types.ObjectId[];
    statistics?: Types.ObjectId;
    badges?: Types.ObjectId[];
}

// 2️⃣ Schema
const restaurantSchema = new Schema<IRestaurant>(
    {
        profile: {
            name: { type: String, required: true },
            description: { type: String, required: true },
            rating: { type: Number, default: 0 },
            category: {
                type: [{
                    type: String,
                    required: true,
                    enum: [
                        'Italià', 'Japonès', 'Sushi', 'Mexicà', 'Xinès', 'Indi', 'Tailandès', 'Francès',
                        'Espanyol', 'Grec', 'Turc', 'Coreà', 'Vietnamita', 'Alemany', 'Brasileny', 'Peruà',
                        'Vegà', 'Vegetarià', 'Marisc', 'Carn', 'Pizzeria', 'Cafeteria', 'Ramen', 'Gluten Free',
                        'Gourmet', 'Fast Food', 'Buffet', 'Food Truck', 'Lounge', 'Pub', 'Wine Bar', 'Rooftop',
                        'Bar', 'Taperia', 'Gelateria', 'Estrella Michelin', 'Street Food'
                    ]
                }],
                required: true
            },
            timetable: {
                monday: [{ open: { type: String }, close: { type: String } }],
                tuesday: [{ open: { type: String }, close: { type: String } }],
                wednesday: [{ open: { type: String }, close: { type: String } }],
                thursday: [{ open: { type: String }, close: { type: String } }],
                friday: [{ open: { type: String }, close: { type: String } }],
                saturday: [{ open: { type: String }, close: { type: String } }],
                sunday: [{ open: { type: String }, close: { type: String } }]
            },
            image: [{ type: String }],
            contact: {
                phone: { type: String },
                email: { type: String }
            },
            location: {
                city: { type: String, required: true },
                address: { type: String, required: false, default: '' },
                googlePlaceId: { type: String, required: false },
                coordinates: {
                    type: { type: String, enum: ['Point'] },
                    coordinates: { type: [Number], required: false }
                }
            },
        },
        employees:  [{ type: Schema.Types.ObjectId, ref: "Employee" }],
        dishes:     [{ type: Schema.Types.ObjectId, ref: "Dish" }],
        rewards:    [{ type: Schema.Types.ObjectId, ref: "Reward" }],
        statistics: { type: Schema.Types.ObjectId, ref: "Statistics" },
        badges:     [{ type: Schema.Types.ObjectId, ref: "Badge" }]
    },
    { timestamps: true }
);

// Uncomment once coordinates are always provided and valid:
// Geospatial — required for $geoNear / $near
restaurantSchema.index(
    { 'profile.location.coordinates': '2dsphere' },
    { sparse: true }
);

// Compound — covers the most common filter combos
restaurantSchema.index({
    'profile.rating':       -1,
    'profile.category':      1,
    'profile.location.city': 1,
});

export const RestaurantModel = model<IRestaurant>("Restaurant", restaurantSchema);