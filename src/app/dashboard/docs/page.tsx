"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
    Rocket,
    Settings as SettingsIcon,
    Bot,
    Brain,
    Palette,
    Sparkles,
    Code2,
    Plug,
    LifeBuoy,
    Copy,
    Check,
    ExternalLink,
} from "lucide-react";

interface Section {
    id: string;
    label: string;
    icon: typeof Bot;
}

interface SectionGroup {
    group: string;
    items: Section[];
}

const SECTIONS: SectionGroup[] = [
    {
        group: "Setup",
        items: [
            { id: "quickstart", label: "Quick start", icon: Rocket },
            { id: "settings", label: "Settings", icon: SettingsIcon },
        ],
    },
    {
        group: "Build",
        items: [
            { id: "bots", label: "Bots", icon: Bot },
            { id: "knowledge", label: "Knowledge base", icon: Brain },
        ],
    },
    {
        group: "Customize",
        items: [
            { id: "design", label: "Design studio", icon: Palette },
            { id: "leads", label: "Lead capture", icon: Sparkles },
        ],
    },
    {
        group: "Deploy",
        items: [
            { id: "embed", label: "Embedding", icon: Plug },
            { id: "api", label: "API reference", icon: Code2 },
        ],
    },
    {
        group: "Help",
        items: [{ id: "troubleshooting", label: "Troubleshooting", icon: LifeBuoy }],
    },
];

const ALL_IDS = SECTIONS.flatMap(g => g.items.map(s => s.id));

function CodeBlock({ children }: { children: string }) {
    const [copied, setCopied] = useState(false);
    return (
        <div className="relative group bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden my-3">
            <button
                onClick={() => {
                    navigator.clipboard.writeText(children);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 1500);
                }}
                className="absolute top-2 right-2 p-1.5 bg-zinc-900/90 text-zinc-400 hover:text-white border border-zinc-800 rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
                title="Copy"
            >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
            <pre className="p-4 text-xs leading-relaxed text-zinc-300 overflow-x-auto font-mono">
                <code>{children}</code>
            </pre>
        </div>
    );
}

function Callout({
    tone = "info",
    title,
    children,
}: {
    tone?: "info" | "tip" | "warn";
    title?: string;
    children: React.ReactNode;
}) {
    const styles =
        tone === "warn"
            ? "border-amber-500/30 bg-amber-500/5 text-amber-200"
            : tone === "tip"
                ? "border-emerald-500/30 bg-emerald-500/5 text-emerald-200"
                : "border-violet-500/30 bg-violet-500/5 text-violet-200";
    return (
        <div className={`border rounded-xl px-4 py-3 my-3 text-sm ${styles}`}>
            {title && <p className="font-semibold mb-1">{title}</p>}
            <div className="text-zinc-300 [&_code]:bg-zinc-900 [&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-xs [&_code]:font-mono">
                {children}
            </div>
        </div>
    );
}

function SectionHeader({
    icon: Icon,
    tint,
    title,
    description,
}: {
    icon: typeof Bot;
    tint: string;
    title: string;
    description: string;
}) {
    return (
        <div className="flex items-start gap-3 mb-5">
            <div className={`p-2.5 rounded-xl border ${tint} flex-shrink-0`}>
                <Icon className="w-5 h-5" />
            </div>
            <div>
                <h2 className="text-2xl font-semibold text-white">{title}</h2>
                <p className="text-sm text-zinc-400 mt-0.5">{description}</p>
            </div>
        </div>
    );
}

const TINTS = {
    rocket: "bg-amber-500/10 border-amber-500/20 text-amber-300",
    settings: "bg-zinc-700/30 border-zinc-700 text-zinc-300",
    bot: "bg-blue-500/10 border-blue-500/20 text-blue-300",
    brain: "bg-emerald-500/10 border-emerald-500/20 text-emerald-300",
    palette: "bg-pink-500/10 border-pink-500/20 text-pink-300",
    sparkles: "bg-violet-500/10 border-violet-500/20 text-violet-300",
    plug: "bg-cyan-500/10 border-cyan-500/20 text-cyan-300",
    code: "bg-orange-500/10 border-orange-500/20 text-orange-300",
    help: "bg-rose-500/10 border-rose-500/20 text-rose-300",
};

export default function DocsPage() {
    const [activeSection, setActiveSection] = useState<string>(ALL_IDS[0]);

    // Highlight the section currently in view as the user scrolls.
    useEffect(() => {
        if (typeof window === "undefined") return;
        const observer = new IntersectionObserver(
            entries => {
                const visible = entries
                    .filter(e => e.isIntersecting)
                    .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
                if (visible[0]) setActiveSection(visible[0].target.id);
            },
            { rootMargin: "-25% 0px -60% 0px", threshold: [0.1, 0.5, 1] }
        );
        ALL_IDS.forEach(id => {
            const el = document.getElementById(id);
            if (el) observer.observe(el);
        });
        return () => observer.disconnect();
    }, []);

    return (
        <div className="p-6 lg:p-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-white mb-2">Documentation</h1>
                <p className="text-zinc-400">
                    How to configure, build, and embed your AI chatbots with Buildx.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-6 lg:gap-10">
                {/* Sticky TOC */}
                <aside className="lg:sticky lg:top-6 lg:self-start">
                    <nav className="hidden lg:block space-y-5">
                        {SECTIONS.map(group => (
                            <div key={group.group}>
                                <p className="px-2 text-[11px] font-semibold uppercase tracking-wider text-zinc-500 mb-2">
                                    {group.group}
                                </p>
                                <div className="space-y-0.5">
                                    {group.items.map(s => {
                                        const isActive = activeSection === s.id;
                                        return (
                                            <a
                                                key={s.id}
                                                href={`#${s.id}`}
                                                className={`group w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${isActive
                                                    ? "bg-violet-500/10 text-violet-200 border border-violet-500/30"
                                                    : "border border-transparent text-zinc-400 hover:text-white hover:bg-zinc-900"
                                                    }`}
                                            >
                                                <s.icon
                                                    className={`w-4 h-4 flex-shrink-0 ${isActive ? "text-violet-300" : "text-zinc-500 group-hover:text-zinc-300"
                                                        }`}
                                                />
                                                <span className="font-medium">{s.label}</span>
                                            </a>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </nav>

                    {/* Mobile pill row */}
                    <div className="lg:hidden -mx-6 px-6 mb-2 overflow-x-auto">
                        <div className="flex gap-1.5 min-w-max pb-2">
                            {SECTIONS.flatMap(g => g.items).map(s => {
                                const isActive = activeSection === s.id;
                                return (
                                    <a
                                        key={s.id}
                                        href={`#${s.id}`}
                                        className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium whitespace-nowrap ${isActive
                                            ? "bg-violet-500/10 text-violet-300 border border-violet-500/30"
                                            : "bg-zinc-900 border border-zinc-800 text-zinc-400"
                                            }`}
                                    >
                                        <s.icon className="w-4 h-4" />
                                        {s.label}
                                    </a>
                                );
                            })}
                        </div>
                    </div>
                </aside>

                {/* Main content */}
                <main className="min-w-0 space-y-14 max-w-3xl">
                    {/* QUICK START */}
                    <section id="quickstart" className="scroll-mt-6">
                        <SectionHeader
                            icon={Rocket}
                            tint={TINTS.rocket}
                            title="Quick start"
                            description="Get a chatbot live on a website in five minutes."
                        />
                        <ol className="space-y-3 text-sm text-zinc-300">
                            {[
                                {
                                    title: "Configure API keys",
                                    body: (
                                        <>
                                            In <Link href="/dashboard/settings" className="text-violet-300 hover:underline">Settings</Link>, add your Gemini API key and Qdrant connection (URL + API key + collection name).
                                        </>
                                    ),
                                },
                                {
                                    title: "Create a bot",
                                    body: (
                                        <>
                                            Go to <Link href="/dashboard/bots" className="text-violet-300 hover:underline">My Bots → Create Bot</Link>. Give it a name and an initial system prompt.
                                        </>
                                    ),
                                },
                                {
                                    title: "Upload knowledge",
                                    body: (
                                        <>
                                            Open the bot, switch to the <strong>Knowledge</strong> tab, drop a PDF / DOCX / TXT. Indexing is automatic — chunks land in Qdrant within seconds.
                                        </>
                                    ),
                                },
                                {
                                    title: "Customize the look",
                                    body: (
                                        <>
                                            Click <strong>Design Studio →</strong> in the bot editor sidebar to open a full-screen editor with live preview.
                                        </>
                                    ),
                                },
                                {
                                    title: "Embed",
                                    body: (
                                        <>
                                            Copy the embed snippet and paste it before <code className="bg-zinc-900 px-1 py-0.5 rounded text-xs">&lt;/body&gt;</code> on your site.
                                        </>
                                    ),
                                },
                            ].map((step, i) => (
                                <li
                                    key={i}
                                    className="flex gap-4 p-4 bg-zinc-900/50 border border-zinc-800 rounded-xl"
                                >
                                    <div className="w-7 h-7 rounded-full bg-violet-500/15 border border-violet-500/30 text-violet-300 flex items-center justify-center text-xs font-semibold flex-shrink-0">
                                        {i + 1}
                                    </div>
                                    <div>
                                        <p className="font-semibold text-white mb-1">{step.title}</p>
                                        <p className="text-zinc-400 text-sm">{step.body}</p>
                                    </div>
                                </li>
                            ))}
                        </ol>
                    </section>

                    {/* SETTINGS */}
                    <section id="settings" className="scroll-mt-6">
                        <SectionHeader
                            icon={SettingsIcon}
                            tint={TINTS.settings}
                            title="Settings"
                            description="Required keys and connection settings live in Settings → System."
                        />
                        <p className="text-sm text-zinc-400 mb-3">
                            Buildx stores credentials encrypted (AES-256-GCM) at the application level. Two integration points are required: a Gemini API key for the LLM + embeddings, and a Qdrant collection for vector search.
                        </p>

                        <h3 className="text-sm font-semibold text-zinc-300 mt-4 mb-2">Environment variables</h3>
                        <div className="overflow-x-auto rounded-xl border border-zinc-800">
                            <table className="w-full text-sm text-left">
                                <thead className="text-[11px] text-zinc-500 uppercase tracking-wider bg-zinc-900/50">
                                    <tr>
                                        <th className="px-4 py-2.5">Variable</th>
                                        <th className="px-4 py-2.5">Required</th>
                                        <th className="px-4 py-2.5">Purpose</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-zinc-800 text-zinc-300">
                                    <tr>
                                        <td className="px-4 py-2.5 font-mono text-violet-300 text-xs">ADMIN_EMAIL</td>
                                        <td className="px-4 py-2.5">Yes</td>
                                        <td className="px-4 py-2.5 text-zinc-400">Dashboard login email.</td>
                                    </tr>
                                    <tr>
                                        <td className="px-4 py-2.5 font-mono text-violet-300 text-xs">ADMIN_PASSWORD</td>
                                        <td className="px-4 py-2.5">Yes</td>
                                        <td className="px-4 py-2.5 text-zinc-400">Dashboard login password.</td>
                                    </tr>
                                    <tr>
                                        <td className="px-4 py-2.5 font-mono text-violet-300 text-xs">AUTH_SECRET</td>
                                        <td className="px-4 py-2.5">Yes</td>
                                        <td className="px-4 py-2.5 text-zinc-400">Session JWT signing secret.</td>
                                    </tr>
                                    <tr>
                                        <td className="px-4 py-2.5 font-mono text-violet-300 text-xs">MONGODB_URI</td>
                                        <td className="px-4 py-2.5">Yes</td>
                                        <td className="px-4 py-2.5 text-zinc-400">MongoDB connection string. The DB name is forced to <code className="text-zinc-300">buildx</code>.</td>
                                    </tr>
                                    <tr>
                                        <td className="px-4 py-2.5 font-mono text-violet-300 text-xs">ENCRYPTION_KEY</td>
                                        <td className="px-4 py-2.5">Recommended</td>
                                        <td className="px-4 py-2.5 text-zinc-400">64-char hex string. If absent, stored API keys are kept in plaintext (a warning is logged).</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        <Callout tone="warn" title="Production checklist">
                            Set <code>ENCRYPTION_KEY</code> before the first time you save a Gemini or Qdrant API key — keys saved without it will be stored in plaintext until re-saved.
                        </Callout>

                        <h3 className="text-sm font-semibold text-zinc-300 mt-6 mb-2">In-app settings</h3>
                        <ul className="space-y-2 text-sm text-zinc-400 list-disc pl-5 marker:text-zinc-600">
                            <li><strong className="text-zinc-200">Gemini API key</strong> — used for the chat completion + the 768-dim embedding model.</li>
                            <li><strong className="text-zinc-200">Qdrant URL</strong> — host URL of your Qdrant instance, e.g. <code className="text-xs">https://your-cluster.cloud.qdrant.io</code>.</li>
                            <li><strong className="text-zinc-200">Qdrant API key</strong> — encrypted at rest.</li>
                            <li><strong className="text-zinc-200">Qdrant collection name</strong> — created on first save (idempotent). 768-dim cosine.</li>
                            <li>The <strong className="text-zinc-200">System Health</strong> widget on Settings polls <code className="text-xs">/api/health</code> every 30s — green dots mean the service can reach Mongo and has a Gemini key on file.</li>
                        </ul>
                    </section>

                    {/* BOTS */}
                    <section id="bots" className="scroll-mt-6">
                        <SectionHeader
                            icon={Bot}
                            tint={TINTS.bot}
                            title="Bots"
                            description="Each bot is a separately-themed conversation surface with its own prompt, model, and knowledge base."
                        />

                        <h3 className="text-sm font-semibold text-zinc-300 mb-2">System prompt</h3>
                        <p className="text-sm text-zinc-400 mb-2">
                            The single most important setting. Be specific about role, scope, and tone.
                        </p>
                        <Callout tone="tip" title="Sharper prompts win">
                            Instead of <em>&quot;You are a helpful assistant&quot;</em>, write:
                            <CodeBlock>{`You are a Customer Support Agent for Acme Corp.
You ONLY answer questions about Acme products.
If asked anything else, politely redirect to support@acme.com.
Be concise (max 3 sentences) and professional.`}</CodeBlock>
                        </Callout>

                        <h3 className="text-sm font-semibold text-zinc-300 mt-5 mb-2">Models</h3>
                        <div className="grid sm:grid-cols-3 gap-3">
                            {[
                                { name: "Flash", desc: "Default. Best speed-to-quality. Use for support chat & FAQ.", id: "gemini-2.5-flash" },
                                { name: "Pro", desc: "Highest quality. Slower + more expensive. For complex tasks.", id: "gemini-2.5-pro" },
                                { name: "Flash Lite", desc: "Fastest. Cheapest. Light-weight Q&A only.", id: "gemini-2.5-flash-lite" },
                            ].map(m => (
                                <div key={m.id} className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
                                    <p className="text-white font-semibold mb-1">{m.name}</p>
                                    <p className="text-xs text-zinc-500 font-mono mb-2">{m.id}</p>
                                    <p className="text-xs text-zinc-400">{m.desc}</p>
                                </div>
                            ))}
                        </div>

                        <h3 className="text-sm font-semibold text-zinc-300 mt-5 mb-2">Temperature</h3>
                        <p className="text-sm text-zinc-400">
                            <code className="bg-zinc-900 px-1 py-0.5 rounded text-xs">0.0–0.3</code> for factual support.{" "}
                            <code className="bg-zinc-900 px-1 py-0.5 rounded text-xs">0.4–0.7</code> for general chat.{" "}
                            <code className="bg-zinc-900 px-1 py-0.5 rounded text-xs">0.8–1.0</code> for creative writing. Default is 0.7.
                        </p>

                        <h3 className="text-sm font-semibold text-zinc-300 mt-5 mb-2">IDs &amp; status</h3>
                        <ul className="space-y-1.5 text-sm text-zinc-400 list-disc pl-5 marker:text-zinc-600">
                            <li><strong className="text-zinc-200">Public ID</strong> — 12-char nanoid, used in the embed snippet and chat API. Never changes.</li>
                            <li><strong className="text-zinc-200">Internal ID</strong> — Mongo ObjectId. Used by the dashboard for editing.</li>
                            <li><strong className="text-zinc-200">Active toggle</strong> — soft-disables the bot. Disabled bots return 403 from the chat API.</li>
                        </ul>
                    </section>

                    {/* KNOWLEDGE */}
                    <section id="knowledge" className="scroll-mt-6">
                        <SectionHeader
                            icon={Brain}
                            tint={TINTS.brain}
                            title="Knowledge base (RAG)"
                            description="Documents you upload are chunked, embedded, and retrieved at query time."
                        />

                        <h3 className="text-sm font-semibold text-zinc-300 mb-2">How it works</h3>
                        <ol className="space-y-2 text-sm text-zinc-400 list-decimal pl-5 marker:text-emerald-400">
                            <li><strong className="text-zinc-200">Extract</strong> — text is pulled from the file (PDF via <code className="bg-zinc-900 px-1 py-0.5 rounded text-xs">unpdf</code>, DOCX via <code className="bg-zinc-900 px-1 py-0.5 rounded text-xs">mammoth</code>, TXT direct).</li>
                            <li><strong className="text-zinc-200">Chunk</strong> — split greedily on newlines / spaces into overlapping windows (1000 chars, 200 overlap).</li>
                            <li><strong className="text-zinc-200">Embed</strong> — each chunk becomes a 768-dim vector via Gemini&apos;s embedding API.</li>
                            <li><strong className="text-zinc-200">Index</strong> — vectors are upserted into Qdrant with <code className="text-xs">botId</code> + <code className="text-xs">sourceId</code> payload filters.</li>
                            <li><strong className="text-zinc-200">Retrieve</strong> — at chat time, the user&apos;s message is embedded and the top-3 chunks (cosine similarity) are appended to the system prompt.</li>
                        </ol>

                        <h3 className="text-sm font-semibold text-zinc-300 mt-5 mb-2">Supported formats</h3>
                        <p className="text-sm text-zinc-400">
                            <code className="bg-zinc-900 px-1 py-0.5 rounded text-xs">.pdf</code> ·{" "}
                            <code className="bg-zinc-900 px-1 py-0.5 rounded text-xs">.docx</code> ·{" "}
                            <code className="bg-zinc-900 px-1 py-0.5 rounded text-xs">.txt</code> · max 10 MB per file.
                        </p>

                        <Callout tone="tip" title="Tips for high-quality retrieval">
                            <ul className="list-disc pl-5 space-y-1 mt-1">
                                <li>Prefer well-structured documents (clear headings, short paragraphs).</li>
                                <li>One concept per chunk works best — avoid 50-page wall-of-text PDFs without sectioning.</li>
                                <li>The chat handler swallows RAG errors silently — if your bot stops citing your docs, check Qdrant connectivity in <Link href="/dashboard/settings" className="text-violet-300 hover:underline">Settings</Link>.</li>
                            </ul>
                        </Callout>

                        <Callout tone="warn" title="Deletion cascade">
                            Deleting a document drops its vectors from Qdrant + the KnowledgeBase row. Deleting a bot wipes everything: Qdrant points, KnowledgeBase rows, KnowledgeChunk rows, and any captured leads.
                        </Callout>
                    </section>

                    {/* DESIGN */}
                    <section id="design" className="scroll-mt-6">
                        <SectionHeader
                            icon={Palette}
                            tint={TINTS.palette}
                            title="Design studio"
                            description="A full-screen editor with live preview for theming the chat widget."
                        />
                        <p className="text-sm text-zinc-400 mb-3">
                            Open from the bot editor sidebar via <strong>Embed &amp; Distribution → Design Studio →</strong>. Every change updates the iframe preview instantly via <code className="bg-zinc-900 px-1 py-0.5 rounded text-xs">postMessage</code> — saved to the database only when you press <strong>Save</strong>.
                        </p>

                        <h3 className="text-sm font-semibold text-zinc-300 mt-4 mb-2">Sections</h3>
                        <ul className="space-y-1.5 text-sm text-zinc-400 list-disc pl-5 marker:text-zinc-600">
                            <li><strong className="text-zinc-200">Global Settings</strong> — font family, corner radius (cascades to bubbles, input, card), shadow.</li>
                            <li><strong className="text-zinc-200">Header</strong> — title, subtitle text + font, icon (custom SVG, color, bg, size), refresh icon color.</li>
                            <li><strong className="text-zinc-200">Chat Window</strong> — page background, empty-state icon (custom SVG + colors), widget size (drives the iframe container).</li>
                            <li><strong className="text-zinc-200">Bot &amp; User Message</strong> — bg, text, font (size/weight/family), border radius (preset + slider + per-corner mode), avatar.</li>
                            <li><strong className="text-zinc-200">Input Area &amp; Footer</strong> — input background, text, border, placeholder text + color, send button.</li>
                            <li><strong className="text-zinc-200">Launcher</strong> — color, icon SVG, shape, border, size sliders, close-state colors.</li>
                            <li><strong className="text-zinc-200">Advanced</strong> — element visibility toggles, text overrides.</li>
                        </ul>
                    </section>

                    {/* LEAD CAPTURE */}
                    <section id="leads" className="scroll-mt-6">
                        <SectionHeader
                            icon={Sparkles}
                            tint={TINTS.sparkles}
                            title="Lead capture"
                            description="Bots can save user contact details into a leads inbox using Gemini function calling."
                        />
                        <p className="text-sm text-zinc-400 mb-3">
                            Enable on a bot via the editor&apos;s <strong>Tools</strong> tab. When the bot detects intent (pricing, demo, contact request), it asks for the required fields conversationally, then saves a <code className="bg-zinc-900 px-1 py-0.5 rounded text-xs">Lead</code> via the <code className="bg-zinc-900 px-1 py-0.5 rounded text-xs">capture_lead</code> tool. Captured leads appear in <Link href="/dashboard/leads" className="text-violet-300 hover:underline">Leads</Link>.
                        </p>

                        <h3 className="text-sm font-semibold text-zinc-300 mt-4 mb-2">Configuration</h3>
                        <ul className="space-y-1.5 text-sm text-zinc-400 list-disc pl-5 marker:text-zinc-600">
                            <li><strong className="text-zinc-200">Required fields</strong> — chips for name, email, phone. The bot won&apos;t save until it has these.</li>
                            <li><strong className="text-zinc-200">Qualification prompt</strong> — appended to the system prompt. Useful for BANT-style questions.</li>
                            <li><strong className="text-zinc-200">Duplicate window (hours)</strong> — same email + same bot inside this window updates the existing lead instead of creating a duplicate. Default 24h. Set to 0 to disable.</li>
                        </ul>

                        <h3 className="text-sm font-semibold text-zinc-300 mt-5 mb-2">Three-layer dedup</h3>
                        <ol className="space-y-1.5 text-sm text-zinc-400 list-decimal pl-5 marker:text-zinc-600">
                            <li><strong className="text-zinc-200">Model</strong> — system prompt instructs the bot to call <code className="text-xs">capture_lead</code> at most once per conversation.</li>
                            <li><strong className="text-zinc-200">Conversation</strong> — every chat session has a UUID; subsequent calls in the same UUID merge into one lead row (DB-level unique partial index).</li>
                            <li><strong className="text-zinc-200">Identity</strong> — within the dedup window, captures matching the same email update the existing row.</li>
                        </ol>

                        <Callout tone="info" title="No new endpoints required">
                            Lead capture rides on the existing <code>POST /api/chat</code> handler. Existing bots without the toggle on are unaffected.
                        </Callout>
                    </section>

                    {/* EMBED */}
                    <section id="embed" className="scroll-mt-6">
                        <SectionHeader
                            icon={Plug}
                            tint={TINTS.plug}
                            title="Embedding"
                            description="A single <script> tag drops the chat widget anywhere — no build step required."
                        />
                        <p className="text-sm text-zinc-400 mb-2">
                            Copy the snippet from the bot editor (Public ID copy button) and paste it before the closing <code className="bg-zinc-900 px-1 py-0.5 rounded text-xs">&lt;/body&gt;</code> tag of your site:
                        </p>
                        <CodeBlock>{`<script
  src="https://your-buildx-domain.com/embed.js"
  data-bot-id="PUBLIC_ID_HERE">
</script>`}</CodeBlock>

                        <h3 className="text-sm font-semibold text-zinc-300 mt-5 mb-2">What gets injected</h3>
                        <ul className="space-y-1.5 text-sm text-zinc-400 list-disc pl-5 marker:text-zinc-600">
                            <li>A floating launcher button at <code className="text-xs">bottom-right</code> by default (positionable per bot).</li>
                            <li>A hidden iframe-container that loads <code className="text-xs">/share/[publicId]?embed=true</code> when the launcher is clicked.</li>
                            <li>All sizing, colors, icons, and shadows are driven by the saved theme — no <code>data-*</code> attributes to set.</li>
                        </ul>

                        <h3 className="text-sm font-semibold text-zinc-300 mt-5 mb-2">Allowed domains</h3>
                        <p className="text-sm text-zinc-400">
                            By default a bot is embeddable anywhere. To restrict it, add hostnames to <strong>Security → Allowed Domains</strong>. The check runs server-side both on the public config endpoint and on every chat request.
                        </p>

                        <Callout tone="tip" title="Testing locally">
                            Embed against <code>http://localhost:3000/embed.js</code> while developing. The <code>/share/*</code> route sets <code>frame-ancestors *</code> in CSP so it works inside an iframe on any host.
                        </Callout>

                        <h3 className="text-sm font-semibold text-zinc-300 mt-5 mb-2">Mobile</h3>
                        <p className="text-sm text-zinc-400">
                            Below 480px viewport width, the iframe expands to fill the screen automatically. The launcher remains in its configured corner.
                        </p>
                    </section>

                    {/* API */}
                    <section id="api" className="scroll-mt-6">
                        <SectionHeader
                            icon={Code2}
                            tint={TINTS.code}
                            title="API reference"
                            description="Public, CORS-enabled endpoints used by the embed widget — and available to your own integrations."
                        />

                        <h3 className="text-sm font-semibold text-zinc-300 mb-2">POST /api/chat</h3>
                        <p className="text-xs text-zinc-500 mb-2">Stateless. Rate-limited (default 20 req / 60s per IP). CORS *.</p>
                        <CodeBlock>{`curl -X POST https://your-buildx-domain.com/api/chat \\
  -H "Content-Type: application/json" \\
  -d '{
    "botId":         "PUBLIC_ID",
    "message":       "Hello",
    "history":       [],
    "conversationId":"<uuid-or-omit>"
  }'

# Response
{ "message": "...markdown text...", "model": "gemini-2.5-flash", "leadCaptured": false }`}</CodeBlock>

                        <h3 className="text-sm font-semibold text-zinc-300 mt-5 mb-2">GET /api/bots/public/[publicId]</h3>
                        <p className="text-xs text-zinc-500 mb-2">Returns the renderable bot config — no auth required. CORS *.</p>
                        <CodeBlock>{`{ "config": {
  "publicId":       "...",
  "name":           "...",
  "theme":          { ... },
  "widgetPosition": "bottom-right",
  "allowedDomains": [],
  "isActive":       true
}}`}</CodeBlock>

                        <h3 className="text-sm font-semibold text-zinc-300 mt-5 mb-2">GET /api/health</h3>
                        <p className="text-xs text-zinc-500 mb-2">Liveness + service connectivity. No auth.</p>
                        <CodeBlock>{`{ "status":"healthy", "uptime":123.4, "timestamp":"...",
  "services": {
    "database": { "status":"up", "latency":12 },
    "gemini":   { "status":"configured" }
  }
}`}</CodeBlock>

                        <Callout tone="warn" title="Domain enforcement">
                            <code>/api/chat</code> uses <em>substring</em> match against Origin/Referer.{" "}
                            <code>/api/bots/public/[publicId]</code> uses stricter <em>hostname</em> match. If you whitelist <code>example.com</code>, requests from <code>example.com.evil.tld</code> may pass <code>/api/chat</code> — keep the list tight.
                        </Callout>
                    </section>

                    {/* TROUBLESHOOTING */}
                    <section id="troubleshooting" className="scroll-mt-6">
                        <SectionHeader
                            icon={LifeBuoy}
                            tint={TINTS.help}
                            title="Troubleshooting"
                            description="The most common things that go wrong, and how to spot them."
                        />
                        <div className="space-y-3">
                            {[
                                {
                                    q: "Bot returns generic answers and ignores my uploaded docs",
                                    a: "Check Settings → Qdrant connection (\"Test\" button). The chat handler logs RAG errors to the server console but continues without context — so the bot keeps replying, just without your knowledge. Verify the collection name matches and the API key isn't stale.",
                                },
                                {
                                    q: "Embed snippet doesn't show a launcher",
                                    a: "Open the host site's devtools console. Look for `Bot CMS:` errors. Common causes: (1) the public ID is wrong, (2) the bot is marked inactive, (3) Allowed Domains doesn't include this host.",
                                },
                                {
                                    q: "Lead capture isn't firing",
                                    a: "Verify the Tools tab toggle is on AND the system prompt fragment is appended (open the bot in design studio, the live preview shows it). Required fields must all be present. The model only calls capture_lead after detecting clear intent — try saying \"I want a demo, my email is x@y.com\".",
                                },
                                {
                                    q: "Theme changes save but don't appear on the live widget",
                                    a: "Browser caching. Hard-refresh the host page (the embed.js is served with no cache-busting by default). The iframe content updates without caching since it loads /share/[publicId] fresh each open.",
                                },
                                {
                                    q: "\"Rate limit exceeded\" on chat",
                                    a: "Default is 20 requests / 60s per IP. Behind a proxy, ensure x-forwarded-for is set correctly — without it, all traffic shares one bucket.",
                                },
                                {
                                    q: "API keys stored in plaintext warning in logs",
                                    a: "Set ENCRYPTION_KEY in your environment (64-char hex string). After setting, save the key in Settings again — it'll be encrypted on write.",
                                },
                            ].map((item, i) => (
                                <details
                                    key={i}
                                    className="group bg-zinc-900/50 border border-zinc-800 rounded-xl p-4"
                                >
                                    <summary className="cursor-pointer text-sm font-semibold text-white list-none flex items-start gap-3">
                                        <span className="text-zinc-500 group-open:rotate-90 transition-transform mt-0.5">
                                            ▸
                                        </span>
                                        <span className="flex-1">{item.q}</span>
                                    </summary>
                                    <p className="text-sm text-zinc-400 mt-3 ml-6 leading-relaxed">{item.a}</p>
                                </details>
                            ))}
                        </div>

                        <Callout tone="info" title="Need help?">
                            Open an issue at <a href="https://github.com/anthropics/buildx" className="text-violet-300 hover:underline inline-flex items-center gap-1">your repo <ExternalLink className="w-3 h-3" /></a> or check <Link href="/dashboard/settings" className="text-violet-300 hover:underline">Settings → System Health</Link> for live status.
                        </Callout>
                    </section>
                </main>
            </div>
        </div>
    );
}
