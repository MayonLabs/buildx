import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface IKnowledgeChunk extends Document {
    botId: Types.ObjectId;
    sourceId: Types.ObjectId; // Reference to KnowledgeBase parent
    content: string;
    embedding: number[];
    chunkIndex: number; // Order in the original doc
    createdAt: Date;
}

const KnowledgeChunkSchema = new Schema<IKnowledgeChunk>(
    {
        botId: {
            type: Schema.Types.ObjectId,
            ref: "Bot",
            required: true,
            index: true,
        },
        sourceId: {
            type: Schema.Types.ObjectId,
            ref: "KnowledgeBase",
            required: true,
            index: true,
        },
        content: {
            type: String,
            required: true,
        },
        embedding: {
            type: [Number], // Vector embedding
            required: true,
            // In a real vector DB we'd index this, but here it's just storage
        },
        chunkIndex: {
            type: Number,
            required: true,
        },
    },
    {
        timestamps: { createdAt: true, updatedAt: false },
    }
);

// Prevent model recompilation in development
const KnowledgeChunk: Model<IKnowledgeChunk> =
    mongoose.models.KnowledgeChunk ||
    mongoose.model<IKnowledgeChunk>("KnowledgeChunk", KnowledgeChunkSchema);

export default KnowledgeChunk;
