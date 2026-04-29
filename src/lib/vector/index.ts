import { VectorDbConfig, IVectorProvider } from "./types";
import { QdrantVectorProvider } from "./providers/qdrant";

export function getVectorProvider(config?: VectorDbConfig | null): IVectorProvider {
  if (!config?.url || !config?.indexName) {
    throw new Error("Qdrant requires url and indexName (collection name). Configure it in Settings → Vector Database.");
  }
  return new QdrantVectorProvider(config);
}

export type { VectorDbConfig, IVectorProvider, VectorChunk, RetrievedChunk } from "./types";
