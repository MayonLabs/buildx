import { BookOpen, Key, Database, Cpu, Code2, ShieldAlert } from "lucide-react";

export default function DocsPage() {
    return (
        <div className="p-6 lg:p-8 max-w-5xl mx-auto">
            <div className="mb-10">
                <h1 className="text-3xl font-bold text-white mb-3">Documentation</h1>
                <p className="text-zinc-400 text-lg">
                    Comprehensive guide to configuring, building, and deploying your AI bots.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Sidebar / Table of Contents equivalent */}
                <div className="hidden lg:block space-y-4">
                    <div className="sticky top-8">
                        <h3 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider mb-4">
                            Contents
                        </h3>
                        <nav className="flex flex-col gap-2">
                            <a href="#environment" className="text-zinc-400 hover:text-white transition-colors">Environment Setup</a>
                            <a href="#bots" className="text-zinc-400 hover:text-white transition-colors">Creating Bots</a>
                            <a href="#rag" className="text-zinc-400 hover:text-white transition-colors">Knowledge Base (RAG)</a>
                            <a href="#integration" className="text-zinc-400 hover:text-white transition-colors">Integration & Embeds</a>
                        </nav>
                    </div>
                </div>

                {/* Main Content */}
                <div className="lg:col-span-2 space-y-12">

                    {/* Section 1: Environment */}
                    <section id="environment" className="scroll-mt-24">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-amber-500/10 rounded-lg">
                                <Key className="w-5 h-5 text-amber-500" />
                            </div>
                            <h2 className="text-2xl font-semibold text-white">Environment Configuration</h2>
                        </div>
                        <div className="prose prose-invert max-w-none text-zinc-400">
                            <p>
                                Ensure your application is correctly configured via environment variables. These settings control authentication, database connectivity, and AI model access.
                            </p>
                            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 mt-4 overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="text-xs text-zinc-500 uppercase bg-zinc-900/50">
                                        <tr>
                                            <th className="px-4 py-2 rounded-l-lg">Variable</th>
                                            <th className="px-4 py-2 rounded-r-lg">Description</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-zinc-800">
                                        <tr>
                                            <td className="px-4 py-3 font-mono text-violet-400">ADMIN_EMAIL</td>
                                            <td className="px-4 py-3">Login email for the dashboard.</td>
                                        </tr>
                                        <tr>
                                            <td className="px-4 py-3 font-mono text-violet-400">GEMINI_API_KEY</td>
                                            <td className="px-4 py-3">Google AI Studio API Key.</td>
                                        </tr>
                                        <tr>
                                            <td className="px-4 py-3 font-mono text-violet-400">MONGODB_URI</td>
                                            <td className="px-4 py-3">MongoDB Atlas connection string.</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </section>

                    {/* Section 2: Creating Bots */}
                    <section id="bots" className="scroll-mt-24">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-blue-500/10 rounded-lg">
                                <Cpu className="w-5 h-5 text-blue-500" />
                            </div>
                            <h2 className="text-2xl font-semibold text-white">Bot Configuration</h2>
                        </div>
                        <div className="prose prose-invert max-w-none text-zinc-400 space-y-4">
                            <p>
                                The <strong>System Prompt</strong> is the most critical setting. It defines your bot's personality, constraints, and knowledge scope.
                            </p>
                            <div className="bg-zinc-900 p-4 rounded-xl border-l-4 border-blue-500">
                                <h4 className="text-white font-medium mb-1">💡 Pro Tip: Be Specific</h4>
                                <p className="text-sm">
                                    Instead of "You are a helpful assistant", try: <br />
                                    <em>"You are a Customer Support Agent for Acme Corp. You only answer questions about our products. Be polite, concise, and use emojis."</em>
                                </p>
                            </div>
                        </div>
                    </section>

                    {/* Section 3: RAG */}
                    <section id="rag" className="scroll-mt-24">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-emerald-500/10 rounded-lg">
                                <Database className="w-5 h-5 text-emerald-500" />
                            </div>
                            <h2 className="text-2xl font-semibold text-white">Knowledge Base (RAG)</h2>
                        </div>
                        <div className="prose prose-invert max-w-none text-zinc-400 space-y-4">
                            <p>
                                Retrieval-Augmented Generation (RAG) allows your bot to "learn" from your documents.
                            </p>
                            <ol className="list-decimal list-inside space-y-2 marker:text-emerald-500">
                                <li><strong>Upload:</strong> Supported formats are <code className="bg-zinc-800 px-1 py-0.5 rounded text-zinc-300">.pdf</code>, <code className="bg-zinc-800 px-1 py-0.5 rounded text-zinc-300">.docx</code>, and <code className="bg-zinc-800 px-1 py-0.5 rounded text-zinc-300">.txt</code>.</li>
                                <li><strong>Processing:</strong> Files are automatically split into small text "chunks".</li>
                                <li><strong>Indexing:</strong> Indexing happens automatically when you create your bot.</li>
                            </ol>

                        </div>
                    </section>

                    {/* Section 4: Integration */}
                    <section id="integration" className="scroll-mt-24">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-violet-500/10 rounded-lg">
                                <Code2 className="w-5 h-5 text-violet-500" />
                            </div>
                            <h2 className="text-2xl font-semibold text-white">Embed & Integration</h2>
                        </div>
                        <div className="prose prose-invert max-w-none text-zinc-400 space-y-4">
                            <p>
                                To add the chat widget to your website, copy the snippet from the <strong>Embed</strong> tab.
                            </p>

                            <h3 className="text-lg font-medium text-white">Security: Allowed Domains</h3>
                            <p>
                                By default, your bot can be embedded anywhere. To restrict usage, add your website's domain (e.g., <code>example.com</code>) to the <strong>Allowed Domains</strong> list in the Embed tab.
                            </p>

                            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
                                <pre className="text-xs text-zinc-300 overflow-x-auto">
                                    <code>{`<script 
  src="https://your-domain.com/embed.js" 
  data-bot-id="..."
  data-position="bottom-right"
  data-color="#8b5cf6">
</script>`}</code>
                                </pre>
                            </div>
                        </div>
                    </section>

                </div>
            </div>
        </div>
    );
}
