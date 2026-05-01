import mongoose, { Schema, Document, Model } from "mongoose";

export interface IProviderConfig {
    url?: string;
    apiKey?: string;   // stored encrypted
    indexName?: string;
}

export interface IAppSettings extends Omit<Document, '_id'> {
    _id: string;
    geminiApiKey?: string;          // stored encrypted
    activeVectorProvider?: string;  // "mongodb" | "qdrant"
    vectorDbConfigs?: Record<string, IProviderConfig>;
    // Legacy field kept for migration reads
    vectorDb?: unknown;
    updatedAt: Date;
}

const AppSettingsSchema = new Schema<IAppSettings>(
    {
        _id: { type: String, default: "global" },
        geminiApiKey: { type: String },
        activeVectorProvider: { type: String, default: "qdrant" },
        vectorDbConfigs: { type: Schema.Types.Mixed, default: {} },
        // Legacy
        vectorDb: { type: Schema.Types.Mixed },
    },
    { timestamps: { createdAt: false, updatedAt: true }, strict: false }
);

const AppSettings: Model<IAppSettings> =
    mongoose.models.AppSettings ||
    mongoose.model<IAppSettings>("AppSettings", AppSettingsSchema);

export default AppSettings;
