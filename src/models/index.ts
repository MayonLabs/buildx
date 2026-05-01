export { default as Bot } from "./bot.model";
export type {
    IBot,
    IBotTheme,
    IBotTools,
    ILeadCaptureConfig,
    LeadCaptureField,
} from "./bot.model";

export { default as KnowledgeBase } from "./knowledge-base.model";
export type { IKnowledgeBase, SourceType } from "./knowledge-base.model";

export { default as KnowledgeChunk } from "./knowledge-chunk.model";

export { RateLimit } from "./rate-limit.model";

export { default as Lead } from "./lead.model";
export type {
    ILead,
    ITranscriptEntry,
    ILeadMetadata,
    LeadStatus,
} from "./lead.model";
