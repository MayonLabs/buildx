import { GoogleGenerativeAI } from "@google/generative-ai";

export function getGenAI(apiKey: string): GoogleGenerativeAI {
    return new GoogleGenerativeAI(apiKey);
}

export async function getEmbedding(text: string, apiKey: string): Promise<number[]> {
    // Current Gemini embedding models (as of 2025).
    // text-embedding-004 and embedding-001 were shut down — use these instead.
    // Both support output_dimensionality: 768 to match the vector DB index.
    const models = ["gemini-embedding-2", "gemini-embedding-001"];

    for (const model of models) {
        const res = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${model}:embedContent`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-goog-api-key": apiKey,
                },
                body: JSON.stringify({
                    content: { parts: [{ text }] },
                    output_dimensionality: 768,
                }),
            }
        );

        if (res.ok) {
            const data = await res.json();
            return data.embedding.values;
        }

        if (res.status !== 404) {
            const err = await res.json().catch(() => ({}));
            throw new Error(`Embedding error ${res.status}: ${JSON.stringify(err)}`);
        }
        // 404 → model not available for this key, try next
    }

    throw new Error(
        "No Gemini embedding model available. Verify your API key in Settings → Gemini API Key."
    );
}
