import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { ensureVectorIndex } from "@/lib/atlas";

// Force dynamic to prevent caching
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
    try {
        const session = await auth();
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        console.log("Admin triggering vector index setup...");
        const result = await ensureVectorIndex();

        if (result.error) {
            return NextResponse.json({ error: result.error }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            message: result.result === "created"
                ? "Index creation initiated. Please wait 1-2 minutes."
                : "Index already exists."
        });

    } catch (error: any) {
        console.error("Setup API error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
