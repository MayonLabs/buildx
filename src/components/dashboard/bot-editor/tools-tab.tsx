"use client";

import { useState, Dispatch, SetStateAction } from "react";
import { ChevronDown, ChevronRight, Sparkles } from "lucide-react";

type LeadCaptureField = "name" | "email" | "phone";

interface LeadCaptureConfig {
    enabled: boolean;
    requireFields: LeadCaptureField[];
    qualificationPrompt?: string;
    dedupWindowHours: number;
    notifyEmail?: string;
    webhookUrl?: string;
}

interface BotWithTools {
    tools?: {
        leadCapture?: Partial<LeadCaptureConfig>;
    };
}

interface ToolsTabProps<T extends BotWithTools> {
    bot: T;
    setBot: Dispatch<SetStateAction<T | null>>;
}

const FIELD_OPTIONS: { id: LeadCaptureField; label: string }[] = [
    { id: "name", label: "Name" },
    { id: "email", label: "Email" },
    { id: "phone", label: "Phone" },
];

function getLeadCapture(bot: BotWithTools): LeadCaptureConfig {
    const lc = bot.tools?.leadCapture || {};
    return {
        enabled: lc.enabled ?? false,
        requireFields:
            (lc.requireFields && lc.requireFields.length > 0
                ? lc.requireFields
                : ["email"]) as LeadCaptureField[],
        qualificationPrompt: lc.qualificationPrompt ?? "",
        dedupWindowHours: lc.dedupWindowHours ?? 24,
        notifyEmail: lc.notifyEmail ?? "",
        webhookUrl: lc.webhookUrl ?? "",
    };
}

export function ToolsTab<T extends BotWithTools>({ bot, setBot }: ToolsTabProps<T>) {
    const [advancedOpen, setAdvancedOpen] = useState(false);
    const lc = getLeadCapture(bot);

    function update(patch: Partial<LeadCaptureConfig>) {
        setBot({
            ...bot,
            tools: {
                ...(bot.tools || {}),
                leadCapture: {
                    ...lc,
                    ...patch,
                },
            },
        });
    }

    function toggleField(field: LeadCaptureField) {
        const has = lc.requireFields.includes(field);
        const next = has
            ? lc.requireFields.filter((f) => f !== field)
            : [...lc.requireFields, field];
        // Always keep at least one required field
        update({ requireFields: next.length > 0 ? next : ["email"] });
    }

    return (
        <div className="space-y-6">
            <div className="flex items-start gap-3 p-4 bg-violet-500/5 border border-violet-500/20 rounded-xl">
                <div className="w-9 h-9 rounded-lg bg-violet-500/15 flex items-center justify-center flex-shrink-0">
                    <Sparkles className="w-5 h-5 text-violet-400" />
                </div>
                <div>
                    <h3 className="text-sm font-semibold text-white">Lead Capture</h3>
                    <p className="text-xs text-zinc-400 mt-1">
                        When enabled, the bot can save user contact details as leads using a
                        function-calling tool. The bot will ask for these fields conversationally
                        once the user shows clear intent — never up-front.
                    </p>
                </div>
            </div>

            {/* Enable toggle */}
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm font-medium text-white">Enable lead capture</p>
                    <p className="text-xs text-zinc-500">
                        Adds the <code className="text-violet-300">capture_lead</code> tool to this bot.
                    </p>
                </div>
                <button
                    type="button"
                    onClick={() => update({ enabled: !lc.enabled })}
                    className={`w-12 h-6 rounded-full transition-colors relative ${lc.enabled ? "bg-emerald-500" : "bg-zinc-700"
                        }`}
                >
                    <div
                        className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${lc.enabled ? "left-7" : "left-1"
                            }`}
                    />
                </button>
            </div>

            {/* Required fields */}
            <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                    Required fields
                </label>
                <p className="text-xs text-zinc-500 mb-3">
                    The bot won&apos;t save a lead until it has collected these.
                </p>
                <div className="flex flex-wrap gap-2">
                    {FIELD_OPTIONS.map((f) => {
                        const active = lc.requireFields.includes(f.id);
                        return (
                            <button
                                key={f.id}
                                type="button"
                                onClick={() => toggleField(f.id)}
                                disabled={!lc.enabled}
                                className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors disabled:opacity-50 ${active
                                    ? "bg-violet-500/15 border-violet-500/40 text-violet-300"
                                    : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700"
                                    }`}
                            >
                                {f.label}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Qualification prompt */}
            <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                    Qualification prompt (optional)
                </label>
                <textarea
                    value={lc.qualificationPrompt || ""}
                    onChange={(e) => update({ qualificationPrompt: e.target.value })}
                    rows={4}
                    placeholder="e.g. Ask about team size, current tools they use, and rough timeline before saving the lead."
                    disabled={!lc.enabled}
                    className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-xl text-white text-sm focus:ring-2 focus:ring-violet-500 focus:border-violet-500 outline-none disabled:opacity-50"
                />
                <p className="text-xs text-zinc-500 mt-2">
                    Appended to the system prompt. Helps the bot qualify leads before capturing.
                </p>
            </div>

            {/* Dedup window */}
            <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                    Duplicate window (hours)
                </label>
                <input
                    type="number"
                    min={0}
                    max={720}
                    value={lc.dedupWindowHours}
                    onChange={(e) =>
                        update({ dedupWindowHours: Math.max(0, parseInt(e.target.value || "0", 10)) })
                    }
                    disabled={!lc.enabled}
                    className="w-32 px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-xl text-white text-sm focus:ring-2 focus:ring-violet-500 focus:border-violet-500 outline-none disabled:opacity-50"
                />
                <p className="text-xs text-zinc-500 mt-2">
                    If the same email is captured for this bot within this window, the existing
                    lead is updated instead of creating a duplicate. Set to <code>0</code> to
                    disable email-based dedup.
                </p>
            </div>

            {/* Advanced */}
            <div className="border-t border-zinc-800 pt-4">
                <button
                    type="button"
                    onClick={() => setAdvancedOpen((o) => !o)}
                    className="flex items-center gap-2 text-sm font-medium text-zinc-300 hover:text-white"
                >
                    {advancedOpen ? (
                        <ChevronDown className="w-4 h-4" />
                    ) : (
                        <ChevronRight className="w-4 h-4" />
                    )}
                    Advanced
                </button>

                {advancedOpen && (
                    <div className="mt-4 space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-zinc-300 mb-2">
                                Notify email (optional)
                            </label>
                            <input
                                type="email"
                                value={lc.notifyEmail || ""}
                                onChange={(e) => update({ notifyEmail: e.target.value })}
                                placeholder="sales@yourcompany.com"
                                disabled={!lc.enabled}
                                className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-xl text-white text-sm focus:ring-2 focus:ring-violet-500 focus:border-violet-500 outline-none disabled:opacity-50"
                            />
                            <p className="text-xs text-zinc-500 mt-2">
                                Stored on the bot. Email delivery is not wired up in v1 — this is a
                                placeholder for a future notifier.
                            </p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-zinc-300 mb-2">
                                Webhook URL (optional)
                            </label>
                            <input
                                type="url"
                                value={lc.webhookUrl || ""}
                                onChange={(e) => update({ webhookUrl: e.target.value })}
                                placeholder="https://your-crm.example.com/buildx/leads"
                                disabled={!lc.enabled}
                                className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-xl text-white text-sm focus:ring-2 focus:ring-violet-500 focus:border-violet-500 outline-none disabled:opacity-50"
                            />
                            <p className="text-xs text-zinc-500 mt-2">
                                Stored on the bot. Outbound delivery is not wired up in v1.
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
