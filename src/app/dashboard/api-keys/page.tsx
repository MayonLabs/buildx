import { Key } from "lucide-react";

export default function ApiKeysPage() {
    return (
        <div className="p-6 lg:p-8">
            <div className="mb-8">
                <h1 className="text-2xl lg:text-3xl font-bold text-white mb-2">
                    API Keys
                </h1>
                <p className="text-zinc-400">
                    Manage your API keys and integrations.
                </p>
            </div>

            <div className="bg-zinc-900/50 backdrop-blur-xl rounded-2xl border border-zinc-800 p-8">
                <div className="flex items-start gap-4 mb-6">
                    <div className="w-12 h-12 bg-amber-500/10 rounded-xl flex items-center justify-center">
                        <Key className="w-6 h-6 text-amber-400" />
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold text-white mb-1">
                            Gemini API Key
                        </h2>
                        <p className="text-sm text-zinc-400">
                            Required for chat functionality. Set via environment variable.
                        </p>
                    </div>
                </div>

                <div className="bg-zinc-900 rounded-xl p-4 border border-zinc-800">
                    <p className="text-sm text-zinc-500 mb-2">Environment Variable</p>
                    <code className="text-sm text-violet-400 font-mono">
                        GEMINI_API_KEY=your-api-key
                    </code>
                </div>

                <p className="text-xs text-zinc-500 mt-4">
                    Get your API key from{" "}
                    <a
                        href="https://aistudio.google.com/app/apikey"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-violet-400 hover:underline"
                    >
                        Google AI Studio
                    </a>
                    . For security, API keys are managed through environment variables.
                </p>
            </div>
        </div>
    );
}
