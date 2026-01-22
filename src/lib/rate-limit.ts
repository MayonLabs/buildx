import { RateLimit } from "@/models";
import dbConnect from "./db";

type RateLimitResult = {
    success: boolean;
    remaining: number;
    reset?: Date;
};

/**
 * Checks if the given identifier (IP) has exceeded the rate limit.
 * 
 * Default: 10 requests per 60 seconds.
 */
export async function checkRateLimit(
    identifier: string,
    limit: number = 20,
    windowSeconds: number = 60
): Promise<RateLimitResult> {
    try {
        await dbConnect();

        const now = new Date();
        const expiresAt = new Date(now.getTime() + windowSeconds * 1000);

        // Atomic upsert:
        // - If exists: Increment count
        // - If new: Create with count=1 and set expiration
        const record = await RateLimit.findOneAndUpdate(
            { ip: identifier, expiresAt: { $gt: now } }, // Find valid window
            {
                $inc: { count: 1 },
                $setOnInsert: { ip: identifier, expiresAt: expiresAt },
            },
            {
                upsert: true,
                new: true, // Return updated doc
                setDefaultsOnInsert: true,
            }
        );

        const currentCount = record.count;
        const remaining = Math.max(0, limit - currentCount);

        if (currentCount > limit) {
            return {
                success: false,
                remaining: 0,
                reset: record.expiresAt,
            };
        }

        return {
            success: true,
            remaining,
            reset: record.expiresAt,
        };
    } catch (error) {
        console.error("Rate Limit Error:", error);
        // Fail open (allow request) if DB fails, to prevent blocking legitimate users
        return { success: true, remaining: 1 };
    }
}
