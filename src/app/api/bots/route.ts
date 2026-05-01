import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import { Bot, Lead } from "@/models";
import { auth } from "@/auth";
import { ensureVectorIndex } from "@/lib/atlas";

// GET /api/bots - List all bots
export async function GET() {
    try {
        const session = await auth();
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await dbConnect();
        const bots = await Bot.find().sort({ createdAt: -1 }).lean();

        // Per-bot lead counts (single aggregation)
        const counts = await Lead.aggregate<{ _id: unknown; count: number }>([
            { $group: { _id: "$botId", count: { $sum: 1 } } },
        ]);
        const countByBot = new Map(counts.map(c => [String(c._id), c.count]));

        const botsWithCounts = bots.map(b => ({
            ...b,
            leadCount: countByBot.get(String(b._id)) || 0,
        }));

        return NextResponse.json({ bots: botsWithCounts });
    } catch (error) {
        console.error("Error fetching bots:", error);
        return NextResponse.json(
            { error: "Failed to fetch bots" },
            { status: 500 }
        );
    }
}

// POST /api/bots - Create a new bot
export async function POST(request: NextRequest) {
    try {
        const session = await auth();
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await dbConnect();
        const body = await request.json();

        const bot = await Bot.create({
            name: body.name,
            systemPrompt: body.systemPrompt,
            temperature: body.temperature,
            aiModel: body.aiModel,
            theme: body.theme,
        });

        // Fire-and-forget: Ensure the vector index exists for this new bot
        // We don't await this so the UI stays snappy
        ensureVectorIndex().catch(err => console.error("Auto-index failed:", err));

        return NextResponse.json({ bot }, { status: 201 });
    } catch (error) {
        console.error("Error creating bot:", error);

        // Handle validation errors
        if (error instanceof Error && error.name === "ValidationError") {
            return NextResponse.json(
                { error: error.message },
                { status: 400 }
            );
        }

        return NextResponse.json(
            { error: "Failed to create bot" },
            { status: 500 }
        );
    }
}
