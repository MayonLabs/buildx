import { NextRequest, NextResponse } from "next/server";
import { Types } from "mongoose";
import dbConnect from "@/lib/db";
import { Bot, ITranscriptEntry } from "@/models";
import {
    getGenAI,
    getEmbedding,
    buildLeadCaptureTool,
    buildLeadCapturePromptFragment,
    LEAD_CAPTURE_TOOL_NAME,
} from "@/lib/gemini";
import { checkRateLimit } from "@/lib/rate-limit";
import { getVectorProvider } from "@/lib/vector";
import { getGlobalSettings } from "@/lib/vector/settings-cache";
import { persistLead, LeadCaptureArgs } from "@/lib/leads";
import type { Tool, FunctionCall, Part } from "@google/generative-ai";

const MAX_TOOL_LOOP_ITERATIONS = 3;

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { message, botId, history = [], conversationId } = body;

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
            _id: Types.ObjectId;
            systemPrompt: string;
            aiModel: string;
            temperature: number;
            allowedDomains: string[];
            isActive: boolean;
            tools?: {
                leadCapture?: {
                    enabled?: boolean;
                    requireFields?: ("name" | "email" | "phone")[];
                    qualificationPrompt?: string;
                    dedupWindowHours?: number;
                };
            };
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

        // Lead-capture tool wiring (only if bot has it enabled and conversationId present)
        const leadCapture = botConfig.tools?.leadCapture;
        const leadCaptureEnabled = !!(leadCapture?.enabled && conversationId);
        const requireFields = leadCapture?.requireFields?.length
            ? leadCapture.requireFields
            : ["email" as const];
        const dedupWindowHours = leadCapture?.dedupWindowHours ?? 24;

        const tools: Tool[] | undefined = leadCaptureEnabled
            ? [{ functionDeclarations: [buildLeadCaptureTool(requireFields)] }]
            : undefined;

        if (leadCaptureEnabled) {
            systemPromptText += buildLeadCapturePromptFragment(
                requireFields,
                leadCapture?.qualificationPrompt
            );
        }

        // Build Gemini model with system instruction (native SDK — no LangChain)
        const model = getGenAI(geminiKey).getGenerativeModel({
            model: botConfig.aiModel || "gemini-2.5-flash",
            systemInstruction: `${systemPromptText}\n\nIMPORTANT: Format your response using Markdown. Use bold for key terms, bullet points for lists, and code blocks for any technical syntax.`,
            tools,
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

        // Tool-call loop — bounded to keep latency + cost predictable.
        let result = await chat.sendMessage(message);
        let leadCaptured = false;
        let iter = 0;

        while (iter < MAX_TOOL_LOOP_ITERATIONS) {
            const calls: FunctionCall[] = result.response.functionCalls() || [];
            if (calls.length === 0) break;

            const responseParts: Part[] = [];
            for (const call of calls) {
                if (call.name === LEAD_CAPTURE_TOOL_NAME && leadCaptureEnabled) {
                    const outcome = await handleCaptureLead(
                        botConfig._id,
                        conversationId,
                        call.args as LeadCaptureArgs,
                        message,
                        history,
                        request,
                        requireFields,
                        dedupWindowHours,
                        leadCaptured
                    );
                    if (outcome.captured) leadCaptured = true;
                    responseParts.push({
                        functionResponse: {
                            name: call.name,
                            response: outcome.response,
                        },
                    });
                } else {
                    responseParts.push({
                        functionResponse: {
                            name: call.name,
                            response: { error: `Unknown tool: ${call.name}` },
                        },
                    });
                }
            }

            result = await chat.sendMessage(responseParts);
            iter++;
        }

        const responseText = result.response.text();

        return NextResponse.json({
            message: responseText,
            model: botConfig.aiModel,
            leadCaptured,
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

async function handleCaptureLead(
    botId: Types.ObjectId,
    conversationId: string,
    args: LeadCaptureArgs,
    currentMessage: string,
    history: { role: string; content: string }[],
    request: NextRequest,
    requireFields: ("name" | "email" | "phone")[],
    dedupWindowHours: number,
    alreadyCaptured: boolean
): Promise<{
    captured: boolean;
    response: { ok: boolean; deduped?: boolean; reason?: string; error?: string };
}> {
    // Layer 1.5 — server-side single-call enforcement within a request.
    if (alreadyCaptured) {
        return {
            captured: false,
            response: { ok: true, deduped: true, reason: "already-captured-in-request" },
        };
    }

    const transcript: ITranscriptEntry[] = [
        ...history.map(h => ({
            role: (h.role === "assistant" ? "assistant" : "user") as "user" | "assistant",
            content: h.content,
            ts: new Date(),
        })),
        { role: "user" as const, content: currentMessage, ts: new Date() },
    ];

    try {
        const result = await persistLead(
            botId,
            conversationId,
            args,
            transcript,
            request,
            requireFields,
            dedupWindowHours
        );
        return {
            captured: true,
            response: {
                ok: true,
                deduped: result.deduped,
                reason: result.reason,
            },
        };
    } catch (err) {
        const error = err instanceof Error ? err.message : "Failed to save lead";
        console.error("Lead capture error:", err);
        return {
            captured: false,
            response: { ok: false, error },
        };
    }
}
