import mongoose, { Schema, Document } from "mongoose";

export interface IRateLimit extends Document {
    ip: string;
    count: number;
    expiresAt: Date;
}

const RateLimitSchema = new Schema<IRateLimit>(
    {
        ip: { type: String, required: true },
        count: { type: Number, default: 1 },
        expiresAt: { type: Date, required: true },
    },
    { timestamps: true }
);

// TTL Index: Deletes the document automatically when `expiresAt` is reached
RateLimitSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Compound index for fast lookups
RateLimitSchema.index({ ip: 1, expiresAt: 1 });

export const RateLimit =
    mongoose.models.RateLimit || mongoose.model<IRateLimit>("RateLimit", RateLimitSchema);
