import mongoose, { Schema, Document, Model, Types } from "mongoose";

export type LeadStatus = "new" | "contacted" | "qualified" | "archived";

export interface ITranscriptEntry {
    role: "user" | "assistant";
    content: string;
    ts: Date;
}

export interface ILeadMetadata {
    ip?: string;
    referer?: string;
    userAgent?: string;
    capturedAt?: Date;
}

export interface ILead extends Document {
    botId: Types.ObjectId;
    conversationId: string;
    name?: string;
    email?: string;
    phone?: string;
    intent?: string;
    qualificationNotes?: string;
    status: LeadStatus;
    transcript: ITranscriptEntry[];
    metadata: ILeadMetadata;
    captureCount: number;
    lastSeenAt: Date;
    createdAt: Date;
    updatedAt: Date;
}

const TranscriptEntrySchema = new Schema<ITranscriptEntry>(
    {
        role: { type: String, enum: ["user", "assistant"], required: true },
        content: { type: String, required: true },
        ts: { type: Date, default: Date.now },
    },
    { _id: false }
);

if (process.env.NODE_ENV === "development") {
    delete mongoose.models.Lead;
}

const LeadSchema = new Schema<ILead>(
    {
        botId: {
            type: Schema.Types.ObjectId,
            ref: "Bot",
            required: [true, "Bot ID is required"],
            index: true,
        },
        conversationId: {
            type: String,
            required: [true, "Conversation ID is required"],
            trim: true,
        },
        name: { type: String, trim: true },
        email: {
            type: String,
            trim: true,
            lowercase: true,
        },
        phone: { type: String, trim: true },
        intent: { type: String, trim: true },
        qualificationNotes: { type: String },
        status: {
            type: String,
            enum: ["new", "contacted", "qualified", "archived"],
            default: "new",
        },
        transcript: {
            type: [TranscriptEntrySchema],
            default: [],
        },
        metadata: {
            ip: String,
            referer: String,
            userAgent: String,
            capturedAt: Date,
        },
        captureCount: {
            type: Number,
            default: 1,
            min: 1,
        },
        lastSeenAt: {
            type: Date,
            default: Date.now,
        },
    },
    {
        timestamps: true,
    }
);

// Inbox listing: per-bot, newest first
LeadSchema.index({ botId: 1, createdAt: -1 });

// Email-based dedup (Layer 3) — only when email is set
LeadSchema.index(
    { botId: 1, email: 1 },
    { partialFilterExpression: { email: { $exists: true, $type: "string" } } }
);

// Conversation-level dedup (Layer 2) — unique per (bot, conversation)
LeadSchema.index(
    { botId: 1, conversationId: 1 },
    {
        unique: true,
        partialFilterExpression: { conversationId: { $exists: true, $type: "string" } },
    }
);

const Lead: Model<ILead> =
    mongoose.models.Lead || mongoose.model<ILead>("Lead", LeadSchema);

export default Lead;
