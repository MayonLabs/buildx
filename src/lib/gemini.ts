import {
    GoogleGenerativeAI,
    FunctionDeclaration,
    SchemaType,
} from "@google/generative-ai";
import type { LeadCaptureField } from "@/models";

export function getGenAI(apiKey: string): GoogleGenerativeAI {
    return new GoogleGenerativeAI(apiKey);
}

export const LEAD_CAPTURE_TOOL_NAME = "capture_lead";

/**
 * Build the capture_lead FunctionDeclaration. The model invokes this tool
 * to persist a lead. `requireFields` drives which params are mandatory at
 * the schema level — additional model-side guidance is added in the system
 * prompt so the bot collects fields conversationally before calling.
 */
export function buildLeadCaptureTool(
    requireFields: LeadCaptureField[]
): FunctionDeclaration {
    return {
        name: LEAD_CAPTURE_TOOL_NAME,
        description:
            "Save the user's contact details as a lead. Call this tool ONLY ONCE per conversation, and ONLY after the user has clearly expressed interest (e.g. asked about pricing, demo, signup, contact, or to be reached out to) AND you have collected the required fields. Never call this on the first message. After calling it, briefly acknowledge to the user and continue the conversation normally.",
        parameters: {
            type: SchemaType.OBJECT,
            properties: {
                name: {
                    type: SchemaType.STRING,
                    description: "The user's full name, exactly as they provided it.",
                },
                email: {
                    type: SchemaType.STRING,
                    description: "A valid email address provided by the user.",
                },
                phone: {
                    type: SchemaType.STRING,
                    description:
                        "Phone number provided by the user, in E.164 format if possible (e.g. +14155552671).",
                },
                intent: {
                    type: SchemaType.STRING,
                    description:
                        "What the user wants — e.g. 'pricing', 'demo', 'support', 'partnership', or a short free-text summary.",
                },
                qualificationNotes: {
                    type: SchemaType.STRING,
                    description:
                        "Optional notes summarising any qualifying details the user shared (use case, team size, timeline, budget, etc.).",
                },
            },
            required: requireFields.length > 0 ? [...requireFields] : ["email"],
        },
    };
}

/**
 * System-prompt fragment appended when lead capture is enabled. Encodes
 * Layer-1 (model-level) dedup and tells the model how to use the tool.
 */
export function buildLeadCapturePromptFragment(
    requireFields: LeadCaptureField[],
    qualificationPrompt?: string
): string {
    const fields = requireFields.length > 0 ? requireFields.join(", ") : "email";
    const extra = qualificationPrompt?.trim()
        ? `\n\nAdditional qualification guidance: ${qualificationPrompt.trim()}`
        : "";
    return `\n\nLEAD CAPTURE TOOL:
You have access to a tool called \`${LEAD_CAPTURE_TOOL_NAME}\`. Use it to save a lead, but only when ALL of the following are true:
1. The user has expressed clear interest (asks about pricing/demo/signup/contact, or asks you to reach out).
2. You have collected these fields conversationally: ${fields}.
3. You have not already called \`${LEAD_CAPTURE_TOOL_NAME}\` in this conversation.

Ask for missing fields one at a time, naturally — never dump a form on the user. After calling the tool, briefly thank the user and continue helping them. Do not call the tool again in the same conversation even if the user shares more details later.${extra}`;
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
