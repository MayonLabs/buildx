"use client";

import { Settings } from "lucide-react";

export default function SettingsPage() {
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
            </div>
        </div>
    );
}

