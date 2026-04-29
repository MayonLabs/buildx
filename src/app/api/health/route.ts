import { NextResponse } from "next/server";
import mongoose from "mongoose";
import dbConnect from "@/lib/db";
import { getGlobalSettings } from "@/lib/vector/settings-cache";

export async function GET() {
    try {
        // Measure start time for latency
        const start = performance.now();

        // Connect to DB if not connected
        await dbConnect();

        // Ping database to check connection and latency
        // readyState: 0=disconnected, 1=connected, 2=connecting, 3=disconnecting
        const dbStatus = mongoose.connection.readyState === 1 ? "connected" : "disconnected";

        // Perform a simple ping command
        if (mongoose.connection.db) {
            await mongoose.connection.db.admin().ping();
        }

        const latency = Math.round(performance.now() - start);

        const globalSettings = await getGlobalSettings();
        const hasGeminiKey = !!globalSettings.geminiApiKey;

        return NextResponse.json({
            status: "healthy",
            uptime: process.uptime(),
            timestamp: new Date().toISOString(),
            services: {
                database: {
                    status: dbStatus,
                    latency: `${latency}ms`,
                },
                gemini: {
                    status: hasGeminiKey ? "configured" : "missing_key",
                }
            }
        });
    } catch (error) {
        console.error("Health check failed:", error);
        return NextResponse.json({
            status: "unhealthy",
            error: error instanceof Error ? error.message : "Unknown error",
            timestamp: new Date().toISOString(),
            services: {
                database: {
                    status: "error",
                    latency: "N/A"
                }
            }
        }, { status: 500 });
    }
}
