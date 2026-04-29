import Link from "next/link";
import { ArrowLeft, Key, Server, Database, Rocket, ShieldCheck, Terminal } from "lucide-react";

export default function SetupPage() {
    return (
        <div className="min-h-screen bg-zinc-950 text-zinc-200 font-sans">
            <div className="max-w-6xl mx-auto p-6 lg:p-12">

                {/* Header */}
                <div className="mb-12 border-b border-zinc-900 pb-8">
                    <Link
                        href="/login"
                        className="inline-flex items-center gap-2 text-zinc-500 hover:text-white mb-6 transition-colors group"
                    >
                        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                        Back to Login
                    </Link>
                    <h1 className="text-4xl font-bold text-white mb-3 tracking-tight">
                        Setup Guide
                    </h1>
                    <p className="text-xl text-zinc-400 max-w-2xl">
                        Complete instructions to configure your environment and launch your first AI bot.
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
                    {/* Left Sidebar / Table of Contents */}
                    <div className="lg:col-span-1 space-y-8">
                        <div className="sticky top-12">
                            <h3 className="text-xs font-bold text-zinc-600 uppercase tracking-widest mb-6">
                                Quick Navigation
                            </h3>
                            <nav className="flex flex-col gap-3">
                                <a href="#environment" className="flex items-center gap-3 text-zinc-400 hover:text-white transition-colors p-2 hover:bg-zinc-900 rounded-lg group">
                                    <Server className="w-4 h-4 text-zinc-600 group-hover:text-violet-400" />
                                    Environment
                                </a>
                                <a href="#resources" className="flex items-center gap-3 text-zinc-400 hover:text-white transition-colors p-2 hover:bg-zinc-900 rounded-lg group">
                                    <Key className="w-4 h-4 text-zinc-600 group-hover:text-amber-400" />
                                    API Keys
                                </a>
                                <a href="#quickstart" className="flex items-center gap-3 text-zinc-400 hover:text-white transition-colors p-2 hover:bg-zinc-900 rounded-lg group">
                                    <Rocket className="w-4 h-4 text-zinc-600 group-hover:text-emerald-400" />
                                    Quick Start
                                </a>
                            </nav>

                            <div className="mt-8 p-4 bg-zinc-900/50 rounded-xl border border-zinc-800">
                                <h4 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
                                    <Terminal className="w-4 h-4 text-violet-400" />
                                    Self-Hosted
                                </h4>
                                <p className="text-xs text-zinc-500">
                                    You have full control over your data and infrastructure. No hidden fees.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Main Content */}
                    <div className="lg:col-span-3 space-y-16">

                        {/* Section 1: Environment */}
                        <section id="environment" className="scroll-mt-24">
                            <div className="flex items-center gap-4 mb-6">
                                <div className="p-3 bg-violet-500/10 rounded-xl">
                                    <Server className="w-6 h-6 text-violet-500" />
                                </div>
                                <h2 className="text-2xl font-bold text-white">1. Environment Configuration</h2>
                            </div>

                            <div className="prose prose-invert max-w-none text-zinc-400 space-y-6">
                                <p>
                                    Create a <code className="bg-zinc-900 border border-zinc-800 px-1.5 py-0.5 rounded text-violet-300">.env</code> in your project, OR set these in your hosting provider's <strong>Settings</strong> (e.g., Vercel).
                                    These variables are required for the app to function.
                                </p>

                                <div className="bg-zinc-950 rounded-xl overflow-hidden border border-zinc-800 shadow-xl">
                                    <div className="flex items-center justify-between px-4 py-3 bg-zinc-900 border-b border-zinc-800">
                                        <div className="flex gap-1.5">
                                            <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/50" />
                                            <div className="w-3 h-3 rounded-full bg-amber-500/20 border border-amber-500/50" />
                                            <div className="w-3 h-3 rounded-full bg-emerald-500/20 border border-emerald-500/50" />
                                        </div>
                                        <div className="text-xs text-zinc-500 font-mono">Environment Variables</div>
                                    </div>
                                    <div className="p-6 overflow-x-auto">
                                        <table className="w-full text-sm text-left">
                                            <thead className="text-xs text-zinc-500 uppercase border-b border-zinc-800">
                                                <tr>
                                                    <th className="px-4 py-3 font-medium">Variable</th>
                                                    <th className="px-4 py-3 font-medium">Description</th>
                                                    <th className="px-4 py-3 font-medium text-right">Required</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-zinc-900">
                                                <EnvRow name="ADMIN_EMAIL" desc="Your login email" />
                                                <EnvRow name="ADMIN_PASSWORD" desc="Your login password" />
                                                <EnvRow name="AUTH_SECRET" desc="Session encryption key (openssl rand -base64 32)" />
                                                <EnvRow name="MONGODB_URI" desc="MongoDB connection string" />

                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* Section 2: Resources */}
                        <section id="resources" className="scroll-mt-24">
                            <div className="flex items-center gap-4 mb-6">
                                <div className="p-3 bg-amber-500/10 rounded-xl">
                                    <Key className="w-6 h-6 text-amber-500" />
                                </div>
                                <h2 className="text-2xl font-bold text-white">2. Get Your Keys</h2>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <a
                                    href="https://aistudio.google.com/app/apikey"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="group p-6 bg-zinc-900/30 hover:bg-zinc-900 border border-zinc-800 hover:border-violet-500/50 rounded-2xl transition-all duration-300"
                                >
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="p-2 bg-gradient-to-br from-violet-500/20 to-purple-500/20 rounded-lg group-hover:scale-110 transition-transform">
                                            <Key className="w-5 h-5 text-violet-400" />
                                        </div>
                                        <h3 className="font-semibold text-white">Gemini API Key</h3>
                                    </div>
                                    <p className="text-sm text-zinc-400 mb-4">
                                        Required for the AI chat engine.
                                    </p>
                                    <span className="text-xs text-violet-400 font-medium group-hover:underline">Internal Link &rarr;</span>
                                </a>

                                <a
                                    href="https://www.mongodb.com/cloud/atlas/register"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="group p-6 bg-zinc-900/30 hover:bg-zinc-900 border border-zinc-800 hover:border-emerald-500/50 rounded-2xl transition-all duration-300"
                                >
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="p-2 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 rounded-lg group-hover:scale-110 transition-transform">
                                            <Database className="w-5 h-5 text-emerald-400" />
                                        </div>
                                        <h3 className="font-semibold text-white">MongoDB Atlas</h3>
                                    </div>
                                    <p className="text-sm text-zinc-400 mb-4">
                                        Free tier database to store bots & knowledge.
                                    </p>
                                    <span className="text-xs text-emerald-400 font-medium group-hover:underline">Internal Link &rarr;</span>
                                </a>
                            </div>
                        </section>

                        {/* Section 3: Quick Start */}
                        <section id="quickstart" className="scroll-mt-24">
                            <div className="flex items-center gap-4 mb-6">
                                <div className="p-3 bg-emerald-500/10 rounded-xl">
                                    <Rocket className="w-6 h-6 text-emerald-500" />
                                </div>
                                <h2 className="text-2xl font-bold text-white">3. Quick Start Guide</h2>
                            </div>

                            <div className="space-y-6">
                                <Step number="01" title="Log In" desc="Use the email and password you defined in your Environment Variables to access the dashboard." />
                                <Step number="02" title="Create a Bot" desc="Click 'Create New Bot'. Give it a name and a system prompt (personality)." />
                                <Step number="03" title="Knowledge Base" desc="Upload PDF/DOCX files. The search index is automatically created for you." />
                                <Step number="04" title="Embed" desc="Copy the script tag from the 'Embed' tab and paste it into your website." />
                            </div>
                        </section>

                    </div>
                </div>
            </div>
        </div>
    );
}

function EnvRow({ name, desc }: { name: string; desc: string }) {
    return (
        <tr className="hover:bg-white/5 transition-colors">
            <td className="px-4 py-4 font-mono text-violet-300">{name}</td>
            <td className="px-4 py-4 text-zinc-400">{desc}</td>
            <td className="px-4 py-4 text-right">
                <span className="inline-flex items-center px-2 py-1 rounded bg-red-500/10 text-red-400 text-xs font-medium border border-red-500/20">
                    Required
                </span>
            </td>
        </tr>
    );
}

function Step({ number, title, desc }: { number: string; title: string; desc: string }) {
    return (
        <div className="flex gap-6 p-4 rounded-xl hover:bg-zinc-900/50 transition-colors border border-transparent hover:border-zinc-800">
            <div className="text-4xl font-black text-zinc-800 select-none font-mono">
                {number}
            </div>
            <div>
                <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
                <p className="text-zinc-400 leading-relaxed text-sm">
                    {desc}
                </p>
            </div>
        </div>
    );
}
