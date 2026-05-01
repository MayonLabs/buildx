"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Bot, MoreVertical, Pencil, Trash2, Code, ExternalLink, Copy, Users } from "lucide-react";

interface BotData {
    _id: string;
    name: string;
    systemPrompt: string;
    aiModel: string;
    publicId: string;
    isActive: boolean;
    createdAt: string;
    leadCount?: number;
    theme: {
        launcher: { bgColor: string };
        primaryColor?: string; // Legacy
    };
    tools?: {
        leadCapture?: { enabled?: boolean };
    };
}

export default function BotsPage() {
    const [bots, setBots] = useState<BotData[]>([]);
    const [loading, setLoading] = useState(true);
    const [openMenu, setOpenMenu] = useState<string | null>(null);

    useEffect(() => {
        fetchBots();
    }, []);

    async function fetchBots() {
        try {
            const res = await fetch("/api/bots");
            const data = await res.json();
            setBots(data.bots || []);
        } catch (error) {
            console.error("Failed to fetch bots:", error);
        } finally {
            setLoading(false);
        }
    }

    async function deleteBot(id: string) {
        if (!confirm("Are you sure you want to delete this bot?")) return;

        try {
            await fetch(`/api/bots/${id}`, { method: "DELETE" });
            setBots(bots.filter((bot) => bot._id !== id));
        } catch (error) {
            console.error("Failed to delete bot:", error);
        }
    }

    if (loading) {
        return (
            <div className="p-6 lg:p-8">
                <div className="animate-pulse space-y-4">
                    <div className="h-8 w-48 bg-zinc-800 rounded" />
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="h-48 bg-zinc-800 rounded-2xl" />
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 lg:p-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl lg:text-3xl font-bold text-white mb-2">
                        My Bots
                    </h1>
                    <p className="text-zinc-400">
                        Manage and configure your AI chatbots.
                    </p>
                </div>
                <Link
                    href="/dashboard/bots/new"
                    className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white font-medium rounded-xl shadow-lg shadow-violet-500/25 transition-all"
                >
                    <Plus className="w-5 h-5" />
                    <span className="hidden sm:inline">Create Bot</span>
                </Link>
            </div>

            {/* Bots Grid */}
            {bots.length === 0 ? (
                <div className="bg-zinc-900/50 backdrop-blur-xl rounded-2xl border border-zinc-800 p-12 text-center">
                    <div className="w-20 h-20 bg-zinc-800 rounded-full mx-auto mb-6 flex items-center justify-center">
                        <Bot className="w-10 h-10 text-zinc-600" />
                    </div>
                    <h3 className="text-xl font-semibold text-white mb-2">No bots yet</h3>
                    <p className="text-zinc-400 mb-6">
                        Create your first bot to get started.
                    </p>
                    <Link
                        href="/dashboard/bots/new"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white font-semibold rounded-xl shadow-lg shadow-violet-500/25 transition-all"
                    >
                        <Plus className="w-5 h-5" />
                        Create Your First Bot
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {bots.map((bot) => (
                        <div
                            key={bot._id}
                            className="group bg-zinc-900/50 backdrop-blur-xl rounded-2xl border border-zinc-800 hover:border-zinc-700 p-6 transition-all"
                        >
                            {/* Bot Header */}
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div
                                        className="w-12 h-12 rounded-xl flex items-center justify-center"
                                        style={{ backgroundColor: (bot.theme?.launcher?.bgColor || bot.theme?.primaryColor || "#8b5cf6") + "20" }}
                                    >
                                        <Bot
                                            className="w-6 h-6"
                                            style={{ color: bot.theme?.launcher?.bgColor || bot.theme?.primaryColor || "#8b5cf6" }}
                                        />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-white">{bot.name}</h3>
                                        <p className="text-xs text-zinc-500">{bot.aiModel}</p>
                                    </div>
                                </div>
                                <div className="relative">
                                    <button
                                        onClick={() => setOpenMenu(openMenu === bot._id ? null : bot._id)}
                                        className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
                                    >
                                        <MoreVertical className="w-4 h-4" />
                                    </button>
                                    {openMenu === bot._id && (
                                        <div className="absolute right-0 top-full mt-1 w-48 bg-zinc-800 border border-zinc-700 rounded-xl shadow-xl py-1 z-10">
                                            <Link
                                                href={`/dashboard/bots/${bot._id}`}
                                                className="flex items-center gap-2 px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-700 hover:text-white"
                                            >
                                                <Pencil className="w-4 h-4" />
                                                Edit
                                            </Link>
                                            <Link
                                                href={`/share/${bot.publicId}`}
                                                target="_blank"
                                                className="flex items-center gap-2 px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-700 hover:text-white"
                                            >
                                                <ExternalLink className="w-4 h-4" />
                                                Preview
                                            </Link>
                                            <button
                                                onClick={() => {
                                                    navigator.clipboard.writeText(bot.publicId);
                                                    setOpenMenu(null);
                                                    alert("Bot ID copied to clipboard!");
                                                }}
                                                className="flex items-center gap-2 px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-700 hover:text-white w-full"
                                            >
                                                <Copy className="w-4 h-4" />
                                                Copy Bot ID
                                            </button>
                                            <button
                                                onClick={() => {
                                                    navigator.clipboard.writeText(
                                                        `<script src="${window.location.origin}/embed.js" data-bot-id="${bot.publicId}"></script>`
                                                    );
                                                    setOpenMenu(null);
                                                }}
                                                className="flex items-center gap-2 px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-700 hover:text-white w-full"
                                            >
                                                <Code className="w-4 h-4" />
                                                Copy Embed
                                            </button>
                                            <hr className="my-1 border-zinc-700" />
                                            <button
                                                onClick={() => {
                                                    deleteBot(bot._id);
                                                    setOpenMenu(null);
                                                }}
                                                className="flex items-center gap-2 px-4 py-2 text-sm text-red-400 hover:bg-zinc-700 hover:text-red-300 w-full"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                                Delete
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Bot Prompt Preview */}
                            <p className="text-sm text-zinc-400 line-clamp-2 mb-4">
                                {bot.systemPrompt}
                            </p>

                            {/* Bot Footer */}
                            <div className="flex items-center justify-between pt-4 border-t border-zinc-800">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <span
                                        className={`text-xs px-2 py-1 rounded-full ${bot.isActive
                                            ? "bg-emerald-500/10 text-emerald-400"
                                            : "bg-zinc-800 text-zinc-500"
                                            }`}
                                    >
                                        {bot.isActive ? "Active" : "Inactive"}
                                    </span>
                                    {bot.tools?.leadCapture?.enabled && (
                                        <Link
                                            href={`/dashboard/leads?botId=${bot._id}`}
                                            className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-violet-500/10 text-violet-300 border border-violet-500/20 hover:bg-violet-500/20"
                                            title="View leads"
                                        >
                                            <Users className="w-3 h-3" />
                                            {bot.leadCount ?? 0}
                                        </Link>
                                    )}
                                </div>
                                <Link
                                    href={`/dashboard/bots/${bot._id}`}
                                    className="text-sm text-violet-400 hover:text-violet-300 font-medium"
                                >
                                    Configure →
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
