"use client";

import {
    Settings,
    Database,
    Loader2,
    AlertCircle,
    CheckCircle2,
    XCircle,
    Zap,
    Sparkles,
    Eye,
    EyeOff,
} from "lucide-react";
import { useState, useEffect } from "react";
import { SystemHealth } from "@/components/dashboard/system-health";

interface QdrantConfig {
    url?: string;
    apiKey?: string;
    indexName?: string;
}

type TestStatus = "idle" | "loading" | "success" | "error";
type SaveStatus = "idle" | "saving" | "saved";

export default function SettingsPage() {
    const [loadingConfig, setLoadingConfig] = useState(true);
    const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
    const [testStatus, setTestStatus] = useState<TestStatus>("idle");
    const [testMessage, setTestMessage] = useState("");

    const [qdrantConfig, setQdrantConfig] = useState<QdrantConfig>({ url: "", apiKey: "", indexName: "" });

    // Gemini API key state
    const [geminiKey, setGeminiKey] = useState("");
    const [geminiSaveStatus, setGeminiSaveStatus] = useState<SaveStatus>("idle");
    const [showGeminiKey, setShowGeminiKey] = useState(false);

    useEffect(() => {
        fetch("/api/settings")
            .then(r => r.json())
            .then(data => {
                setQdrantConfig(data.vectorDbConfigs?.qdrant || {});
                setGeminiKey(data.geminiApiKey || "");
            })
            .catch(() => {})
            .finally(() => setLoadingConfig(false));
    }, []);

    function update(partial: Partial<QdrantConfig>) {
        setQdrantConfig(prev => ({ ...prev, ...partial }));
        setTestStatus("idle");
        setTestMessage("");
    }

    async function handleTestConnection() {
        setTestStatus("loading");
        setTestMessage("");
        try {
            const res = await fetch("/api/settings/vector-test", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ provider: "qdrant", ...qdrantConfig }),
            });
            const data = await res.json();
            setTestStatus(data.success ? "success" : "error");
            setTestMessage(data.message || (data.success ? "Connected" : "Connection failed"));
        } catch {
            setTestStatus("error");
            setTestMessage("Network error — could not reach server");
        }
    }

    async function handleSave() {
        setSaveStatus("saving");
        try {
            const res = await fetch("/api/settings", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ vectorDbConfigs: { qdrant: qdrantConfig } }),
            });
            if (res.ok) {
                const data = await res.json();
                setSaveStatus("saved");
                setTimeout(() => setSaveStatus("idle"), 2500);
                if (data.qdrantInit && !data.qdrantInit.success) {
                    alert(`Settings saved, but Qdrant collection init failed:\n${data.qdrantInit.message}`);
                }
            } else {
                setSaveStatus("idle");
                const err = await res.json();
                alert(err.error || "Failed to save");
            }
        } catch {
            setSaveStatus("idle");
            alert("Failed to save settings");
        }
    }

    async function handleSaveGeminiKey() {
        setGeminiSaveStatus("saving");
        try {
            const res = await fetch("/api/settings", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ geminiApiKey: geminiKey }),
            });
            if (res.ok) {
                setGeminiSaveStatus("saved");
                setTimeout(() => setGeminiSaveStatus("idle"), 2500);
            } else {
                setGeminiSaveStatus("idle");
                const err = await res.json();
                alert(err.error || "Failed to save");
            }
        } catch {
            setGeminiSaveStatus("idle");
            alert("Failed to save Gemini API key");
        }
    }

    return (
        <div className="p-6 lg:p-8">
            <div className="mb-8">
                <h1 className="text-2xl lg:text-3xl font-bold text-white mb-1">Settings</h1>
                <p className="text-zinc-400 text-sm">Configure your Buildx instance preferences.</p>
            </div>

            <div className="space-y-6">
                <SystemHealth />

                {/* ─── Gemini API Key ───────────────────────────────────────── */}
                <div className="bg-zinc-900/50 backdrop-blur-xl rounded-2xl border border-zinc-800 overflow-hidden">
                    <div className="flex items-center gap-3 px-6 py-4 border-b border-zinc-800">
                        <div className="w-9 h-9 bg-zinc-800 rounded-lg flex items-center justify-center flex-shrink-0">
                            <Sparkles className="w-4 h-4 text-violet-400" />
                        </div>
                        <div>
                            <h2 className="text-sm font-semibold text-white">Gemini API Key</h2>
                            <p className="text-xs text-zinc-500">Used for chat responses and knowledge base embeddings</p>
                        </div>
                    </div>

                    <div className="p-6 space-y-4">
                        <div>
                            <label className="block text-xs font-medium text-zinc-400 mb-1.5">API Key</label>
                            <div className="relative">
                                <input
                                    type={showGeminiKey ? "text" : "password"}
                                    value={geminiKey}
                                    onChange={e => setGeminiKey(e.target.value)}
                                    placeholder="AIzaSy..."
                                    autoComplete="off"
                                    spellCheck={false}
                                    className="w-full px-3 py-2.5 pr-10 bg-zinc-950 border border-zinc-800 rounded-lg text-sm font-mono text-white placeholder-zinc-700 focus:ring-1 focus:ring-violet-500 focus:border-violet-500 focus:outline-none transition-all"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowGeminiKey(v => !v)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
                                >
                                    {showGeminiKey
                                        ? <EyeOff className="w-4 h-4" />
                                        : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                            <p className="text-xs text-zinc-600 mt-1.5">
                                Get a free key from{" "}
                                <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-violet-400 hover:underline">
                                    Google AI Studio
                                </a>
                                . Stored in your database, not in environment variables.
                            </p>
                        </div>

                        <div className="flex items-center justify-between pt-1 border-t border-zinc-800">
                            <div className="flex items-start gap-2">
                                <AlertCircle className="w-3.5 h-3.5 text-amber-500/70 mt-0.5 flex-shrink-0" />
                                <p className="text-xs text-zinc-500">
                                    Stored securely in your database. Never committed to source code or environment variables.
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={handleSaveGeminiKey}
                                disabled={geminiSaveStatus === "saving"}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all flex-shrink-0 ml-4 ${
                                    geminiSaveStatus === "saved"
                                        ? "bg-emerald-600 text-white"
                                        : "bg-violet-600 hover:bg-violet-500 text-white disabled:opacity-50"
                                }`}
                            >
                                {geminiSaveStatus === "saving" && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                                {geminiSaveStatus === "saved" && <CheckCircle2 className="w-3.5 h-3.5" />}
                                {geminiSaveStatus === "saved" ? "Saved!" : geminiSaveStatus === "saving" ? "Saving..." : "Save Key"}
                            </button>
                        </div>
                    </div>
                </div>

                {/* General Settings */}
                <div className="bg-zinc-900/50 backdrop-blur-xl rounded-2xl border border-zinc-800 p-6">
                    <div className="flex items-center gap-3 mb-5">
                        <div className="w-9 h-9 bg-zinc-800 rounded-lg flex items-center justify-center">
                            <Settings className="w-4 h-4 text-zinc-400" />
                        </div>
                        <div>
                            <h2 className="text-sm font-semibold text-white">General</h2>
                            <p className="text-xs text-zinc-500">Application-wide preferences.</p>
                        </div>
                    </div>
                    <div className="divide-y divide-zinc-800 border border-zinc-800 rounded-xl overflow-hidden">
                        {[
                            { label: "Dark Mode", desc: "Interface theme — always on", toggle: true, tag: null },
                            { label: "Analytics", desc: "Track usage and performance metrics", toggle: false, tag: "Coming Soon" },
                            { label: "Export Data", desc: "Download all bots and configuration as JSON", toggle: false, tag: "Coming Soon" },
                        ].map(item => (
                            <div key={item.label} className="flex items-center justify-between px-4 py-3 bg-zinc-900">
                                <div>
                                    <p className="text-sm font-medium text-white">{item.label}</p>
                                    <p className="text-xs text-zinc-500 mt-0.5">{item.desc}</p>
                                </div>
                                {item.toggle && (
                                    <div className="w-10 h-5 bg-violet-500 rounded-full relative cursor-not-allowed opacity-60 flex-shrink-0">
                                        <div className="w-3.5 h-3.5 bg-white rounded-full absolute top-0.5 right-0.5" />
                                    </div>
                                )}
                                {item.tag && (
                                    <span className="text-[11px] text-zinc-500 px-2 py-0.5 bg-zinc-800 rounded border border-zinc-700 flex-shrink-0">
                                        {item.tag}
                                    </span>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* ─── Qdrant Vector Database ──────────────────────────────── */}
                <div className="bg-zinc-900/50 backdrop-blur-xl rounded-2xl border border-zinc-800 overflow-hidden">
                    <div className="flex items-center gap-3 px-6 py-4 border-b border-zinc-800">
                        <div className="w-9 h-9 bg-zinc-800 rounded-lg flex items-center justify-center flex-shrink-0">
                            <Zap className="w-4 h-4 text-violet-400" />
                        </div>
                        <div>
                            <h2 className="text-sm font-semibold text-white">Qdrant Vector Database</h2>
                            <p className="text-xs text-zinc-500">Stores knowledge embeddings for RAG · shared across all bots</p>
                        </div>
                    </div>

                    {loadingConfig ? (
                        <div className="flex items-center gap-2 text-zinc-500 text-sm p-8">
                            <Loader2 className="w-4 h-4 animate-spin" /> Loading...
                        </div>
                    ) : (
                        <div className="p-6 space-y-4">
                            <Field label="Host URL" value={qdrantConfig.url || ""} onChange={v => update({ url: v })} placeholder="https://your-cluster.qdrant.io" />
                            <Field label="API Key" type="password" value={qdrantConfig.apiKey || ""} onChange={v => update({ apiKey: v })} placeholder="Leave blank for unauthenticated instances" />
                            <Field
                                label="Collection Name"
                                value={qdrantConfig.indexName || ""}
                                onChange={v => update({ indexName: v })}
                                placeholder="buildx-knowledge"
                                hint="Auto-created with 768-dim vectors and cosine distance when you save."
                            />

                            {/* Test + Save */}
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2 border-t border-zinc-800">
                                <div className="flex items-center gap-3">
                                    <button
                                        type="button"
                                        onClick={handleTestConnection}
                                        disabled={testStatus === "loading"}
                                        className="flex items-center gap-2 px-3.5 py-2 text-sm bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg border border-zinc-700 transition-colors disabled:opacity-50"
                                    >
                                        {testStatus === "loading" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Database className="w-3.5 h-3.5 text-zinc-400" />}
                                        {testStatus === "loading" ? "Testing..." : "Test Connection"}
                                    </button>
                                    {testStatus === "success" && <span className="flex items-center gap-1.5 text-sm text-emerald-400"><CheckCircle2 className="w-4 h-4" />{testMessage}</span>}
                                    {testStatus === "error" && <span className="flex items-center gap-1.5 text-sm text-red-400"><XCircle className="w-4 h-4" />{testMessage}</span>}
                                </div>

                                <button
                                    type="button"
                                    onClick={handleSave}
                                    disabled={saveStatus === "saving"}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all flex-shrink-0 ${
                                        saveStatus === "saved" ? "bg-emerald-600 text-white" : "bg-violet-600 hover:bg-violet-500 text-white disabled:opacity-50"
                                    }`}
                                >
                                    {saveStatus === "saving" && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                                    {saveStatus === "saved" && <CheckCircle2 className="w-3.5 h-3.5" />}
                                    {saveStatus === "saved" ? "Saved!" : saveStatus === "saving" ? "Saving..." : "Save Changes"}
                                </button>
                            </div>

                            <div className="flex items-start gap-2">
                                <AlertCircle className="w-3.5 h-3.5 text-amber-500/70 mt-0.5 flex-shrink-0" />
                                <p className="text-xs text-zinc-500">
                                    API key encrypted with AES-256-GCM before being stored in the database.
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

/* ── Shared field ───────────────────────────────────────────────── */
function Field({
    label,
    value,
    onChange,
    placeholder,
    type = "text",
    hint,
}: {
    label: string;
    value: string;
    onChange: (v: string) => void;
    placeholder?: string;
    type?: string;
    hint?: string;
}) {
    return (
        <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">{label}</label>
            <input
                type={type}
                value={value}
                onChange={e => onChange(e.target.value)}
                placeholder={placeholder}
                autoComplete="off"
                spellCheck={false}
                className="w-full px-3 py-2.5 bg-zinc-950 border border-zinc-800 rounded-lg text-sm font-mono text-white placeholder-zinc-700 focus:ring-1 focus:ring-violet-500 focus:border-violet-500 focus:outline-none transition-all"
            />
            {hint && <p className="text-xs text-zinc-600 mt-1.5">{hint}</p>}
        </div>
    );
}
