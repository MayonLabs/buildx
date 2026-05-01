import type { VectorDbConfig } from "./types";
import dbConnect from "@/lib/db";
import AppSettings from "@/models/settings.model";
import { decryptValue } from "@/lib/encrypt";

export interface AppConfig {
    vectorDb: VectorDbConfig;
    geminiApiKey?: string;
}

interface CacheEntry {
    config: AppConfig;
    timestamp: number;
}

let cache: CacheEntry | null = null;
const TTL_MS = 60_000;

export async function getGlobalSettings(): Promise<AppConfig> {
    if (cache && Date.now() - cache.timestamp < TTL_MS) {
        return cache.config;
    }

    await dbConnect();
    const settings = await AppSettings.findById("global").lean();

    // Resolve Qdrant config — prefer new vectorDbConfigs, fall back to legacy vectorDb
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const providerCfg: Record<string, any> =
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (settings?.vectorDbConfigs as any)?.qdrant ||
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ((settings?.vectorDb as any)?.provider === "qdrant" ? settings?.vectorDb : {}) ||
        {};

    const vectorDb: VectorDbConfig = {
        provider: "qdrant",
        url: providerCfg.url,
        apiKey: providerCfg.apiKey ? decryptValue(providerCfg.apiKey) : undefined,
        indexName: providerCfg.indexName,
    };

    const config: AppConfig = {
        vectorDb,
        geminiApiKey: settings?.geminiApiKey ? decryptValue(settings.geminiApiKey) : undefined,
    };

    cache = { config, timestamp: Date.now() };
    return config;
}

export async function getGlobalVectorConfig(): Promise<VectorDbConfig> {
    return (await getGlobalSettings()).vectorDb;
}

export function invalidateSettingsCache(): void {
    cache = null;
}
