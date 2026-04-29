import { QdrantClient } from "@qdrant/js-client-rest";
import { createHash } from "crypto";
import { IVectorProvider, VectorChunk, RetrievedChunk, VectorDbConfig } from "../types";

export class QdrantVectorProvider implements IVectorProvider {
  private client: QdrantClient;
  private config: VectorDbConfig;

  constructor(config: VectorDbConfig) {
    this.config = config;
    this.client = new QdrantClient({
      url: config.url,
      ...(config.apiKey ? { apiKey: config.apiKey } : {}),
    });
  }

  private toUUID(str: string): string {
    const h = createHash("md5").update(str).digest("hex");
    return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20, 32)}`;
  }

  // Called on settings save — creates collection + payload indexes, idempotent
  async initializeCollection(vectorSize = 768): Promise<{ success: boolean; message: string }> {
    const name = this.config.indexName!;
    try {
      let created = false;
      try {
        const info = await this.client.getCollection(name);
        const existingSize = (info.config?.params?.vectors as any)?.size;
        if (existingSize && existingSize !== vectorSize) {
          await this.client.deleteCollection(name);
          throw new Error("recreate");
        }
      } catch {
        await this.client.createCollection(name, {
          vectors: { size: vectorSize, distance: "Cosine" },
        });
        created = true;
      }

      await Promise.all([
        this.client.createPayloadIndex(name, { field_name: "botId", field_schema: "keyword" }).catch(() => {}),
        this.client.createPayloadIndex(name, { field_name: "sourceId", field_schema: "keyword" }).catch(() => {}),
      ]);

      return {
        success: true,
        message: created
          ? `Collection "${name}" created (${vectorSize}-dim, cosine) with payload indexes.`
          : `Collection "${name}" verified — payload indexes ensured.`,
      };
    } catch (e) {
      return {
        success: false,
        message: e instanceof Error ? e.message : "Collection initialization failed",
      };
    }
  }

  async getCollectionInfo(): Promise<{
    exists: boolean;
    vectorCount: number;
    dimensions: number;
    indexedFields: string[];
  }> {
    const name = this.config.indexName!;
    try {
      const info = await this.client.getCollection(name);
      const params = info.config?.params?.vectors as any;
      const payload = info.payload_schema || {};
      return {
        exists: true,
        vectorCount: info.vectors_count ?? 0,
        dimensions: params?.size ?? 0,
        indexedFields: Object.keys(payload),
      };
    } catch {
      return { exists: false, vectorCount: 0, dimensions: 0, indexedFields: [] };
    }
  }

  async dropCollection(): Promise<void> {
    await this.client.deleteCollection(this.config.indexName!);
  }

  async upsert(chunks: VectorChunk[]): Promise<void> {
    if (!chunks.length) return;

    const points = chunks.map(chunk => ({
      id: this.toUUID(chunk.id),
      vector: chunk.embedding,
      payload: {
        content: chunk.content,
        botId: chunk.metadata.botId,
        sourceId: chunk.metadata.sourceId,
        chunkIndex: chunk.metadata.chunkIndex,
      },
    }));

    await this.client.upsert(this.config.indexName!, { points, wait: true });
  }

  async query(botId: string, queryEmbedding: number[], topK: number): Promise<RetrievedChunk[]> {
    const doSearch = () =>
      this.client.search(this.config.indexName!, {
        vector: queryEmbedding,
        limit: topK,
        filter: { must: [{ key: "botId", match: { value: botId } }] },
        with_payload: true,
      });

    try {
      const results = await doSearch();
      return results.map(r => ({
        content: (r.payload?.content as string) || "",
        score: r.score,
      }));
    } catch (e: any) {
      if (this.isIndexMissingError(e)) {
        await this.ensurePayloadIndexes();
        const results = await doSearch();
        return results.map(r => ({
          content: (r.payload?.content as string) || "",
          score: r.score,
        }));
      }
      const detail = e?.data?.status?.error || e?.message || String(e);
      throw new Error(`Qdrant search failed (vec_size=${queryEmbedding.length}): ${detail}`);
    }
  }

  private async ensurePayloadIndexes(): Promise<void> {
    const name = this.config.indexName!;
    await Promise.all([
      this.client.createPayloadIndex(name, { field_name: "botId", field_schema: "keyword" }).catch(() => {}),
      this.client.createPayloadIndex(name, { field_name: "sourceId", field_schema: "keyword" }).catch(() => {}),
    ]);
  }

  private isIndexMissingError(e: any): boolean {
    const msg: string =
      e?.data?.status?.error || e?.data?.result?.status?.error || e?.message || "";
    return msg.toLowerCase().includes("index required") || msg.toLowerCase().includes("index required but not found");
  }

  async delete(botId: string, sourceId: string): Promise<void> {
    try {
      await this.client.delete(this.config.indexName!, {
        filter: { must: [{ key: "sourceId", match: { value: sourceId } }] },
        wait: true,
      });
    } catch (e: any) {
      if (this.isIndexMissingError(e)) {
        // Auto-fix: create the missing payload index then retry once
        await this.ensurePayloadIndexes();
        await this.client.delete(this.config.indexName!, {
          filter: { must: [{ key: "sourceId", match: { value: sourceId } }] },
          wait: true,
        });
        return;
      }
      const detail = e?.data?.status?.error || e?.message || String(e);
      throw new Error(`Qdrant delete failed: ${detail}`);
    }
  }

  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      await this.client.getCollections();
      return { success: true, message: "Qdrant connection successful" };
    } catch (e) {
      return { success: false, message: e instanceof Error ? e.message : "Connection failed" };
    }
  }
}
