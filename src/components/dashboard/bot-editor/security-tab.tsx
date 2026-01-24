"use client";

import { Globe, Trash2, Layout } from "lucide-react";

interface SecurityTabProps {
    bot: any;
    newDomain: string;
    setNewDomain: (domain: string) => void;
    addDomain: () => void;
    removeDomain: (domain: string) => void;
}

export function SecurityTab({ bot, newDomain, setNewDomain, addDomain, removeDomain }: SecurityTabProps) {
    return (
        <div className="space-y-6 max-w-2xl">
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
                <h3 className="text-lg font-medium text-white mb-2 flex items-center gap-2">
                    <Globe className="w-5 h-5 text-zinc-400" />
                    Allowed Domains
                </h3>
                <p className="text-sm text-zinc-400 mb-6">
                    Restrict where your bot can be embedded. Leave empty to allow all domains (development mode).
                </p>

                <div className="flex gap-2 mb-4">
                    <input
                        type="text"
                        value={newDomain}
                        onChange={(e) => setNewDomain(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addDomain())}
                        placeholder="example.com"
                        className="flex-1 px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-sm text-white focus:ring-1 focus:ring-violet-500"
                    />
                    <button
                        type="button"
                        onClick={addDomain}
                        className="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-lg text-sm"
                    >
                        Add Domain
                    </button>
                </div>

                {bot.allowedDomains.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                        {bot.allowedDomains.map((domain: string) => (
                            <div key={domain} className="flex items-center gap-2 px-3 py-1.5 bg-zinc-800 rounded-lg border border-zinc-700">
                                <span className="text-sm text-white">{domain}</span>
                                <button
                                    type="button"
                                    onClick={() => removeDomain(domain)}
                                    className="text-zinc-500 hover:text-red-400"
                                >
                                    <Trash2 className="w-3 h-3" />
                                </button>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                        <p className="text-xs text-yellow-500 flex items-center gap-2">
                            <Layout className="w-3 h-3" />
                            Warning: Your bot is currently accessible from any website.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
