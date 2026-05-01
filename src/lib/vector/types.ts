export type VectorProviderName = "qdrant";

export interface VectorDbConfig {
  provider: VectorProviderName;
  apiKey?: string;
  indexName?: string;  // Qdrant collection name
  url?: string;        // Qdrant host URL
}

export interface VectorChunk {
  id: string;            // "${sourceId}_${chunkIndex}"
  content: string;
  embedding: number[];
  metadata: {
    botId: string;       // Bot MongoDB ObjectId string
    sourceId: string;    // KnowledgeBase ObjectId string
    chunkIndex: number;
  };
}

export interface RetrievedChunk {
  content: string;
  score: number;
}

export interface IVectorProvider {
  upsert(chunks: VectorChunk[]): Promise<void>;
  query(botId: string, queryEmbedding: number[], topK: number): Promise<RetrievedChunk[]>;
  delete(botId: string, sourceId: string): Promise<void>;
  // Wipe every chunk owned by a bot — used on bot deletion.
  deleteByBot(botId: string): Promise<void>;
  testConnection(): Promise<{ success: boolean; message: string }>;
}
