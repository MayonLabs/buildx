
import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import { Bot } from "@/models";

interface RouteParams {
    params: Promise<{ publicId: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
    const { publicId } = await params;

    // Handle CORS
    const headers = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
    };

    if (request.method === "OPTIONS") {
        return new NextResponse(null, { headers });
    }

    try {
        await dbConnect();

        const bot = await Bot.findOne({ publicId, isActive: true })
            .select("publicId theme widgetPosition allowedDomains isActive name")
            .lean();

        if (!bot) {
            return NextResponse.json(
                { error: "Bot not found or inactive" },
                { status: 404, headers }
            );
        }

        // Domain Security Check
        if (bot.allowedDomains && bot.allowedDomains.length > 0) {
            const origin = request.headers.get("origin") || request.headers.get("referer");
            // Simple check: if origin exists, verify it matches
            if (origin) {
                const originUrl = new URL(origin);
                const isAllowed = bot.allowedDomains.some(d =>
                    originUrl.hostname === d || originUrl.hostname.endsWith(`.${d}`)
                );

                if (!isAllowed) {
                    return NextResponse.json(
                        { error: "Domain not allowed" },
                        { status: 403, headers }
                    );
                }
            }
        }

        return NextResponse.json({ config: bot }, { headers });

    } catch (error) {
        console.error("Error fetching public bot config:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500, headers }
        );
    }
}
