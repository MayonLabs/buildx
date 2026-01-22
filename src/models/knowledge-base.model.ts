import mongoose, { Schema, Document, Model, Types } from "mongoose";

export type SourceType = "text" | "pdf" | "word" | "url";

export interface IKnowledgeBase extends Document {
    botId: Types.ObjectId;
    sourceType: SourceType;
    sourceName: string;
    content: string;
    vectorIds: string[]; // References to vector DB (Qdrant/Pinecone)
    metadata: {
        originalFileName?: string;
        url?: string;
        charCount?: number;
        chunkCount?: number;
    };
    isProcessed: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const KnowledgeBaseSchema = new Schema<IKnowledgeBase>(
    {
        botId: {
            type: Schema.Types.ObjectId,
            ref: "Bot",
            required: [true, "Bot ID is required"],
            index: true,
        },
        sourceType: {
            type: String,
            enum: ["text", "pdf", "word", "url"],
            required: [true, "Source type is required"],
        },
        sourceName: {
            type: String,
            required: [true, "Source name is required"],
            trim: true,
        },
        content: {
            type: String,
            default: "",
        },
        vectorIds: {
            type: [String],
            default: [],
        },
        metadata: {
            originalFileName: String,
            url: String,
            charCount: Number,
            chunkCount: Number,
        },
        isProcessed: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
    }
);

// Indexes
KnowledgeBaseSchema.index({ botId: 1, createdAt: -1 });

const KnowledgeBase: Model<IKnowledgeBase> =
    mongoose.models.KnowledgeBase ||
    mongoose.model<IKnowledgeBase>("KnowledgeBase", KnowledgeBaseSchema);

export default KnowledgeBase;
