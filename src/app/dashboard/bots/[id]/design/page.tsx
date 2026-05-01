"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
    ArrowLeft,
    Save,
    Loader2,
    Check,
    Eye,
} from "lucide-react";
import { DesignTab } from "@/components/dashboard/bot-editor/design-tab";
import type { IBotTheme } from "@/models/bot.model";

interface BotData {
    _id: string;
    name: string;
    publicId: string;
    widgetPosition: string;
    theme: IBotTheme & {
        primaryColor?: string;
        chatTitle?: string;
    };
    [key: string]: unknown;
}

export default function DesignStudioPage() {
    const params = useParams();
    const router = useRouter();
    const botId = params.id as string;

    const [bot, setBot] = useState<BotData | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [savedAt, setSavedAt] = useState<Date | null>(null);
    const [dirty, setDirty] = useState(false);
    const [copied, setCopied] = useState(false);

    // Fetch bot — mirrors the bot editor's hydration so legacy theme fields are normalised.
    useEffect(() => {
        let cancelled = false;
        async function fetchBot() {
            try {
                const res = await fetch(`/api/bots/${botId}`);
                if (!res.ok) throw new Error("Bot not found");
                const data = await res.json();
                const botData = data.bot;

                if (!botData.theme) botData.theme = {};
                const primary = botData.theme.primaryColor || "#8b5cf6";
                const title = botData.theme.chatTitle || botData.name || "Chat with us";
                const welcome = botData.theme.welcomeMessage || "Hello! How can I help you?";

                botData.theme = {
                    ...botData.theme,
                    launcher: {
                        bgColor: botData.theme.launcher?.bgColor || primary,
                        iconColor: botData.theme.launcher?.iconColor || "#ffffff",
                        ...botData.theme.launcher,
                    },
                    header: {
                        bgColor: botData.theme.header?.bgColor || primary,
                        textColor: botData.theme.header?.textColor || "#ffffff",
                        title: botData.theme.header?.title || title,
                        ...botData.theme.header,
                    },
                    chatWindow: { ...botData.theme.chatWindow },
                    userMessage: {
                        bgColor: botData.theme.userMessage?.bgColor || "#3b82f6",
                        textColor: botData.theme.userMessage?.textColor || "#ffffff",
                        showAvatar: botData.theme.userMessage?.showAvatar ?? false,
                        ...botData.theme.userMessage,
                    },
                    botMessage: {
                        bgColor: botData.theme.botMessage?.bgColor || "#f3f4f6",
                        textColor: botData.theme.botMessage?.textColor || "#1f2937",
                        showAvatar: botData.theme.botMessage?.showAvatar ?? true,
                        ...botData.theme.botMessage,
                    },
                    inputArea: { ...botData.theme.inputArea },
                    sendButton: { ...botData.theme.sendButton },
                    common: {
                        fontFamily: botData.theme.common?.fontFamily || "Inter, sans-serif",
                        borderRadius: botData.theme.common?.borderRadius || "0.75rem",
                        shadow:
                            botData.theme.common?.shadow ||
                            "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                        ...botData.theme.common,
                    },
                    showBranding: botData.theme.showBranding ?? true,
                    welcomeMessage: welcome,
                    welcomeMessageStyle: botData.theme.welcomeMessageStyle,
                    primaryColor: primary,
                    chatTitle: title,
                };

                if (!cancelled) {
                    setBot(botData);
                }
            } catch (err) {
                console.error("Failed to load bot for design studio", err);
                router.push(`/dashboard/bots/${botId}`);
            } finally {
                if (!cancelled) setLoading(false);
            }
        }
        fetchBot();
        return () => {
            cancelled = true;
        };
    }, [botId, router]);

    // Mark dirty whenever the local bot state diverges from the last saved version.
    // We track "dirty" via a flag that flips on any setBot call after the initial load.
    const markDirty = useCallback(() => setDirty(true), []);

    // Wrap setBot from DesignTab so any change flips the dirty flag.
    const setBotWithDirty: typeof setBot = useCallback(
        (next) => {
            setBot(prev => {
                const resolved =
                    typeof next === "function"
                        ? (next as (p: BotData | null) => BotData | null)(prev)
                        : next;
                if (resolved && prev) markDirty();
                return resolved;
            });
        },
        [markDirty]
    );

    // beforeunload guard — warn on tab close / refresh with unsaved changes
    useEffect(() => {
        function handler(e: BeforeUnloadEvent) {
            if (!dirty) return;
            e.preventDefault();
            e.returnValue = "";
        }
        window.addEventListener("beforeunload", handler);
        return () => window.removeEventListener("beforeunload", handler);
    }, [dirty]);

    async function handleSave() {
        if (!bot || saving) return;
        setSaving(true);
        try {
            const res = await fetch(`/api/bots/${bot._id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(bot),
            });
            if (!res.ok) throw new Error("Save failed");
            setDirty(false);
            setSavedAt(new Date());
        } catch (err) {
            console.error(err);
            alert("Error saving design");
        } finally {
            setSaving(false);
        }
    }

    function handleBack() {
        if (dirty && !confirm("You have unsaved changes. Leave anyway?")) return;
        router.push(`/dashboard/bots/${botId}`);
    }

    function handleCopyCode() {
        if (!bot) return;
        const code = `<script src="${window.location.origin}/embed.js" data-bot-id="${bot.publicId}"></script>`;
        navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }

    if (loading) {
        return (
            <div className="h-[calc(100vh-4rem)] flex items-center justify-center text-zinc-500">
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                Loading design studio…
            </div>
        );
    }
    if (!bot) return null;

    return (
        <div className="flex flex-col h-[calc(100vh)]">
            {/* Top bar */}
            <header className="flex items-center justify-between gap-4 px-6 py-3 border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-xl shrink-0">
                <div className="flex items-center gap-3 min-w-0">
                    <button
                        onClick={handleBack}
                        className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
                        title="Back to bot editor"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div className="min-w-0">
                        <div className="flex items-center gap-2">
                            <h1 className="text-base font-semibold text-white truncate max-w-[28ch]">
                                {bot.name}
                            </h1>
                            <span className="text-xs px-2 py-0.5 rounded-full bg-violet-500/10 border border-violet-500/30 text-violet-300">
                                Design Studio
                            </span>
                            {dirty && (
                                <span
                                    className="text-xs px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300"
                                    title="Unsaved changes"
                                >
                                    Unsaved
                                </span>
                            )}
                        </div>
                        <p className="text-xs text-zinc-500">
                            Live preview updates as you edit. Save to publish.
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Link
                        href={`/share/${bot.publicId}`}
                        target="_blank"
                        className="flex items-center gap-1.5 px-3 py-2 text-sm text-zinc-300 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
                        title="Open standalone preview"
                    >
                        <Eye className="w-4 h-4" />
                        <span className="hidden sm:inline">Preview</span>
                    </Link>
                    <button
                        onClick={handleCopyCode}
                        className="flex items-center gap-1.5 px-3 py-2 text-sm text-zinc-300 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
                        title="Copy embed snippet"
                    >
                        {copied ? (
                            <>
                                <Check className="w-4 h-4 text-emerald-400" />
                                <span className="hidden sm:inline">Copied</span>
                            </>
                        ) : (
                            <span className="hidden sm:inline">Copy embed</span>
                        )}
                    </button>
                    {savedAt && !dirty && (
                        <span className="hidden md:inline text-xs text-zinc-500 mr-2">
                            Saved {savedAt.toLocaleTimeString()}
                        </span>
                    )}
                    <button
                        onClick={handleSave}
                        disabled={saving || !dirty}
                        className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {saving ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <Save className="w-4 h-4" />
                        )}
                        Save
                    </button>
                </div>
            </header>

            {/* Body — DesignTab is already a split-pane (canvas + inspector). */}
            <div className="flex-1 min-h-0 px-4 lg:px-6 py-4 lg:py-6 overflow-hidden">
                <DesignTab
                    bot={bot}
                    setBot={setBotWithDirty}
                    handleCopyCode={handleCopyCode}
                    copied={copied}
                />
            </div>
        </div>
    );
}
