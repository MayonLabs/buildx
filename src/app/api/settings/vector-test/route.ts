import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getVectorProvider } from "@/lib/vector";
import type { VectorDbConfig } from "@/lib/vector";

export async function POST(request: NextRequest) {
    try {
        const session = await auth();
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const config = await request.json() as VectorDbConfig;

        if (!config.provider) {
            return NextResponse.json({ error: "provider is required" }, { status: 400 });
        }

        const provider = getVectorProvider(config);
        const result = await provider.testConnection();

        return NextResponse.json(result, { status: result.success ? 200 : 400 });
    } catch (error) {
        return NextResponse.json(
            { success: false, message: error instanceof Error ? error.message : "Connection failed" },
            { status: 400 }
        );
    }
}
