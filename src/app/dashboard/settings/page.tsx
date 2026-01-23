"use client";


import { Settings, Database, Loader2, AlertCircle } from "lucide-react";
import { useState } from "react";

export default function SettingsPage() {
    const [loadingIndex, setLoadingIndex] = useState(false);

    async function handleInitializeIndex() {
        if (!confirm("This will attempt to create the vector index in MongoDB Atlas. Continue?")) return;

        setLoadingIndex(true);
        try {
            const res = await fetch("/api/admin/setup-index", { method: "POST" });
            const data = await res.json();

            if (res.ok) {
                alert(data.message || "Index initialized successfully");
            } else {
                alert(data.error || "Failed to initialize index");
            }
        } catch (error) {
            console.error(error);
            alert("An error occurred");
        } finally {
            setLoadingIndex(false);
        }
    }

    return (
        <div className="p-6 lg:p-8">
            <div className="mb-8">
                <h1 className="text-2xl lg:text-3xl font-bold text-white mb-2">
                    Settings
                </h1>
                <p className="text-zinc-400">
                    Configure your Botx preferences.
                </p>
            </div>

            <div className="space-y-6">

                {/* General Settings */}
                <div className="bg-zinc-900/50 backdrop-blur-xl rounded-2xl border border-zinc-800 p-6">
                    <div className="flex items-start gap-4 mb-6">
                        <div className="w-12 h-12 bg-violet-500/10 rounded-xl flex items-center justify-center">
                            <Settings className="w-6 h-6 text-violet-400" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-white mb-1">
                                General Settings
                            </h2>
                            <p className="text-sm text-zinc-400">
                                Manage your account and application settings.
                            </p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-zinc-900 rounded-xl border border-zinc-800">
                            <div>
                                <p className="font-medium text-white">Dark Mode</p>
                                <p className="text-xs text-zinc-500">
                                    Use dark theme (always on)
                                </p>
                            </div>
                            <div className="w-12 h-6 bg-violet-500 rounded-full cursor-not-allowed opacity-80">
                                <div className="w-5 h-5 bg-white rounded-full translate-x-6" />
                            </div>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-zinc-900 rounded-xl border border-zinc-800">
                            <div>
                                <p className="font-medium text-white">Analytics</p>
                                <p className="text-xs text-zinc-500">
                                    Track chat usage and metrics
                                </p>
                            </div>
                            <span className="text-xs text-zinc-500 px-2 py-1 bg-zinc-800 rounded">
                                Coming Soon
                            </span>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-zinc-900 rounded-xl border border-zinc-800">
                            <div>
                                <p className="font-medium text-white">Export Data</p>
                                <p className="text-xs text-zinc-500">
                                    Download all your bots and settings
                                </p>
                            </div>
                            <span className="text-xs text-zinc-500 px-2 py-1 bg-zinc-800 rounded">
                                Coming Soon
                            </span>
                        </div>
                    </div>
                </div>

                {/* Vector Database Settings */}
                <div className="bg-zinc-900/50 backdrop-blur-xl rounded-2xl border border-zinc-800 p-6">
                    <div className="flex items-start gap-4 mb-6">
                        <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center">
                            <Database className="w-6 h-6 text-emerald-400" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-white mb-1">
                                Vector Database
                            </h2>
                            <p className="text-sm text-zinc-400">
                                Manage your MongoDB Atlas vector search index.
                            </p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="p-4 bg-zinc-900 rounded-xl border border-zinc-800">
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <p className="font-medium text-white">Manual Initialization</p>
                                    <p className="text-xs text-zinc-500">
                                        Manually trigger the creation of the vector search index.
                                    </p>
                                </div>
                                <button
                                    onClick={handleInitializeIndex}
                                    disabled={loadingIndex}
                                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {loadingIndex ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Initializing...
                                        </>
                                    ) : (
                                        "Initialize Index"
                                    )}
                                </button>
                            </div>
                            <div className="flex items-start gap-2 p-3 bg-zinc-950/50 rounded-lg border border-zinc-800">
                                <AlertCircle className="w-4 h-4 text-zinc-400 mt-0.5 flex-shrink-0" />
                                <p className="text-xs text-zinc-400 leading-relaxed">
                                    <span className="font-semibold text-zinc-300">Note:</span> Standard initialization runs automatically when creating a bot. This button is only for manual troubleshooting if you encounter search errors.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

