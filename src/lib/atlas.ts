import { MongoClient } from "mongodb";

/**
 * Ensures the Vector Search index exists on the 'knowledgechunks' collection.
 * This is safe to run multiple times; it checks existence first.
 */
export async function ensureVectorIndex() {
    const MONGODB_URI = process.env.MONGODB_URI;
    if (!MONGODB_URI) {
        throw new Error("MONGODB_URI not configured");
    }

    // Use a separate client for administrative operations to avoid messing with Mongoose's pool
    const client = new MongoClient(MONGODB_URI);

    try {
        await client.connect();
        const db = client.db();
        const collectionName = "knowledgechunks";

        // 0. Ensure collection exists (Fixes 'NamespaceNotFound' on fresh DBs)
        const collections = await db.listCollections({ name: collectionName }).toArray();
        if (collections.length === 0) {
            console.log(`⚠️ Collection '${collectionName}' missing. Creating it...`);
            await db.createCollection(collectionName);
        }

        const collection = db.collection(collectionName);

        // 1. Check existing indexes
        const indexes = await collection.listSearchIndexes().toArray();
        const exists = indexes.some((idx) => idx.name === "vector_index_v2");

        if (exists) {
            console.log("✅ Vector Index 'vector_index_v2' already exists.");
            return { result: "already_exists" };
        }

        console.log("⚠️ Vector Index missing. Creating 'vector_index_v2'...");

        // 2. Create index if missing
        const result = await collection.createSearchIndex({
            name: "vector_index_v2",
            type: "vectorSearch",
            definition: {
                fields: [
                    {
                        type: "vector",
                        path: "embedding",
                        numDimensions: 768,
                        similarity: "cosine",
                    },
                    {
                        type: "filter",
                        path: "botId",
                    },
                ],
            },
        });

        console.log("🚀 Index creation initiated:", result);
        return { result: "created", details: result };
    } catch (error) {
        console.error("❌ Failed to ensure vector index:", error);
        // Don't throw explicitly to avoid breaking the calling API (e.g., bot creation)
        // Just log it. The user might be on local DB where this isn't supported.
        return { error: error instanceof Error ? error.message : "Unknown error" };
    } finally {
        await client.close();
    }
}
