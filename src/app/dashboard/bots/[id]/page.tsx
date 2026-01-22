"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, Loader2, Bot, Brain, Code, Terminal, Check, Copy, Globe, Layout, Power, Upload, FileText, Trash2, Moon, Sun, User, Send, Plus } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { MessageRenderer } from "@/components/message-renderer";

interface BotData {
    _id: string;
    name: string;
    systemPrompt: string;
    aiModel: string;
    temperature: number;
    publicId: string;
    allowedDomains: string[];
    widgetPosition: "bottom-right" | "bottom-left" | "top-right" | "top-left";
    isActive: boolean;
    theme: {
        primaryColor: string;
        chatTitle: string;
        welcomeMessage: string;
    };
}

interface KnowledgeDoc {
    _id: string;
    sourceName: string;
    sourceType: string;
    metadata: {
        charCount: number;
        chunkCount: number;
    };
    createdAt: string;
}



const AI_MODELS = [
    { id: "gemini-2.0-flash", name: "Gemini 2.0 Flash" },
    { id: "gemini-1.5-pro", name: "Gemini 1.5 Pro" },
    { id: "gemini-1.5-flash", name: "Gemini 1.5 Flash" },
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

const WIDGET_POSITIONS = [
    { id: "bottom-right", label: "Bottom Right" },
    { id: "bottom-left", label: "Bottom Left" },
    { id: "top-right", label: "Top Right" },
    { id: "top-left", label: "Top Left" },
];

export default function BotEditorPage() {
    const params = useParams();
    const router = useRouter();
    const [bot, setBot] = useState<BotData | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState<"prompt" | "model" | "knowledge" | "embed">("prompt");
    const [copied, setCopied] = useState(false);
    const [newDomain, setNewDomain] = useState("");

    // Knowledge State
    const [knowledge, setKnowledge] = useState<KnowledgeDoc[]>([]);
    const [knowledgeLoading, setKnowledgeLoading] = useState(false);
    const [uploading, setUploading] = useState(false);

    // Fetch Bot Data
    useEffect(() => {
        async function fetchBot() {
            try {
                const res = await fetch(`/api/bots/${params.id}`);
                if (!res.ok) throw new Error("Bot not found");
                const data = await res.json();

                // Ensure array/defaults exist
                const botData = data.bot;
                if (!botData.allowedDomains) botData.allowedDomains = [];
                if (!botData.widgetPosition) botData.widgetPosition = "bottom-right";
                // Ensure defaults exist for theme properties
                if (!botData.theme) botData.theme = {};
                botData.theme.primaryColor = botData.theme.primaryColor || "#8b5cf6";
                botData.theme.chatTitle = botData.theme.chatTitle || botData.name || "Chat Bot";
                botData.theme.welcomeMessage = botData.theme.welcomeMessage || "Hi there! How can I help you?";

                setBot(botData);
            } catch (error) {
                console.error(error);
                router.push("/dashboard/bots");
            } finally {
                setLoading(false);
            }
        }
        fetchBot();
    }, [params.id, router]);

    // Fetch Knowledge
    useEffect(() => {
        if (activeTab === "knowledge" && bot) {
            fetchKnowledge();
        }
    }, [activeTab, bot?._id]);

    async function fetchKnowledge() {
        if (!bot) return;
        setKnowledgeLoading(true);
        try {
            const res = await fetch(`/api/bots/${bot._id}/knowledge`);
            if (res.ok) {
                const data = await res.json();
                setKnowledge(data.documents || []);
            }
        } catch (error) {
            console.error("Failed to fetch knowledge", error);
        } finally {
            setKnowledgeLoading(false);
        }
    }

    async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
        if (!e.target.files || !e.target.files[0] || !bot) return;

        const file = e.target.files[0];
        if (file.size > 10 * 1024 * 1024) {
            alert("File size too large (Max 10MB)");
            return;
        }

        setUploading(true);
        const formData = new FormData();
        formData.append("file", file);

        try {
            const res = await fetch(`/api/bots/${bot._id}/knowledge`, {
                method: "POST",
                body: formData,
            });

            if (res.ok) {
                await fetchKnowledge();
            } else {
                const err = await res.json();
                alert(err.error || "Upload failed");
            }
        } catch (error) {
            console.error("Upload error", error);
            alert("Upload failed");
        } finally {
            setUploading(false);
            // Reset input
            e.target.value = "";
        }
    }

    async function handleDeleteKnowledge(docId: string) {
        if (!bot) return;
        const confirmed = window.confirm("Are you sure you want to delete this document?");
        if (!confirmed) return;

        try {
            const res = await fetch(`/api/bots/${bot._id}/knowledge/${docId}`, {
                method: "DELETE",
            });

            if (res.ok) {
                setKnowledge(knowledge.filter(k => k._id !== docId));
            } else {
                const err = await res.json();
                alert(err.error || "Failed to delete document");
            }
        } catch (error) {
            console.error("Delete error", error);
            alert("Error deleting document");
        }
    }

    // Save Changes
    async function handleSave(e?: React.FormEvent) {
        if (e) e.preventDefault();
        if (!bot) return;
        setSaving(true);
        try {
            const res = await fetch(`/api/bots/${bot._id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(bot),
            });
            if (!res.ok) throw new Error("Failed to save");
        } catch (error) {
            alert("Error saving bot");
        } finally {
            setSaving(false);
        }
    }

    // Embed Code Copy
    const handleCopyCode = () => {
        if (!bot) return;
        const code = `<script src="${window.location.origin}/embed.js" data-bot-id="${bot.publicId}"${bot.theme.primaryColor !== '#8b5cf6' ? ` data-color="${bot.theme.primaryColor}"` : ''}${bot.widgetPosition !== 'bottom-right' ? ` data-position="${bot.widgetPosition}"` : ''}></script>`;
        navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    // Domain Management
    const addDomain = () => {
        if (!bot || !newDomain.trim()) return;
        if (bot.allowedDomains.includes(newDomain.trim())) return;
        setBot({ ...bot, allowedDomains: [...bot.allowedDomains, newDomain.trim()] });
        setNewDomain("");
    };

    const removeDomain = (domain: string) => {
        if (!bot) return;
        setBot({ ...bot, allowedDomains: bot.allowedDomains.filter(d => d !== domain) });
    };

    // Preview State
    const [previewMessages, setPreviewMessages] = useState<{ role: "user" | "assistant", content: string }[]>([]);
    const [previewInput, setPreviewInput] = useState("");
    const [isPreviewLoading, setIsPreviewLoading] = useState(false);

    // Initialize/Reset Preview
    useEffect(() => {
        if (bot?.theme?.welcomeMessage) {
            setPreviewMessages([{ role: "assistant", content: bot.theme.welcomeMessage }]);
        }
    }, [bot?.theme?.welcomeMessage]);


    const handlePreviewSend = async () => {
        if (!previewInput.trim() || !bot || isPreviewLoading) return;

        const userMsg = previewInput.trim();
        setPreviewInput("");
        const newHistory = [...previewMessages, { role: "user" as const, content: userMsg }];
        setPreviewMessages(newHistory);
        setIsPreviewLoading(true);

        try {
            const res = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    message: userMsg,
                    botId: bot.publicId,
                    history: previewMessages, // Send previous history context
                }),
            });

            if (res.ok) {
                const data = await res.json();
                setPreviewMessages([...newHistory, { role: "assistant", content: data.message }]);
            } else {
                const error = await res.json();
                setPreviewMessages([...newHistory, { role: "assistant", content: `Error: ${error.error || "Failed to get response"}` }]);
            }
        } catch (error) {
            setPreviewMessages([...newHistory, { role: "assistant", content: "Error: Failed to connect to chat API." }]);
        } finally {
            setIsPreviewLoading(false);
        }
    };

    if (loading) return <div className="p-8 text-center text-zinc-500">Loading editor...</div>;
    if (!bot) return null;

    return (
        <div className="p-6 lg:p-8 max-w-5xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <Link href="/dashboard/bots" className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg">
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl font-bold text-white max-w-md truncate">{bot.name}</h1>
                            <span className={`text-xs px-2 py-0.5 rounded-full border ${bot.isActive ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "bg-zinc-800 border-zinc-700 text-zinc-400"}`}>
                                {bot.isActive ? "Active" : "Inactive"}
                            </span>
                        </div>
                        <p className="text-zinc-400 text-sm">Configuration & Settings</p>
                    </div>
                </div>
                <button
                    onClick={() => handleSave()}
                    disabled={saving}
                    className="flex items-center gap-2 px-6 py-2.5 bg-violet-600 hover:bg-violet-500 text-white font-medium rounded-xl transition-colors disabled:opacity-50"
                >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Save Changes
                </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 p-1 bg-zinc-900 rounded-xl mb-6 overflow-x-auto">
                {[
                    { id: "prompt", label: "Prompt", icon: Terminal },
                    { id: "model", label: "Model", icon: Bot },
                    { id: "knowledge", label: "Knowledge", icon: Brain },
                    { id: "embed", label: "Embed", icon: Code },
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg transition-colors whitespace-nowrap flex-1 justify-center ${activeTab === tab.id ? "bg-zinc-800 text-white shadow-sm" : "text-zinc-400 hover:text-white hover:bg-zinc-800/50"}`}
                    >
                        <tab.icon className="w-4 h-4" />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Content Area */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Form */}
                <div className="lg:col-span-2 space-y-6">
                    <form onSubmit={(e) => { e.preventDefault(); handleSave(); }} className="bg-zinc-900/50 backdrop-blur-xl rounded-2xl border border-zinc-800 p-6">
                        {/* PROMPT TAB */}
                        {activeTab === "prompt" && (
                            <div className="space-y-6">
                                <div>
                                    <label className="block text-sm font-medium text-zinc-300 mb-2">Bot Name</label>
                                    <input
                                        type="text"
                                        value={bot.name}
                                        onChange={(e) => setBot({ ...bot, name: e.target.value })}
                                        className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-xl text-white focus:ring-2 focus:ring-violet-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-zinc-300 mb-2">System Prompt</label>
                                    <textarea
                                        value={bot.systemPrompt}
                                        onChange={(e) => setBot({ ...bot, systemPrompt: e.target.value })}
                                        rows={12}
                                        className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-xl text-white focus:ring-2 focus:ring-violet-500 font-mono text-sm leading-relaxed"
                                    />
                                    <p className="text-xs text-zinc-500 mt-2">markdown supported</p>
                                </div>
                                <div className="pt-4 border-t border-zinc-800">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-white">Bot Status</p>
                                            <p className="text-xs text-zinc-500">Enable or disable public access</p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setBot({ ...bot, isActive: !bot.isActive })}
                                            className={`w-12 h-6 rounded-full transition-colors relative ${bot.isActive ? "bg-emerald-500" : "bg-zinc-700"}`}
                                        >
                                            <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${bot.isActive ? "left-7" : "left-1"}`} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* MODEL TAB */}
                        {activeTab === "model" && (
                            <div className="space-y-6">
                                <div>
                                    <label className="block text-sm font-medium text-zinc-300 mb-4">AI Model</label>
                                    <div className="grid grid-cols-1 gap-3">
                                        {AI_MODELS.map((model) => (
                                            <label key={model.id} className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all ${bot.aiModel === model.id ? "bg-violet-500/10 border-violet-500 text-white" : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700"}`}>
                                                <input
                                                    type="radio"
                                                    name="aiModel"
                                                    value={model.id}
                                                    checked={bot.aiModel === model.id}
                                                    onChange={(e) => setBot({ ...bot, aiModel: e.target.value })}
                                                    className="w-4 h-4 accent-violet-500"
                                                />
                                                <span className="font-medium">{model.name}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-zinc-300 mb-2">Temperature: {bot.temperature}</label>
                                    <input
                                        type="range"
                                        min="0"
                                        max="1"
                                        step="0.1"
                                        value={bot.temperature}
                                        onChange={(e) => setBot({ ...bot, temperature: parseFloat(e.target.value) })}
                                        className="w-full accent-violet-500"
                                    />
                                    <div className="flex justify-between text-xs text-zinc-500 mt-1">
                                        <span>Precise (0.0)</span>
                                        <span>Creative (1.0)</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* KNOWLEDGE TAB */}
                        {activeTab === "knowledge" && (
                            <div className="space-y-6">
                                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 text-center">
                                    <h3 className="text-lg font-medium text-white mb-2">Upload Knowledge</h3>
                                    <p className="text-sm text-zinc-400 mb-6 max-w-sm mx-auto">
                                        Upload PDF or Text files to train your bot. The content will be automatically indexed for vector search.
                                    </p>

                                    <div className="flex flex-col items-center justify-center gap-4">
                                        <label className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-zinc-700 rounded-xl cursor-pointer hover:border-violet-500 hover:bg-zinc-800/50 transition-all ${uploading ? "opacity-50 pointer-events-none" : ""}`}>
                                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                                {uploading ? (
                                                    <Loader2 className="w-8 h-8 text-violet-500 animate-spin mb-2" />
                                                ) : (
                                                    <Upload className="w-8 h-8 text-zinc-500 mb-2" />
                                                )}
                                                <p className="text-sm text-zinc-400">
                                                    {uploading ? "Processing..." : "Click to upload or drag & drop"}
                                                </p>
                                                <p className="text-xs text-zinc-500 mt-1">PDF, TXT, MD (Max 10MB)</p>
                                            </div>
                                            <input
                                                type="file"
                                                className="hidden"
                                                accept=".pdf,.txt,.md"
                                                onChange={handleFileUpload}
                                                disabled={uploading}
                                            />
                                        </label>
                                    </div>
                                </div>

                                <div>
                                    <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-wider mb-4">Indexed Documents</h3>
                                    {knowledgeLoading ? (
                                        <div className="text-center py-8 text-zinc-500">Loading documents...</div>
                                    ) : knowledge.length === 0 ? (
                                        <div className="text-center py-8 bg-zinc-900/50 rounded-xl border border-dashed border-zinc-800">
                                            <FileText className="w-8 h-8 text-zinc-700 mx-auto mb-2" />
                                            <p className="text-sm text-zinc-500">No documents indexed yet.</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {knowledge.map((doc) => (
                                                <div key={doc._id} className="flex items-center justify-between p-4 bg-zinc-900 border border-zinc-800 rounded-xl group hover:border-zinc-700 transition-colors">
                                                    <div className="flex items-center gap-3 overflow-hidden">
                                                        <div className="w-10 h-10 bg-violet-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
                                                            <FileText className="w-5 h-5 text-violet-400" />
                                                        </div>
                                                        <div className="min-w-0">
                                                            <h4 className="font-medium text-white text-sm truncate">{doc.sourceName || "Untitled Document"}</h4>
                                                            <p className="text-xs text-zinc-500">
                                                                {doc.metadata?.charCount ? (doc.metadata.charCount / 1024).toFixed(1) : "0.0"} KB • {doc.createdAt ? new Date(doc.createdAt).toLocaleDateString() : "Unknown Date"}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={() => handleDeleteKnowledge(doc._id)}
                                                        className="p-2 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                                                        title="Delete Document"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* EMBED TAB */}
                        {activeTab === "embed" && (
                            <div className="space-y-8">
                                {/* Appearance */}
                                <div>
                                    <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                                        <Layout className="w-4 h-4" /> Appearance
                                    </h3>
                                    <div className="grid grid-cols-1 gap-6">
                                        <div>
                                            <label className="block text-xs font-medium text-zinc-400 mb-2">Theme Color</label>
                                            <div className="flex flex-wrap gap-2 items-center">
                                                {THEME_COLORS.map((color) => (
                                                    <button
                                                        key={color}
                                                        type="button"
                                                        onClick={() => setBot({ ...bot, theme: { ...bot.theme, primaryColor: color } })}
                                                        className={`w-8 h-8 rounded-full transition-transform hover:scale-110 ${bot.theme.primaryColor === color ? "ring-2 ring-white ring-offset-2 ring-offset-zinc-900" : ""}`}
                                                        style={{ backgroundColor: color }}
                                                    />
                                                ))}
                                                <label className="w-8 h-8 rounded-full bg-zinc-800 border-2 border-dashed border-zinc-600 flex items-center justify-center cursor-pointer hover:border-zinc-400 hover:text-white text-zinc-500 transition-colors">
                                                    <Plus className="w-4 h-4" />
                                                    <input
                                                        type="color"
                                                        className="invisible w-0 h-0 opacity-0"
                                                        value={bot.theme.primaryColor}
                                                        onChange={(e) => setBot({ ...bot, theme: { ...bot.theme, primaryColor: e.target.value } })}
                                                    />
                                                </label>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-xs font-medium text-zinc-400 mb-2">Chat Title</label>
                                                <input
                                                    type="text"
                                                    value={bot.theme.chatTitle}
                                                    onChange={(e) => setBot({ ...bot, theme: { ...bot.theme, chatTitle: e.target.value } })}
                                                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-white"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-zinc-400 mb-2">Widget Position</label>
                                                <div className="grid grid-cols-2 gap-2">
                                                    {WIDGET_POSITIONS.map(pos => (
                                                        <label key={pos.id} className={`cursor-pointer flex items-center justify-center px-3 py-2 rounded-lg border text-xs font-medium transition-all ${bot.widgetPosition === pos.id ? "bg-violet-500/10 border-violet-500 text-violet-400" : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-300"}`}>
                                                            <input
                                                                type="radio"
                                                                name="widgetPosition"
                                                                value={pos.id}
                                                                checked={bot.widgetPosition === pos.id}
                                                                onChange={(e) => setBot({ ...bot, widgetPosition: e.target.value as any })}
                                                                className="hidden"
                                                            />
                                                            {pos.label}
                                                        </label>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-zinc-400 mb-2">Welcome Message</label>
                                            <input
                                                type="text"
                                                value={bot.theme.welcomeMessage}
                                                onChange={(e) => setBot({ ...bot, theme: { ...bot.theme, welcomeMessage: e.target.value } })}
                                                className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-white"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <hr className="border-zinc-800" />

                                {/* Security */}
                                <div>
                                    <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                                        <Globe className="w-4 h-4" /> Security
                                    </h3>
                                    <div className="mb-4">
                                        <label className="block text-xs font-medium text-zinc-400 mb-2">
                                            Allowed Domains (Optional)
                                            <span className="block text-[10px] text-zinc-500 font-normal">Leave empty to allow all domains. Add full domain (e.g. "myapp.com").</span>
                                        </label>
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                value={newDomain}
                                                onChange={(e) => setNewDomain(e.target.value)}
                                                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addDomain())}
                                                placeholder="example.com"
                                                className="flex-1 px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-white"
                                            />
                                            <button
                                                type="button"
                                                onClick={addDomain}
                                                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-sm"
                                            >
                                                Add
                                            </button>
                                        </div>
                                    </div>

                                    {bot.allowedDomains.length > 0 && (
                                        <div className="flex flex-wrap gap-2">
                                            {bot.allowedDomains.map(domain => (
                                                <span key={domain} className="px-2 py-1 bg-zinc-800 rounded-md text-xs text-zinc-300 flex items-center gap-2">
                                                    {domain}
                                                    <button onClick={() => removeDomain(domain)} className="text-zinc-500 hover:text-white">×</button>
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <hr className="border-zinc-800" />

                                {/* Embed Code */}
                                <div>
                                    <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                                        <Code className="w-4 h-4" /> Integration
                                    </h3>
                                    <p className="text-sm text-zinc-400 mb-3">Copy this code and paste it into your website's <code>&lt;body&gt;</code> tag.</p>
                                    <div className="relative bg-zinc-950 border border-zinc-900 rounded-xl p-4 font-mono text-xs text-zinc-400 overflow-x-auto">
                                        <code className="block whitespace-pre-wrap break-all">
                                            {`<script src="${typeof window !== 'undefined' ? window.location.origin : ''}/embed.js" data-bot-id="${bot.publicId}"${bot.theme.primaryColor !== '#8b5cf6' ? ` data-color="${bot.theme.primaryColor}"` : ''}${bot.widgetPosition !== 'bottom-right' ? ` data-position="${bot.widgetPosition}"` : ' data-position="bottom-right"'}></script>`}
                                        </code>
                                        <button
                                            type="button"
                                            onClick={handleCopyCode}
                                            className="absolute top-2 right-2 p-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-white transition-colors"
                                        >
                                            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </form>
                </div>

                {/* Live Preview */}
                <div className="lg:col-span-1">
                    <div className="sticky top-8">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-medium text-zinc-500">Live Preview</h3>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setPreviewMessages([{ role: "assistant", content: bot.theme?.welcomeMessage || "Hi!" }])}
                                    className="text-xs text-zinc-500 hover:text-zinc-300 flex items-center gap-1"
                                >
                                    <Bot className="w-3 h-3" /> Reset
                                </button>
                            </div>
                        </div>

                        <div className="rounded-2xl shadow-xl overflow-hidden border h-[600px] flex flex-col relative w-full max-w-sm mx-auto transition-colors bg-zinc-900 border-zinc-800">
                            {/* Chat Header */}
                            <div className="p-4 flex items-center justify-between transition-colors" style={{ backgroundColor: bot.theme?.primaryColor || "#8b5cf6" }}>
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                                        <Bot className="w-5 h-5 text-white" />
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-white text-sm">{bot.theme?.chatTitle || "Chat Bot"}</h4>
                                        <p className="text-xs text-white/70">Powered by AI</p>
                                    </div>
                                </div>
                            </div>

                            {/* Chat Messages */}
                            <div className="flex-1 p-4 space-y-4 overflow-y-auto bg-zinc-950/50">
                                {previewMessages.length === 0 && (
                                    <div className="text-center py-12">
                                        <div
                                            className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center"
                                            style={{ backgroundColor: (bot.theme?.primaryColor || "#8b5cf6") + "20" }}
                                        >
                                            <Bot className="w-8 h-8" style={{ color: bot.theme?.primaryColor || "#8b5cf6" }} />
                                        </div>
                                        <p className="text-lg mb-2 text-zinc-300">{bot.theme?.welcomeMessage || "Hi!"}</p>
                                        <p className="text-zinc-500 text-sm">Ask me anything!</p>
                                    </div>
                                )}
                                {previewMessages.map((msg, idx) => (
                                    <div key={idx} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                                        {msg.role === "assistant" && (
                                            <div
                                                className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                                                style={{ backgroundColor: (bot.theme?.primaryColor || "#8b5cf6") + "20" }}
                                            >
                                                <Bot className="w-4 h-4" style={{ color: bot.theme?.primaryColor || "#8b5cf6" }} />
                                            </div>
                                        )}
                                        <div
                                            className={`max-w-[80%] px-4 py-3 rounded-2xl shadow-sm ${msg.role === "user"
                                                ? "text-white"
                                                : "bg-zinc-800 border border-zinc-700 text-zinc-200"
                                                }`}
                                            style={msg.role === "user" ? { backgroundColor: bot.theme?.primaryColor || "#8b5cf6" } : {}}
                                        >
                                            <MessageRenderer content={msg.content} role={msg.role} />
                                        </div>
                                        {msg.role === "user" && (
                                            <div className="w-8 h-8 rounded-full bg-zinc-700 flex items-center justify-center flex-shrink-0">
                                                <User className="w-4 h-4 text-zinc-300" />
                                            </div>
                                        )}
                                    </div>
                                ))}
                                {isPreviewLoading && (
                                    <div className="flex gap-3">
                                        <div
                                            className="w-8 h-8 rounded-full flex items-center justify-center"
                                            style={{ backgroundColor: (bot.theme?.primaryColor || "#8b5cf6") + "20" }}
                                        >
                                            <Bot className="w-4 h-4" style={{ color: bot.theme?.primaryColor || "#8b5cf6" }} />
                                        </div>
                                        <div className="px-4 py-3 rounded-2xl bg-zinc-800 border border-zinc-700">
                                            <div className="flex gap-1">
                                                <span className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce" />
                                                <span className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }} />
                                                <span className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }} />
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Input Area */}
                            <div className="p-4 border-t bg-zinc-900 border-zinc-800">
                                <form
                                    onSubmit={(e) => {
                                        e.preventDefault();
                                        handlePreviewSend();
                                    }}
                                    className="flex gap-2"
                                >
                                    <input
                                        type="text"
                                        value={previewInput}
                                        onChange={(e) => setPreviewInput(e.target.value)}
                                        placeholder="Type a message..."
                                        className="flex-1 px-4 py-3 rounded-full text-sm focus:outline-none focus:ring-2 focus:border-transparent transition-all bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 focus:bg-zinc-900"
                                        style={{ '--tw-ring-color': bot.theme?.primaryColor || "#8b5cf6" } as any}
                                    />
                                    <button
                                        type="submit"
                                        disabled={!previewInput.trim() || isPreviewLoading}
                                        className="p-3 text-white rounded-full transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
                                        style={{ backgroundColor: bot.theme?.primaryColor || "#8b5cf6" }}
                                    >
                                        <Send className="w-5 h-5" />
                                    </button>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
