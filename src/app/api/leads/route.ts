import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import dbConnect from "@/lib/db";
import { Lead, Bot } from "@/models";
import { auth } from "@/auth";

const PAGE_SIZE = 20;

// GET /api/leads?botId=&status=&q=&page=
export async function GET(request: NextRequest) {
    try {
        const session = await auth();
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await dbConnect();

        const { searchParams } = new URL(request.url);
        const botIdParam = searchParams.get("botId");
        const status = searchParams.get("status");
        const q = searchParams.get("q")?.trim();
        const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));

        const filter: Record<string, unknown> = {};

        if (botIdParam) {
            if (!mongoose.isValidObjectId(botIdParam)) {
                return NextResponse.json(
                    { error: "Invalid botId" },
                    { status: 400 }
                );
            }
            filter.botId = botIdParam;
        }

        if (status && ["new", "contacted", "qualified", "archived"].includes(status)) {
            filter.status = status;
        }

        if (q) {
            const re = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
            filter.$or = [{ name: re }, { email: re }, { phone: re }, { intent: re }];
        }

        const [items, total] = await Promise.all([
            Lead.find(filter)
                .sort({ createdAt: -1 })
                .skip((page - 1) * PAGE_SIZE)
                .limit(PAGE_SIZE)
                .select("-transcript")
                .lean(),
            Lead.countDocuments(filter),
        ]);

        // Attach bot names for the inbox table
        const botIds = Array.from(new Set(items.map(l => String(l.botId))));
        const bots = await Bot.find({ _id: { $in: botIds } })
            .select("_id name")
            .lean();
        const botNameById = new Map(bots.map(b => [String(b._id), b.name]));

        const leads = items.map(l => ({
            ...l,
            botName: botNameById.get(String(l.botId)) || "Unknown",
        }));

        return NextResponse.json({
            leads,
            page,
            pageSize: PAGE_SIZE,
            total,
            totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
        });
    } catch (error) {
        console.error("Error listing leads:", error);
        return NextResponse.json(
            { error: "Failed to list leads" },
            { status: 500 }
        );
    }
}
