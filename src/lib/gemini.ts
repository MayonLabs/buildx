import { GoogleGenerativeAI } from "@google/generative-ai";

if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not defined in environment variables");
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export const geminiModels = {
    embedding: genAI.getGenerativeModel({ model: "text-embedding-004" }),
    flash: genAI.getGenerativeModel({ model: "gemini-2.0-flash" }),
    pro: genAI.getGenerativeModel({ model: "gemini-1.5-pro" }),
};

export async function getEmbedding(text: string): Promise<number[]> {
    const result = await geminiModels.embedding.embedContent(text);
    return result.embedding.values;
}

export default genAI;
