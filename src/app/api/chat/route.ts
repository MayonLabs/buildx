import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import { Bot } from "@/models";
import { getGenAI, getEmbedding } from "@/lib/gemini";
import { checkRateLimit } from "@/lib/rate-limit";
import { getVectorProvider } from "@/lib/vector";
import { getGlobalSettings } from "@/lib/vector/settings-cache";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { message, botId, history = [] } = body;

        // Rate limiting
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

        await dbConnect();

        // Fetch bot — try publicId first, then ObjectId
        let botDoc = await Bot.findOne({ publicId: botId }).lean();
        if (!botDoc) botDoc = await Bot.findById(botId).lean();

        if (!botDoc) {
            return NextResponse.json({ error: "Bot not found" }, { status: 404 });
        }

        const botConfig = botDoc as {
            _id: any;
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

        // Domain validation
        if (botConfig.allowedDomains && botConfig.allowedDomains.length > 0) {
            const origin = request.headers.get("origin") || request.headers.get("referer") || "";
            const isAllowed = botConfig.allowedDomains.some(domain => {
                const normalized = domain.replace(/^https?:\/\//, "").replace(/\/$/, "");
                return origin.includes(normalized);
            });
            if (!isAllowed) {
                return NextResponse.json(
                    { error: "This bot is not allowed on this domain" },
                    { status: 403 }
                );
            }
        }

        // Resolve Gemini API key: DB setting takes priority, env var is fallback
        const globalSettings = await getGlobalSettings();
        const geminiKey = globalSettings.geminiApiKey || "";
        if (!geminiKey) {
            return NextResponse.json(
                { error: "Gemini API key not configured. Add it in Settings." },
                { status: 500 }
            );
        }

        // RAG: embed query → vector search → inject context
        let systemPromptText = botConfig.systemPrompt;
        try {
            const provider = getVectorProvider(globalSettings.vectorDb);
            const queryEmbedding = await getEmbedding(message, geminiKey);
            const chunks = await provider.query(botConfig._id.toString(), queryEmbedding, 3);

            if (chunks.length > 0) {
                const contextText = chunks.map(c => c.content).join("\n\n---\n\n");
                systemPromptText += `\n\nRELEVANT CONTEXT FROM KNOWLEDGE BASE:\n${contextText}\n\nUse the above context to answer the user's question. If the answer is not in the context, say you don't know based on the provided documents.`;
            }
        } catch (ragError) {
            console.error("RAG error (continuing without context):", ragError);
        }

        // Build Gemini model with system instruction (native SDK — no LangChain)
        const model = getGenAI(geminiKey).getGenerativeModel({
            model: botConfig.aiModel || "gemini-2.5-flash",
            systemInstruction: `${systemPromptText}\n\nIMPORTANT: Format your response using Markdown. Use bold for key terms, bullet points for lists, and code blocks for any technical syntax.`,
        });

        const chat = model.startChat({
            history: history.map((msg: { role: string; content: string }) => ({
                role: msg.role === "assistant" ? "model" : "user",
                parts: [{ text: msg.content }],
            })),
            generationConfig: {
                temperature: botConfig.temperature ?? 0.7,
            },
        });

        const result = await chat.sendMessage(message);
        const responseText = result.response.text();

        return NextResponse.json({
            message: responseText,
            model: botConfig.aiModel,
        });
    } catch (error) {
        console.error("Chat error:", error);

        if (error instanceof Error) {
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
