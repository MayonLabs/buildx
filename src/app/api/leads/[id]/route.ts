import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import dbConnect from "@/lib/db";
import { Lead, Bot } from "@/models";
import { auth } from "@/auth";

interface RouteParams {
    params: Promise<{ id: string }>;
}

const ALLOWED_STATUSES = ["new", "contacted", "qualified", "archived"] as const;

// GET /api/leads/[id]
export async function GET(_request: NextRequest, { params }: RouteParams) {
    try {
        const session = await auth();
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        if (!mongoose.isValidObjectId(id)) {
            return NextResponse.json({ error: "Invalid lead ID" }, { status: 400 });
        }

        await dbConnect();
        const lead = await Lead.findById(id).lean();
        if (!lead) {
            return NextResponse.json({ error: "Lead not found" }, { status: 404 });
        }

        const bot = await Bot.findById(lead.botId).select("_id name publicId").lean();

        return NextResponse.json({
            lead: { ...lead, bot: bot || null },
        });
    } catch (error) {
        console.error("Error fetching lead:", error);
        return NextResponse.json(
            { error: "Failed to fetch lead" },
            { status: 500 }
        );
    }
}

// PATCH /api/leads/[id] — update status / qualificationNotes
export async function PATCH(request: NextRequest, { params }: RouteParams) {
    try {
        const session = await auth();
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        if (!mongoose.isValidObjectId(id)) {
            return NextResponse.json({ error: "Invalid lead ID" }, { status: 400 });
        }

        const body = await request.json();
        const updates: Record<string, unknown> = {};

        if (typeof body.status === "string") {
            if (!ALLOWED_STATUSES.includes(body.status)) {
                return NextResponse.json(
                    { error: "Invalid status" },
                    { status: 400 }
                );
            }
            updates.status = body.status;
        }

        if (typeof body.qualificationNotes === "string") {
            updates.qualificationNotes = body.qualificationNotes;
        }

        if (Object.keys(updates).length === 0) {
            return NextResponse.json(
                { error: "No valid fields to update" },
                { status: 400 }
            );
        }

        await dbConnect();
        const lead = await Lead.findByIdAndUpdate(id, updates, {
            new: true,
            runValidators: true,
        }).lean();

        if (!lead) {
            return NextResponse.json({ error: "Lead not found" }, { status: 404 });
        }

        return NextResponse.json({ lead });
    } catch (error) {
        console.error("Error updating lead:", error);
        return NextResponse.json(
            { error: "Failed to update lead" },
            { status: 500 }
        );
    }
}

// DELETE /api/leads/[id]
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
    try {
        const session = await auth();
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        if (!mongoose.isValidObjectId(id)) {
            return NextResponse.json({ error: "Invalid lead ID" }, { status: 400 });
        }

        await dbConnect();
        const lead = await Lead.findByIdAndDelete(id).lean();
        if (!lead) {
            return NextResponse.json({ error: "Lead not found" }, { status: 404 });
        }

        return NextResponse.json({ message: "Lead deleted successfully" });
    } catch (error) {
        console.error("Error deleting lead:", error);
        return NextResponse.json(
            { error: "Failed to delete lead" },
            { status: 500 }
        );
    }
}
