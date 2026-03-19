import { Schema, model, Types } from 'mongoose';

// 1️⃣ Interface
export interface IReview {
    _id?: Types.ObjectId;
    customer_id: Types.ObjectId; // referencia a Customer
    restaurant_id: Types.ObjectId;      // referencia a Restaurant
    date: Date;                         // fecha de la reseña
    rating: number;                     // puntuación global (1-10)
    ratings?: {
        foodQuality?: number;
        staffService?: number;
        cleanliness?: number;
        environment?: number;
    };
    comment?: string;                   // comentario del cliente
    likes?: number;                     // número de likes
    createdAt?: Date;
    updatedAt?: Date;
}

// 2️⃣ Schema
const reviewSchema = new Schema<IReview>({
    customer_id: { type: Schema.Types.ObjectId, ref: 'Customer', required: true},
    restaurant_id: { type: Schema.Types.ObjectId, ref: 'Restaurant', required: true },
    date: { type: Date, required: true, default: Date.now },
    rating: { type: Number, required: true, min: 1, max: 10 },
    ratings: { foodQuality: { type: Number, min: 0, max: 10 },
        staffService: { type: Number, min: 0, max: 10 },
        cleanliness: { type: Number, min: 0, max: 10 },
        environment: { type: Number, min: 0, max: 10}
    },
    comment: { type: String, trim: true },
    likes: { type: Number, default: 0 }
}, {
    timestamps: true
});

// Evita que un mismo cliente haga más de una review al mismo restaurante
reviewSchema.index({ customer_id: 1, restaurant_id: 1 }, { unique: true });

// 3️⃣ Model
export const ReviewModel = model<IReview>('Review', reviewSchema);