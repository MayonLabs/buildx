import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import { Bot } from "@/models";
import { auth } from "@/auth";
import mongoose from "mongoose";

interface RouteParams {
    params: Promise<{ id: string }>;
}

// GET /api/bots/[id] - Get a single bot
export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const session = await auth();
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;

        await dbConnect();

        // Check if id is a valid ObjectId or a publicId
        const query = mongoose.isValidObjectId(id)
            ? { _id: id }
            : { publicId: id };

        const bot = await Bot.findOne(query).lean();

        if (!bot) {
            return NextResponse.json({ error: "Bot not found" }, { status: 404 });
        }

        return NextResponse.json({ bot });
    } catch (error) {
        console.error("Error fetching bot:", error);
        return NextResponse.json(
            { error: "Failed to fetch bot" },
            { status: 500 }
        );
    }
}

// PUT /api/bots/[id] - Update a bot
export async function PUT(request: NextRequest, { params }: RouteParams) {
    try {
        const session = await auth();
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;

        await dbConnect();
        const body = await request.json();

        // Validate ObjectId
        if (!mongoose.isValidObjectId(id)) {
            return NextResponse.json({ error: "Invalid bot ID" }, { status: 400 });
        }

        const bot = await Bot.findByIdAndUpdate(
            id,
            {
                name: body.name,
                systemPrompt: body.systemPrompt,
                temperature: body.temperature,
                aiModel: body.aiModel,
                theme: body.theme,
                allowedDomains: body.allowedDomains,
                widgetPosition: body.widgetPosition,
                isActive: body.isActive,
            },
            { new: true, runValidators: true }
        ).lean();

        if (!bot) {
            return NextResponse.json({ error: "Bot not found" }, { status: 404 });
        }

        return NextResponse.json({ bot });
    } catch (error) {
        console.error("Error updating bot:", error);

        if (error instanceof Error && error.name === "ValidationError") {
            return NextResponse.json({ error: error.message }, { status: 400 });
        }

        return NextResponse.json(
            { error: "Failed to update bot" },
            { status: 500 }
        );
    }
}

// DELETE /api/bots/[id] - Delete a bot
export async function DELETE(request: NextRequest, { params }: RouteParams) {
    try {
        const session = await auth();
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;

        await dbConnect();

        if (!mongoose.isValidObjectId(id)) {
            return NextResponse.json({ error: "Invalid bot ID" }, { status: 400 });
        }

        const bot = await Bot.findByIdAndDelete(id).lean();

        if (!bot) {
            return NextResponse.json({ error: "Bot not found" }, { status: 404 });
        }

        return NextResponse.json({ message: "Bot deleted successfully" });
    } catch (error) {
        console.error("Error deleting bot:", error);
        return NextResponse.json(
            { error: "Failed to delete bot" },
            { status: 500 }
        );
    }
}
