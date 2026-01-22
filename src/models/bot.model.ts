import mongoose, { Schema, Document, Model } from "mongoose";
import { nanoid } from "nanoid";

// Bot theme configuration
export interface IBotTheme {
    primaryColor: string;
    launcherIcon?: string;
    chatTitle?: string;
    welcomeMessage?: string;
}

// Bot document interface
export interface IBot extends Document {
    name: string;
    systemPrompt: string;
    temperature: number;
    aiModel: string;
    publicId: string;
    theme: IBotTheme;
    allowedDomains: string[]; // Domains allowed to embed this bot
    widgetPosition: string; // Widget position: bottom-right, bottom-left, top-right, top-left
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const BotThemeSchema = new Schema<IBotTheme>(
    {
        primaryColor: { type: String, default: "#8b5cf6" }, // Violet
        launcherIcon: { type: String },
        chatTitle: { type: String, default: "Chat with us" },
        welcomeMessage: { type: String, default: "Hello! How can I help you today?" },
    },
    { _id: false }
);

const BotSchema = new Schema<IBot>(
    {
        name: {
            type: String,
            required: [true, "Bot name is required"],
            trim: true,
            maxlength: [100, "Bot name cannot exceed 100 characters"],
        },
        systemPrompt: {
            type: String,
            required: [true, "System prompt is required"],
            default: "You are a helpful assistant.",
        },
        temperature: {
            type: Number,
            min: [0, "Temperature must be at least 0"],
            max: [2, "Temperature cannot exceed 2"],
            default: 0.7,
        },
        aiModel: {
            type: String,
            enum: ["gemini-2.0-flash", "gemini-1.5-pro", "gemini-1.5-flash", "gemini-1.5-flash-8b"],
            default: "gemini-2.0-flash",
        },
        publicId: {
            type: String,
            unique: true,
            default: () => nanoid(12),
        },
        theme: {
            type: BotThemeSchema,
            default: () => ({}),
        },
        allowedDomains: {
            type: [String],
            default: [], // Empty = allow all domains
        },
        widgetPosition: {
            type: String,
            enum: ["bottom-right", "bottom-left", "top-right", "top-left"],
            default: "bottom-right",
        },
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    {
        timestamps: true,
    }
);

// Indexes
BotSchema.index({ createdAt: -1 });

// Prevent model recompilation in development
const Bot: Model<IBot> =
    mongoose.models.Bot || mongoose.model<IBot>("Bot", BotSchema);

export default Bot;
