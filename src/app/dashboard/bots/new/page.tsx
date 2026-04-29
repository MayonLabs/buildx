"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import Link from "next/link";

const AI_MODELS = [
    { id: "gemini-2.5-flash", name: "Gemini 2.5 Flash", description: "Latest · fast and capable" },
    { id: "gemini-2.5-pro", name: "Gemini 2.5 Pro", description: "Most capable model" },
    { id: "gemini-2.5-flash-lite", name: "Gemini 2.5 Flash Lite", description: "Fastest · lowest cost" },
];

const THEME_COLORS = [
    "#8b5cf6", // Violet
    "#6366f1", // Indigo
    "#3b82f6", // Blue
    "#06b6d4", // Cyan
    "#10b981", // Emerald
    "#f59e0b", // Amber
    "#ef4444", // Red
    "#ec4899", // Pink
];

export default function NewBotPage() {
    const router = useRouter();
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState<"prompt" | "model" | "appearance">("prompt");

    const [formData, setFormData] = useState({
        name: "",
        systemPrompt: "You are a helpful assistant. Answer questions clearly and concisely.",
        temperature: 0.7,
        aiModel: "gemini-2.5-flash",
        theme: {
            primaryColor: "#8b5cf6",
            chatTitle: "Chat with us",
            welcomeMessage: "Hello! How can I help you today?",
        },
    });

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setSaving(true);

        try {
            const res = await fetch("/api/bots", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            if (res.ok) {
                const { bot } = await res.json();
                router.push(`/dashboard/bots/${bot._id}`);
            } else {
                const error = await res.json();
                alert(error.error || "Failed to create bot");
            }
        } catch (error) {
            console.error("Error creating bot:", error);
            alert("Failed to create bot");
        } finally {
            setSaving(false);
        }
    }

    const tabs = [
        { id: "prompt", label: "Prompt" },
        { id: "model", label: "Model" },
        { id: "appearance", label: "Appearance" },
    ] as const;

    return (
        <div className="p-6 lg:p-8 max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
                <Link
                    href="/dashboard/bots"
                    className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
                >
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-white">Create New Bot</h1>
                    <p className="text-zinc-400 text-sm">
                        Configure your AI chatbot settings
                    </p>
                </div>
            </div>

            <form onSubmit={handleSubmit}>
                {/* Bot Name */}
                <div className="mb-6">
                    <label className="block text-sm font-medium text-zinc-300 mb-2">
                        Bot Name
                    </label>
                    <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="My Awesome Bot"
                        className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                    />
                </div>

                {/* Tabs */}
                <div className="flex gap-1 p-1 bg-zinc-900 rounded-xl mb-6">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            type="button"
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex-1 px-4 py-2.5 text-sm font-medium rounded-lg transition-colors ${activeTab === tab.id
                                ? "bg-zinc-800 text-white"
                                : "text-zinc-400 hover:text-white"
                                }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Tab Content */}
                <div className="bg-zinc-900/50 backdrop-blur-xl rounded-2xl border border-zinc-800 p-6 mb-6">
                    {activeTab === "prompt" && (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-zinc-300 mb-2">
                                    System Prompt
                                </label>
                                <textarea
                                    value={formData.systemPrompt}
                                    onChange={(e) =>
                                        setFormData({ ...formData, systemPrompt: e.target.value })
                                    }
                                    rows={8}
                                    placeholder="You are a helpful assistant..."
                                    className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent resize-none"
                                />
                                <p className="text-xs text-zinc-500 mt-2">
                                    Define how your bot should behave and respond to users.
                                </p>
                            </div>
                        </div>
                    )}

                    {activeTab === "model" && (
                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-zinc-300 mb-3">
                                    AI Model
                                </label>
                                <div className="grid grid-cols-2 gap-3">
                                    {AI_MODELS.map((model) => (
                                        <button
                                            key={model.id}
                                            type="button"
                                            onClick={() =>
                                                setFormData({ ...formData, aiModel: model.id })
                                            }
                                            className={`p-4 rounded-xl border text-left transition-all ${formData.aiModel === model.id
                                                ? "bg-violet-500/10 border-violet-500/50 text-white"
                                                : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700"
                                                }`}
                                        >
                                            <p className="font-medium">{model.name}</p>
                                            <p className="text-xs mt-1 opacity-70">{model.description}</p>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-zinc-300 mb-3">
                                    Temperature: {formData.temperature}
                                </label>
                                <input
                                    type="range"
                                    min="0"
                                    max="2"
                                    step="0.1"
                                    value={formData.temperature}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            temperature: parseFloat(e.target.value),
                                        })
                                    }
                                    className="w-full accent-violet-500"
                                />
                                <div className="flex justify-between text-xs text-zinc-500 mt-1">
                                    <span>Precise</span>
                                    <span>Creative</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === "appearance" && (
                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-zinc-300 mb-3">
                                    Theme Color
                                </label>
                                <div className="flex gap-3">
                                    {THEME_COLORS.map((color) => (
                                        <button
                                            key={color}
                                            type="button"
                                            onClick={() =>
                                                setFormData({
                                                    ...formData,
                                                    theme: { ...formData.theme, primaryColor: color },
                                                })
                                            }
                                            className={`w-10 h-10 rounded-xl transition-transform hover:scale-110 ${formData.theme.primaryColor === color
                                                ? "ring-2 ring-white ring-offset-2 ring-offset-zinc-900"
                                                : ""
                                                }`}
                                            style={{ backgroundColor: color }}
                                        />
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-zinc-300 mb-2">
                                    Chat Title
                                </label>
                                <input
                                    type="text"
                                    value={formData.theme.chatTitle}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            theme: { ...formData.theme, chatTitle: e.target.value },
                                        })
                                    }
                                    className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-zinc-300 mb-2">
                                    Welcome Message
                                </label>
                                <input
                                    type="text"
                                    value={formData.theme.welcomeMessage}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            theme: { ...formData.theme, welcomeMessage: e.target.value },
                                        })
                                    }
                                    className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* Submit */}
                <div className="flex justify-end gap-3">
                    <Link
                        href="/dashboard/bots"
                        className="px-6 py-3 text-zinc-400 hover:text-white font-medium rounded-xl transition-colors"
                    >
                        Cancel
                    </Link>
                    <button
                        type="submit"
                        disabled={saving || !formData.name}
                        className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white font-semibold rounded-xl shadow-lg shadow-violet-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {saving ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            <Save className="w-5 h-5" />
                        )}
                        Create Bot
                    </button>
                </div>
            </form>
        </div>
    );
}
