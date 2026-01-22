import { auth } from "@/auth";
import Link from "next/link";
import { Plus, Bot, Zap, FileText, Database } from "lucide-react";
import dbConnect from "@/lib/db";
import { Bot as BotModel, KnowledgeBase, KnowledgeChunk } from "@/models";

export default async function DashboardPage() {
    const session = await auth();
    await dbConnect();

    // Fetch dynamic stats
    const listStats = await Promise.all([
        BotModel.countDocuments(),
        KnowledgeBase.countDocuments(),
        KnowledgeChunk.countDocuments(),
    ]);

    const [botCount, fileCount, chunkCount] = listStats;

    const stats = [
        { name: "Total Bots", value: botCount.toString(), icon: Bot, color: "violet" },
        { name: "Knowledge Files", value: fileCount.toString(), icon: FileText, color: "emerald" },
        { name: "Indexed Chunks", value: chunkCount.toString(), icon: Database, color: "amber" },
    ];

    return (
        <div className="p-6 lg:p-8">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-2xl lg:text-3xl font-bold text-white mb-2">
                    Welcome back, {session?.user?.name || "Admin"}! 👋
                </h1>
                <p className="text-zinc-400">
                    Manage your AI bots from this dashboard.
                </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                {stats.map((stat) => (
                    <div
                        key={stat.name}
                        className="bg-zinc-900/50 backdrop-blur-xl rounded-2xl border border-zinc-800 p-6"
                    >
                        <div className="flex items-center gap-4">
                            <div
                                className={`w-12 h-12 rounded-xl flex items-center justify-center ${stat.color === "violet"
                                    ? "bg-violet-500/10 text-violet-400"
                                    : stat.color === "emerald"
                                        ? "bg-emerald-500/10 text-emerald-400"
                                        : "bg-amber-500/10 text-amber-400"
                                    }`}
                            >
                                <stat.icon className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-white">{stat.value}</p>
                                <p className="text-sm text-zinc-500">{stat.name}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Quick Actions */}
            <div className="mb-8">
                <h2 className="text-lg font-semibold text-white mb-4">Quick Actions</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <Link
                        href="/dashboard/bots/new"
                        className="group bg-gradient-to-br from-violet-500/10 to-purple-500/10 hover:from-violet-500/20 hover:to-purple-500/20 rounded-2xl border border-violet-500/20 p-6 transition-all duration-300"
                    >
                        <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg shadow-violet-500/20">
                            <Plus className="w-6 h-6 text-white" />
                        </div>
                        <h3 className="text-lg font-semibold text-white mb-2">
                            Create New Bot
                        </h3>
                        <p className="text-zinc-400 text-sm">
                            Set up a new AI chatbot with custom prompts and behavior.
                        </p>
                    </Link>

                    <Link
                        href="/dashboard/bots"
                        className="group bg-zinc-900/50 hover:bg-zinc-800/50 rounded-2xl border border-zinc-800 hover:border-zinc-700 p-6 transition-all duration-300"
                    >
                        <div className="w-12 h-12 bg-zinc-800 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                            <Bot className="w-6 h-6 text-zinc-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-white mb-2">
                            Manage Bots
                        </h3>
                        <p className="text-zinc-400 text-sm">
                            View, edit, and configure your existing chatbots.
                        </p>
                    </Link>

                    <Link
                        href="/dashboard/api-keys"
                        className="group bg-zinc-900/50 hover:bg-zinc-800/50 rounded-2xl border border-zinc-800 hover:border-zinc-700 p-6 transition-all duration-300"
                    >
                        <div className="w-12 h-12 bg-zinc-800 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                            <Zap className="w-6 h-6 text-zinc-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-white mb-2">
                            API Keys
                        </h3>
                        <p className="text-zinc-400 text-sm">
                            Manage your OpenAI and other API integrations.
                        </p>
                    </Link>
                </div>
            </div>

            {/* Empty State */}
            {botCount === 0 && (
                <div className="bg-zinc-900/50 backdrop-blur-xl rounded-2xl border border-zinc-800 p-12 text-center">
                    <div className="w-20 h-20 bg-zinc-800 rounded-full mx-auto mb-6 flex items-center justify-center">
                        <Bot className="w-10 h-10 text-zinc-600" />
                    </div>
                    <h3 className="text-xl font-semibold text-white mb-2">No bots yet</h3>
                    <p className="text-zinc-400 mb-6 max-w-md mx-auto">
                        Create your first AI chatbot to get started. You can customize its
                        personality, appearance, and connect it to a knowledge base.
                    </p>
                    <Link
                        href="/dashboard/bots/new"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white font-semibold rounded-xl shadow-lg shadow-violet-500/25 transition-all duration-200"
                    >
                        <Plus className="w-5 h-5" />
                        Create Your First Bot
                    </Link>
                </div>
            )}
        </div>
    );
}
