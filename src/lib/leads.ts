import { Types } from "mongoose";
import { NextRequest } from "next/server";
import { Lead, ILead, ITranscriptEntry, LeadCaptureField } from "@/models";

export interface LeadCaptureArgs {
    name?: string;
    email?: string;
    phone?: string;
    intent?: string;
    qualificationNotes?: string;
}

export interface PersistLeadResult {
    lead: ILead;
    deduped: boolean;
    reason?: "conversation" | "email-window";
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateLead(
    args: LeadCaptureArgs,
    requireFields: LeadCaptureField[]
): { ok: true } | { ok: false; error: string } {
    const fields = requireFields.length > 0 ? requireFields : ["email"];
    for (const f of fields) {
        const v = args[f as keyof LeadCaptureArgs];
        if (!v || typeof v !== "string" || !v.trim()) {
            return { ok: false, error: `Missing required field: ${f}` };
        }
    }
    if (args.email && !EMAIL_REGEX.test(args.email)) {
        return { ok: false, error: "Invalid email format" };
    }
    return { ok: true };
}

export async function findDuplicate(
    botId: Types.ObjectId,
    conversationId: string,
    email: string | undefined,
    dedupWindowHours: number
): Promise<{ lead: ILead; reason: "conversation" | "email-window" } | null> {
    // Layer 2: conversation-level dedup (deterministic)
    const convoMatch = await Lead.findOne({ botId, conversationId });
    if (convoMatch) return { lead: convoMatch, reason: "conversation" };

    // Layer 3: identity-level dedup (configurable window)
    if (email && dedupWindowHours > 0) {
        const cutoff = new Date(Date.now() - dedupWindowHours * 60 * 60 * 1000);
        const emailMatch = await Lead.findOne({
            botId,
            email: email.toLowerCase().trim(),
            createdAt: { $gt: cutoff },
        }).sort({ createdAt: -1 });
        if (emailMatch) return { lead: emailMatch, reason: "email-window" };
    }

    return null;
}

function pickRequestMetadata(req: NextRequest) {
    return {
        ip: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || undefined,
        referer: req.headers.get("referer") || undefined,
        userAgent: req.headers.get("user-agent") || undefined,
        capturedAt: new Date(),
    };
}

export async function persistLead(
    botId: Types.ObjectId,
    conversationId: string,
    args: LeadCaptureArgs,
    transcript: ITranscriptEntry[],
    req: NextRequest,
    requireFields: LeadCaptureField[],
    dedupWindowHours: number
): Promise<PersistLeadResult> {
    const validation = validateLead(args, requireFields);
    if (!validation.ok) {
        throw new Error(validation.error);
    }

    const cleanEmail = args.email?.toLowerCase().trim();
    const dup = await findDuplicate(botId, conversationId, cleanEmail, dedupWindowHours);

    if (dup) {
        const existing = dup.lead;
        // Merge: prefer non-empty new values over existing
        if (args.name?.trim()) existing.name = args.name.trim();
        if (cleanEmail) existing.email = cleanEmail;
        if (args.phone?.trim()) existing.phone = args.phone.trim();
        if (args.intent?.trim()) existing.intent = args.intent.trim();
        if (args.qualificationNotes?.trim()) {
            existing.qualificationNotes = args.qualificationNotes.trim();
        }

        existing.captureCount = (existing.captureCount || 1) + 1;
        existing.lastSeenAt = new Date();

        // For email-window dedup, append a separator + new transcript so the
        // operator can see both interactions. For conversation dedup, replace
        // (it's the same conversation continuing).
        if (dup.reason === "email-window" && transcript.length > 0) {
            existing.transcript.push({
                role: "assistant",
                content: `--- New conversation (${conversationId}) ---`,
                ts: new Date(),
            });
            existing.transcript.push(...transcript);
        } else {
            existing.transcript = transcript;
        }

        await existing.save();
        return { lead: existing, deduped: true, reason: dup.reason };
    }

    const lead = await Lead.create({
        botId,
        conversationId,
        name: args.name?.trim(),
        email: cleanEmail,
        phone: args.phone?.trim(),
        intent: args.intent?.trim(),
        qualificationNotes: args.qualificationNotes?.trim(),
        status: "new",
        transcript,
        metadata: pickRequestMetadata(req),
        captureCount: 1,
        lastSeenAt: new Date(),
    });

    return { lead, deduped: false };
}
