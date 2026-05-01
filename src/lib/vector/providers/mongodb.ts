import { IVectorProvider, VectorChunk, RetrievedChunk } from "../types";
import dbConnect from "@/lib/db";
import mongoose from "mongoose";

export class MongoDBVectorProvider implements IVectorProvider {
  async upsert(chunks: VectorChunk[]): Promise<void> {
    if (!chunks.length) return;
    const conn = await dbConnect();
    // @ts-expect-error — conn.connection.db is untyped in mongoose typedefs
    const collection = conn.connection.db.collection("knowledgechunks");

    const docs = chunks.map(chunk => ({
      botId: new mongoose.Types.ObjectId(chunk.metadata.botId),
      sourceId: new mongoose.Types.ObjectId(chunk.metadata.sourceId),
      content: chunk.content,
      embedding: chunk.embedding,
      chunkIndex: chunk.metadata.chunkIndex,
      createdAt: new Date(),
    }));

    await collection.insertMany(docs);
  }

  async query(botId: string, queryEmbedding: number[], topK: number): Promise<RetrievedChunk[]> {
    const conn = await dbConnect();
    // @ts-expect-error — conn.connection.db is untyped in mongoose typedefs
    const collection = conn.connection.db.collection("knowledgechunks");

    const results = await collection.aggregate([
      {
        $vectorSearch: {
          index: "vector_index_v2",
          path: "embedding",
          queryVector: queryEmbedding,
          numCandidates: 100,
          limit: topK,
          filter: { botId: { $eq: new mongoose.Types.ObjectId(botId) } },
        },
      },
      {
        $project: { content: 1, score: { $meta: "vectorSearchScore" } },
      },
    ]).toArray();

    return results.map(r => ({ content: r.content, score: r.score }));
  }

  async delete(botId: string, sourceId: string): Promise<void> {
    const conn = await dbConnect();
    // @ts-expect-error — conn.connection.db is untyped in mongoose typedefs
    const collection = conn.connection.db.collection("knowledgechunks");
    await collection.deleteMany({ sourceId: new mongoose.Types.ObjectId(sourceId) });
  }

  async deleteByBot(botId: string): Promise<void> {
    const conn = await dbConnect();
    // @ts-expect-error — conn.connection.db is untyped in mongoose typedefs
    const collection = conn.connection.db.collection("knowledgechunks");
    await collection.deleteMany({ botId: new mongoose.Types.ObjectId(botId) });
  }

  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      await dbConnect();
      return { success: true, message: "MongoDB Atlas Vector Search connected" };
    } catch (e) {
      return { success: false, message: e instanceof Error ? e.message : "Connection failed" };
    }
  }
}
