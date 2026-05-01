import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import dbConnect from "@/lib/db";
import AppSettings from "@/models/settings.model";
import { invalidateSettingsCache } from "@/lib/vector/settings-cache";
import { encryptValue, decryptValue } from "@/lib/encrypt";
import { QdrantVectorProvider } from "@/lib/vector/providers/qdrant";

type ProviderConfig = Record<string, { apiKey?: string; url?: string; indexName?: string }>;

function decryptConfigs(configs: ProviderConfig): ProviderConfig {
    const out: ProviderConfig = {};
    for (const [provider, cfg] of Object.entries(configs)) {
        out[provider] = { ...cfg, apiKey: cfg.apiKey ? decryptValue(cfg.apiKey) : "" };
    }
    return out;
}

function encryptConfigs(configs: ProviderConfig): ProviderConfig {
    const out: ProviderConfig = {};
    for (const [provider, cfg] of Object.entries(configs)) {
        out[provider] = { ...cfg, apiKey: cfg.apiKey ? encryptValue(cfg.apiKey) : "" };
    }
    return out;
}

export async function GET() {
    try {
        const session = await auth();
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        await dbConnect();
        const settings = await AppSettings.findById("global").lean();

        // Determine active provider — always qdrant now
        const activeVectorProvider = "qdrant";

        // Merge legacy vectorDb into vectorDbConfigs for backward compat
        let vectorDbConfigs: ProviderConfig = (settings?.vectorDbConfigs as ProviderConfig) || {};
        if (settings?.vectorDb && Object.keys(vectorDbConfigs).length === 0) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { provider, ...rest } = (settings.vectorDb as any) || {};
            if (provider && rest) vectorDbConfigs = { [provider]: rest };
        }

        return NextResponse.json({
            geminiApiKey: settings?.geminiApiKey ? decryptValue(settings.geminiApiKey) : "",
            activeVectorProvider,
            vectorDbConfigs: decryptConfigs(vectorDbConfigs),
        });
    } catch (error) {
        console.error("Settings GET error:", error);
        return NextResponse.json({ error: "Failed to load settings" }, { status: 500 });
    }
}

export async function PUT(request: NextRequest) {
    try {
        const session = await auth();
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const body = await request.json();
        await dbConnect();

        const updateFields: Record<string, unknown> = {};

        if (body.geminiApiKey !== undefined) {
            updateFields.geminiApiKey = body.geminiApiKey ? encryptValue(body.geminiApiKey) : "";
        }

        // Only qdrant is supported — ignore activeVectorProvider from body
        updateFields.activeVectorProvider = "qdrant";

        if (body.vectorDbConfigs !== undefined) {
            updateFields.vectorDbConfigs = encryptConfigs(body.vectorDbConfigs);
        }

        const settings = await AppSettings.findByIdAndUpdate(
            "global",
            { $set: updateFields },
            { upsert: true, new: true }
        ).lean();

        invalidateSettingsCache();

        // Auto-initialize Qdrant collection when Qdrant is the active provider
        let qdrantInit: { success: boolean; message: string } | null = null;
        const isQdrantActive = (body.activeVectorProvider || settings?.activeVectorProvider) === "qdrant";
        const qdrantCfg = body.vectorDbConfigs?.qdrant;
        if (isQdrantActive && qdrantCfg?.url && qdrantCfg?.indexName) {
            const provider = new QdrantVectorProvider({
                provider: "qdrant",
                url: qdrantCfg.url,
                apiKey: qdrantCfg.apiKey || undefined,
                indexName: qdrantCfg.indexName,
            });
            qdrantInit = await provider.initializeCollection(768);
            if (!qdrantInit.success) console.warn("Qdrant init warning:", qdrantInit.message);
        }

        return NextResponse.json({
            success: true,
            ...(qdrantInit ? { qdrantInit } : {}),
        });
    } catch (error) {
        console.error("Settings PUT error:", error);
        return NextResponse.json({ error: "Failed to save settings" }, { status: 500 });
    }
}
