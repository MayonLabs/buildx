import mongoose, { Schema, Document, Model } from "mongoose";
import { nanoid } from "nanoid";

// Bot theme configuration
// Bot theme configuration
export interface IBotTheme {
    launcher: {
        bgColor: string;
        iconColor: string;
        icon?: string;
        closeIcon?: string;
        borderRadius?: string;
    };
    header: {
        bgColor: string;
        textColor: string;
        title: string;
        titleFont?: { size?: string; weight?: string; family?: string };
        icon?: string;
        iconColor?: string;
        iconBgColor?: string;
    };
    chatWindow?: {
        backgroundColor?: string;
        footerBackgroundColor?: string;
        backgroundImage?: string;
    };
    userMessage: {
        bgColor: string;
        textColor: string;
        showAvatar: boolean;
        avatarIcon?: string;
        borderRadius?: string;
        font?: { size?: string; weight?: string; family?: string };
    };
    botMessage: {
        bgColor: string;
        textColor: string;
        showAvatar: boolean;
        avatarIcon?: string;
        borderRadius?: string;
        font?: { size?: string; weight?: string; family?: string };
    };
    inputArea?: {
        backgroundColor?: string;
        textColor?: string;
        placeholderColor?: string;
        font?: { size?: string; weight?: string; family?: string };
    };
    sendButton?: {
        backgroundColor?: string;
        iconColor?: string;
        icon?: string;
    };
    common: {
        fontFamily: string;
        borderRadius: string;
        shadow: string;
    };
    welcomeMessage?: string;
    welcomeMessageStyle?: {
        color?: string;
        fontSize?: string;
        fontWeight?: string;
        fontFamily?: string;
    };
    showBranding: boolean;
    primaryColor?: string;
}

// Plain data interface (for use in React components)
// Use this type when working with plain objects (e.g., after JSON.parse or spreading)
export interface IBotData {
    name: string;
    systemPrompt: string;
    temperature: number;
    aiModel: string;
    publicId: string;
    theme: IBotTheme;
    allowedDomains: string[]; // Domains allowed to embed this bot
    widgetPosition: string; // Widget position: bottom-right, bottom-left, top-right, top-left
    isActive: boolean;
    createdAt?: Date;
    updatedAt?: Date;
}

// Bot document interface (for Mongoose operations - has Document methods)
export interface IBot extends Document {
    name: string;
    systemPrompt: string;
    temperature: number;
    aiModel: string;
    publicId: string;
    theme: IBotTheme;
    allowedDomains: string[];
    widgetPosition: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const BotThemeSchema = new Schema<IBotTheme>(
    {
        launcher: {
            bgColor: { type: String, default: "#8b5cf6" },
            iconColor: { type: String, default: "#ffffff" },
            icon: { type: String },
            closeIcon: { type: String },
            borderRadius: { type: String, default: "50%" },
        },
        header: {
            bgColor: { type: String, default: "#8b5cf6" },
            textColor: { type: String, default: "#ffffff" },
            title: { type: String, default: "Chat with us" },
            titleFont: {
                size: { type: String, default: "14px" },
                weight: { type: String, default: "600" },
                family: { type: String, default: "Inter, sans-serif" },
            },
            icon: { type: String }, // Custom header icon
            iconColor: { type: String },
            iconBgColor: { type: String },
        },
        chatWindow: {
            backgroundColor: { type: String, default: "#ffffff" },
            footerBackgroundColor: { type: String, default: "#ffffff" },
            backgroundImage: { type: String },
        },
        userMessage: {
            bgColor: { type: String, default: "#3b82f6" },
            textColor: { type: String, default: "#ffffff" },
            showAvatar: { type: Boolean, default: false },
            avatarIcon: { type: String },
            borderRadius: { type: String },
            font: {
                size: { type: String, default: "14px" },
                weight: { type: String, default: "400" },
                family: { type: String },
            }
        },
        botMessage: {
            bgColor: { type: String, default: "#f3f4f6" },
            textColor: { type: String, default: "#1f2937" },
            showAvatar: { type: Boolean, default: true },
            avatarIcon: { type: String },
            borderRadius: { type: String },
            font: {
                size: { type: String, default: "14px" },
                weight: { type: String, default: "400" },
                family: { type: String },
            }
        },
        inputArea: {
            backgroundColor: { type: String, default: "#ffffff" },
            textColor: { type: String, default: "#000000" },
            placeholderColor: { type: String, default: "#a1a1aa" },
            font: {
                size: { type: String, default: "14px" },
                weight: { type: String, default: "400" },
                family: { type: String },
            },
        },
        sendButton: {
            backgroundColor: { type: String, default: "#8b5cf6" },
            iconColor: { type: String, default: "#ffffff" },
            icon: { type: String },
        },
        common: {
            fontFamily: { type: String, default: "Inter, sans-serif" },
            borderRadius: { type: String, default: "0.75rem" },
            shadow: { type: String, default: "0 4px 6px -1px rgb(0 0 0 / 0.1)" },
        },
        welcomeMessage: { type: String },
        welcomeMessageStyle: {
            color: { type: String },
            fontSize: { type: String },
            fontWeight: { type: String },
            fontFamily: { type: String },
        },
        showBranding: { type: Boolean, default: true },
        // Legacy fields
        primaryColor: { type: String },
    },
    { _id: false, strict: false }
);

// Delete existing model to force re-compilation with new schema in dev
if (process.env.NODE_ENV === "development") {
    delete mongoose.models.Bot;
}

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
            enum: ["gemini-2.5-flash", "gemini-2.5-pro", "gemini-2.5-flash-lite"],
            default: "gemini-2.5-flash",
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
