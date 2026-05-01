import { Pinecone } from "@pinecone-database/pinecone";
import { IVectorProvider, VectorChunk, RetrievedChunk, VectorDbConfig } from "../types";

export class PineconeVectorProvider implements IVectorProvider {
  private config: VectorDbConfig;

  constructor(config: VectorDbConfig) {
    this.config = config;
  }

  private client() {
    return new Pinecone({ apiKey: this.config.apiKey! });
  }

  private ns(botId: string) {
    return this.client().index(this.config.indexName!).namespace(botId);
  }

  async upsert(chunks: VectorChunk[]): Promise<void> {
    if (!chunks.length) return;
    const ns = this.ns(chunks[0].metadata.botId);

    const vectors = chunks.map(chunk => ({
      id: chunk.id, // "${sourceId}_${chunkIndex}"
      values: chunk.embedding,
      metadata: {
        content: chunk.content,
        sourceId: chunk.metadata.sourceId,
        chunkIndex: chunk.metadata.chunkIndex,
      },
    }));

    for (let i = 0; i < vectors.length; i += 100) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await ns.upsert({ records: vectors.slice(i, i + 100) } as any);
    }
  }

  async query(botId: string, queryEmbedding: number[], topK: number): Promise<RetrievedChunk[]> {
    const result = await this.ns(botId).query({
      vector: queryEmbedding,
      topK,
      includeMetadata: true,
    });

    return (result.matches || []).map(m => ({
      content: (m.metadata?.content as string) || "",
      score: m.score || 0,
    }));
  }

  async delete(botId: string, sourceId: string): Promise<void> {
    const ns = this.ns(botId);
    // IDs use prefix "${sourceId}_" so we can list and delete
    const listed = await ns.listPaginated({ prefix: `${sourceId}_` });
    const ids = (listed.vectors || []).map(v => v.id!).filter(Boolean);
    if (ids.length > 0) {
      await ns.deleteMany(ids);
    }
  }

  async deleteByBot(botId: string): Promise<void> {
    // Each bot lives in its own namespace, so wiping the namespace is enough.
    await this.ns(botId).deleteAll();
  }

  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      await this.client().listIndexes();
      return { success: true, message: "Pinecone connection successful" };
    } catch (e) {
      return { success: false, message: e instanceof Error ? e.message : "Connection failed" };
    }
  }
}
