import { Index } from "@upstash/vector";
import { IVectorProvider, VectorChunk, RetrievedChunk, VectorDbConfig } from "../types";

export class UpstashVectorProvider implements IVectorProvider {
  private config: VectorDbConfig;

  constructor(config: VectorDbConfig) {
    this.config = config;
  }

  private index(): Index {
    return new Index({ url: this.config.url!, token: this.config.apiKey! });
  }

  async upsert(chunks: VectorChunk[]): Promise<void> {
    if (!chunks.length) return;
    const idx = this.index();

    const vectors = chunks.map(chunk => ({
      id: chunk.id, // "${sourceId}_${chunkIndex}"
      vector: chunk.embedding,
      metadata: {
        content: chunk.content,
        botId: chunk.metadata.botId,
        sourceId: chunk.metadata.sourceId,
        chunkIndex: chunk.metadata.chunkIndex,
      },
    }));

    for (let i = 0; i < vectors.length; i += 100) {
      await idx.upsert(vectors.slice(i, i + 100));
    }
  }

  async query(botId: string, queryEmbedding: number[], topK: number): Promise<RetrievedChunk[]> {
    const results = await this.index().query({
      vector: queryEmbedding,
      topK,
      includeMetadata: true,
      filter: `botId = '${botId}'`,
    });

    return results.map(r => ({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      content: (r.metadata as any)?.content || "",
      score: r.score,
    }));
  }

  async delete(botId: string, sourceId: string): Promise<void> {
    const idx = this.index();
    // Query with a zero vector + filter to get all IDs for this sourceId
    const dummyVector = new Array(768).fill(0);
    const results = await idx.query({
      vector: dummyVector,
      topK: 10000,
      includeMetadata: false,
      filter: `sourceId = '${sourceId}'`,
    });
    const ids = results.map(r => r.id as string);
    if (ids.length > 0) {
      await idx.delete(ids);
    }
  }

  async deleteByBot(botId: string): Promise<void> {
    const idx = this.index();
    const dummyVector = new Array(768).fill(0);
    const results = await idx.query({
      vector: dummyVector,
      topK: 10000,
      includeMetadata: false,
      filter: `botId = '${botId}'`,
    });
    const ids = results.map(r => r.id as string);
    if (ids.length > 0) {
      await idx.delete(ids);
    }
  }

  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      await this.index().info();
      return { success: true, message: "Upstash Vector connection successful" };
    } catch (e) {
      return { success: false, message: e instanceof Error ? e.message : "Connection failed" };
    }
  }
}
