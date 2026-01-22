import { NextRequest, NextResponse } from "next/server";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { HumanMessage, SystemMessage, AIMessage } from "@langchain/core/messages";
import dbConnect from "@/lib/db";
import { Bot, KnowledgeChunk } from "@/models";

import { getEmbedding } from "@/lib/gemini";
import { checkRateLimit } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { message, botId, history = [] } = body;

        // 1. Rate Limiting Check
        const ip = request.headers.get("x-forwarded-for")?.split(",")[0] || "unknown";
        const limitResult = await checkRateLimit(ip);

        if (!limitResult.success) {
            return NextResponse.json(
                { error: "Too many requests. Please try again later." },
                { status: 429 }
            );
        }

        if (!message || !botId) {
            return NextResponse.json(
                { error: "Message and botId are required" },
                { status: 400 }
            );
        }

        if (!process.env.GEMINI_API_KEY) {
            return NextResponse.json(
                { error: "GEMINI_API_KEY not configured" },
                { status: 500 }
            );
        }

        const mongooseInstance = await dbConnect();

        // Fetch bot configuration - try by publicId first, then by _id
        let botDoc = await Bot.findOne({ publicId: botId }).lean();
        if (!botDoc) {
            botDoc = await Bot.findById(botId).lean();
        }

        if (!botDoc) {
            return NextResponse.json({ error: "Bot not found" }, { status: 404 });
        }

        const botConfig = botDoc as {
            systemPrompt: string;
            aiModel: string;
            temperature: number;
            allowedDomains: string[];
            isActive: boolean;
        };

        if (!botConfig.isActive) {
            return NextResponse.json(
                { error: "This bot is currently inactive" },
                { status: 403 }
            );
        }

        // Validate domain if allowedDomains is configured
        if (botConfig.allowedDomains && botConfig.allowedDomains.length > 0) {
            const origin = request.headers.get("origin") || request.headers.get("referer") || "";
            const isAllowed = botConfig.allowedDomains.some((domain) => {
                // Match domain (with or without protocol)
                const normalizedDomain = domain.replace(/^https?:\/\//, "").replace(/\/$/, "");
                return origin.includes(normalizedDomain);
            });

            if (!isAllowed) {
                return NextResponse.json(
                    { error: "This bot is not allowed on this domain" },
                    { status: 403 }
                );
            }
        }

        // Initialize LangChain model
        const model = new ChatGoogleGenerativeAI({
            apiKey: process.env.GEMINI_API_KEY,
            model: botConfig.aiModel || "gemini-2.0-flash",
            temperature: botConfig.temperature || 0.7,
        });

        // --- RAG LOGIC START ---
        let systemPromptText = botConfig.systemPrompt;

        try {
            let topChunks = [];

            // Atlas Vector Search (Exclusive)
            const chunkCount = await KnowledgeChunk.countDocuments({ botId: botDoc._id });
            console.log(`🔍 Debug: Total Chunks in DB for this Bot: ${chunkCount}`);

            const queryEmbedding = await getEmbedding(message);
            console.log(`🔍 Debug: Query Vector Length: ${queryEmbedding.length}`);
            // @ts-ignore
            const collection = mongooseInstance.connection.db.collection("knowledgechunks");

            const results = await collection.aggregate([
                {
                    $vectorSearch: {
                        index: "vector_index_v2",
                        path: "embedding",
                        queryVector: queryEmbedding,
                        numCandidates: 100,
                        limit: 3,
                        filter: {
                            botId: { $eq: botDoc._id }
                        }
                    }
                },
                {
                    $project: {
                        content: 1,
                        score: { $meta: "vectorSearchScore" }
                    }
                }
            ]).toArray();

            topChunks = results.map(r => ({
                content: r.content,
                score: r.score
            }));
            console.log(`🔍 Atlas Search: Found ${results.length} chunks. Top Score: ${results[0]?.score}`);

            // 5. Inject Context
            if (topChunks.length > 0) {
                const contextText = topChunks.map(c => c.content).join("\n\n---\n\n");
                systemPromptText += `\n\nRELEVANT CONTEXT FROM KNOWLEDGE BASE:\n${contextText}\n\nUse the above context to answer the user's question. If the answer is not in the context, say you don't know based on the provided documents.`;
                console.log(`✅ Top Match Score: ${topChunks[0].score.toFixed(4)}`);
                console.log("📚 Context Injected into System Prompt.");
            }
        } catch (error) {
            console.error("RAG Error:", error);
            // Continue without RAG if it fails
        }
        // --- RAG LOGIC END ---

        // Build messages array
        const messages = [
            new SystemMessage(`${systemPromptText}\n\nIMPORTANT: Format your response using Markdown. Use bold for key terms, bullet points for lists, and code blocks for any technical syntax.`),
            // Add conversation history
            ...history.map((msg: { role: string; content: string }) =>
                msg.role === "assistant"
                    ? new AIMessage(msg.content)
                    : new HumanMessage(msg.content)
            ),
            // Add current message
            new HumanMessage(message),
        ];

        // Invoke the model
        const response = await model.invoke(messages);

        return NextResponse.json({
            message: response.content,
            model: botConfig.aiModel,
        });
    } catch (error) {
        console.error("Chat error:", error);

        if (error instanceof Error) {
            // Handle rate limit errors
            if (error.message.includes("429") || error.message.includes("quota")) {
                return NextResponse.json(
                    { error: "Rate limit exceeded. Please try again in a moment." },
                    { status: 429 }
                );
            }
            if (error.message.includes("API key")) {
                return NextResponse.json(
                    { error: "Invalid API key" },
                    { status: 401 }
                );
            }
        }

        return NextResponse.json(
            { error: "Failed to generate response" },
            { status: 500 }
        );
    }
}
