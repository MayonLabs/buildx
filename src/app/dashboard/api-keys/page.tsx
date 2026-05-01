"use client";

import { Globe, Copy, Check, AlertTriangle } from "lucide-react";
import { useState } from "react";

export default function ApiKeysPage() {
    const [origin] = useState(() =>
        typeof window !== "undefined" ? window.location.origin : "https://your-domain.com"
    );
    const [copied, setCopied] = useState(false);
    const [activeTab, setActiveTab] = useState<"curl" | "js" | "python">("curl");

    const getCodeSnippet = () => {
        switch (activeTab) {
            case "js":
                return `const response = await fetch("${origin}/api/chat", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    botId: "YOUR_BOT_PUBLIC_ID",
    message: "Hello world",
    history: [] // Optional
  })
});

const data = await response.json();
console.log(data.message);`;
            case "python":
                return `import requests

url = "${origin}/api/chat"
payload = {
    "botId": "YOUR_BOT_PUBLIC_ID",
    "message": "Hello world"
}
headers = {"Content-Type": "application/json"}

response = requests.post(url, json=payload, headers=headers)
print(response.json()["message"])`;
            case "curl":
            default:
                return `curl -X POST ${origin}/api/chat \\
  -H "Content-Type: application/json" \\
  -d '{
    "botId": "YOUR_BOT_PUBLIC_ID",
    "message": "Hello world"
  }'`;
        }
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(getCodeSnippet());
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="p-6 lg:p-8">
            <div className="mb-8">
                <h1 className="text-2xl lg:text-3xl font-bold text-white mb-2">
                    API Keys
                </h1>
                <p className="text-zinc-400">
                    Manage your API integration details.
                </p>
            </div>

            {/* Public API Reference */}
            <div className="bg-zinc-900/50 backdrop-blur-xl rounded-2xl border border-zinc-800 p-8">
                <div className="flex items-start gap-4 mb-6">
                    <div className="w-12 h-12 bg-violet-500/10 rounded-xl flex items-center justify-center">
                        <Globe className="w-6 h-6 text-violet-400" />
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold text-white mb-1">
                            Public Chat API
                        </h2>
                        <p className="text-sm text-zinc-400">
                            Programmatically interact with your bots via HTTP requests.
                        </p>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden">
                        {/* Tabs Header */}
                        <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800 bg-zinc-950/50">
                            <div className="flex items-center gap-2">
                                <span className="px-2 py-1 rounded bg-green-500/10 text-green-400 text-xs font-mono font-medium border border-green-500/20">POST</span>
                                <code className="text-sm text-zinc-300 font-mono">/api/chat</code>
                            </div>
                            {/* Language Tabs */}
                            <div className="flex items-center gap-1 bg-zinc-900 p-1 rounded-lg border border-zinc-800">
                                <button
                                    onClick={() => setActiveTab("curl")}
                                    className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${activeTab === "curl" ? "bg-zinc-800 text-white shadow-sm" : "text-zinc-500 hover:text-zinc-300"}`}
                                >
                                    cURL
                                </button>
                                <button
                                    onClick={() => setActiveTab("js")}
                                    className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${activeTab === "js" ? "bg-zinc-800 text-white shadow-sm" : "text-zinc-500 hover:text-zinc-300"}`}
                                >
                                    Node.js
                                </button>
                                <button
                                    onClick={() => setActiveTab("python")}
                                    className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${activeTab === "python" ? "bg-zinc-800 text-white shadow-sm" : "text-zinc-500 hover:text-zinc-300"}`}
                                >
                                    Python
                                </button>
                            </div>
                        </div>

                        <div className="p-4">
                            <p className="text-sm text-zinc-400 mb-4">
                                Sends a message to a specific bot and retrieves the AI response, including RAG context if available.
                            </p>

                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                <div className="lg:col-span-2 space-y-4">
                                    <div className="bg-zinc-950 rounded-lg p-4 font-mono text-xs text-zinc-300 relative group border border-zinc-800">
                                        <button
                                            onClick={handleCopy}
                                            className="absolute top-2 right-2 p-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-white transition-opacity opacity-0 group-hover:opacity-100"
                                            title="Copy to clipboard"
                                        >
                                            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                                        </button>
                                        <pre className="overflow-x-auto whitespace-pre-wrap break-all pr-12 font-mono text-zinc-300">
                                            {getCodeSnippet()}
                                        </pre>
                                    </div>

                                    <div className="flex items-start gap-2 p-3 bg-amber-500/5 rounded-lg border border-amber-500/10">
                                        <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                                        <p className="text-xs text-amber-500/90 leading-relaxed">
                                            <span className="font-semibold">Important:</span> If you have configured &quot;Allowed Domains&quot; for your bot, direct API calls (like curl) will utilize server-side checks and may be blocked without a valid Origin header. Leave &quot;Allowed Domains&quot; empty to allow access from anywhere.
                                        </p>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <h4 className="text-xs font-semibold text-white uppercase tracking-wider mb-2">Body Parameters</h4>
                                        <div className="space-y-2">
                                            <div className="p-2 rounded bg-zinc-800/50 border border-zinc-800">
                                                <div className="flex justify-between items-center mb-1">
                                                    <code className="text-xs text-blue-400 font-mono">botId</code>
                                                    <span className="text-[10px] text-red-400 border border-red-500/20 px-1.5 rounded uppercase">Required</span>
                                                </div>
                                                <p className="text-[11px] text-zinc-500">The public ID or internal ID of your bot.</p>
                                            </div>
                                            <div className="p-2 rounded bg-zinc-800/50 border border-zinc-800">
                                                <div className="flex justify-between items-center mb-1">
                                                    <code className="text-xs text-blue-400 font-mono">message</code>
                                                    <span className="text-[10px] text-red-400 border border-red-500/20 px-1.5 rounded uppercase">Required</span>
                                                </div>
                                                <p className="text-[11px] text-zinc-500">The user&apos;s input text.</p>
                                            </div>
                                            <div className="p-2 rounded bg-zinc-800/50 border border-zinc-800">
                                                <div className="flex justify-between items-center mb-1">
                                                    <code className="text-xs text-blue-400 font-mono">history</code>
                                                    <span className="text-[10px] text-zinc-500 border border-zinc-700 px-1.5 rounded uppercase">Optional</span>
                                                </div>
                                                <p className="text-[11px] text-zinc-500">Array of previous messages for context.</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
