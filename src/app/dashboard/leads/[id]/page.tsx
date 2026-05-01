"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
    ArrowLeft,
    Mail,
    Phone,
    User,
    Trash2,
    Save,
    Loader2,
    MessageSquare,
} from "lucide-react";

type LeadStatus = "new" | "contacted" | "qualified" | "archived";

interface TranscriptEntry {
    role: "user" | "assistant";
    content: string;
    ts: string;
}

interface LeadDetail {
    _id: string;
    botId: string;
    bot?: { _id: string; name: string; publicId: string } | null;
    conversationId: string;
    name?: string;
    email?: string;
    phone?: string;
    intent?: string;
    qualificationNotes?: string;
    status: LeadStatus;
    transcript: TranscriptEntry[];
    metadata: {
        ip?: string;
        referer?: string;
        userAgent?: string;
        capturedAt?: string;
    };
    captureCount: number;
    lastSeenAt: string;
    createdAt: string;
    updatedAt: string;
}

const STATUS_OPTIONS: { value: LeadStatus; label: string }[] = [
    { value: "new", label: "New" },
    { value: "contacted", label: "Contacted" },
    { value: "qualified", label: "Qualified" },
    { value: "archived", label: "Archived" },
];

const STATUS_STYLES: Record<LeadStatus, string> = {
    new: "bg-violet-500/10 text-violet-300 border-violet-500/30",
    contacted: "bg-blue-500/10 text-blue-300 border-blue-500/30",
    qualified: "bg-emerald-500/10 text-emerald-300 border-emerald-500/30",
    archived: "bg-zinc-700/40 text-zinc-400 border-zinc-700",
};

export default function LeadDetailPage() {
    const params = useParams();
    const router = useRouter();
    const id = params.id as string;
    const [lead, setLead] = useState<LeadDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [notes, setNotes] = useState("");
    const [savingNotes, setSavingNotes] = useState(false);

    useEffect(() => {
        let cancelled = false;
        async function fetchLead() {
            try {
                const res = await fetch(`/api/leads/${id}`);
                if (!res.ok) {
                    router.push("/dashboard/leads");
                    return;
                }
                const data = await res.json();
                if (!cancelled) {
                    setLead(data.lead);
                    setNotes(data.lead.qualificationNotes || "");
                }
            } catch (err) {
                console.error("Failed to fetch lead", err);
                router.push("/dashboard/leads");
            } finally {
                if (!cancelled) setLoading(false);
            }
        }
        fetchLead();
        return () => {
            cancelled = true;
        };
    }, [id, router]);

    async function updateStatus(status: LeadStatus) {
        if (!lead) return;
        const prev = lead.status;
        setLead({ ...lead, status });
        try {
            const res = await fetch(`/api/leads/${lead._id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status }),
            });
            if (!res.ok) {
                setLead({ ...lead, status: prev });
                alert("Failed to update status");
            }
        } catch (err) {
            console.error(err);
            setLead({ ...lead, status: prev });
        }
    }

    async function saveNotes() {
        if (!lead) return;
        setSavingNotes(true);
        try {
            const res = await fetch(`/api/leads/${lead._id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ qualificationNotes: notes }),
            });
            if (res.ok) {
                const data = await res.json();
                setLead(data.lead);
            } else {
                alert("Failed to save notes");
            }
        } catch (err) {
            console.error(err);
        } finally {
            setSavingNotes(false);
        }
    }

    async function deleteLead() {
        if (!lead) return;
        if (!confirm("Delete this lead permanently? This cannot be undone.")) return;
        try {
            const res = await fetch(`/api/leads/${lead._id}`, { method: "DELETE" });
            if (res.ok) {
                router.push("/dashboard/leads");
            } else {
                alert("Failed to delete lead");
            }
        } catch (err) {
            console.error(err);
        }
    }

    if (loading) {
        return <div className="p-8 text-center text-zinc-500">Loading lead…</div>;
    }
    if (!lead) return null;

    return (
        <div className="p-6 lg:p-8 max-w-5xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                    <Link
                        href="/dashboard/leads"
                        className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-white">
                            {lead.name || lead.email || "Lead"}
                        </h1>
                        <p className="text-sm text-zinc-400">
                            {lead.bot ? (
                                <Link
                                    href={`/dashboard/bots/${lead.bot._id}`}
                                    className="hover:text-violet-300"
                                >
                                    {lead.bot.name}
                                </Link>
                            ) : (
                                "Unknown bot"
                            )}{" "}
                            • Captured{" "}
                            {new Date(lead.createdAt).toLocaleString()}
                        </p>
                    </div>
                </div>
                <button
                    onClick={deleteLead}
                    className="flex items-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-300 border border-red-500/30 rounded-xl text-sm"
                >
                    <Trash2 className="w-4 h-4" />
                    Delete
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left column */}
                <div className="lg:col-span-1 space-y-6">
                    {/* Contact card */}
                    <div className="bg-zinc-900/50 backdrop-blur-xl rounded-2xl border border-zinc-800 p-5">
                        <h2 className="text-sm font-bold text-zinc-500 uppercase tracking-wider mb-4">
                            Contact
                        </h2>
                        <div className="space-y-3">
                            <Field icon={<User className="w-4 h-4" />} label="Name" value={lead.name} />
                            <Field icon={<Mail className="w-4 h-4" />} label="Email" value={lead.email} />
                            <Field icon={<Phone className="w-4 h-4" />} label="Phone" value={lead.phone} />
                            <Field
                                icon={<MessageSquare className="w-4 h-4" />}
                                label="Intent"
                                value={lead.intent}
                            />
                        </div>
                    </div>

                    {/* Status */}
                    <div className="bg-zinc-900/50 backdrop-blur-xl rounded-2xl border border-zinc-800 p-5">
                        <h2 className="text-sm font-bold text-zinc-500 uppercase tracking-wider mb-4">
                            Status
                        </h2>
                        <div className="grid grid-cols-2 gap-2">
                            {STATUS_OPTIONS.map((s) => (
                                <button
                                    key={s.value}
                                    onClick={() => updateStatus(s.value)}
                                    className={`px-3 py-2 text-sm font-medium rounded-lg border transition-colors capitalize ${lead.status === s.value
                                        ? STATUS_STYLES[s.value]
                                        : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700"
                                        }`}
                                >
                                    {s.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Metadata */}
                    <div className="bg-zinc-900/50 backdrop-blur-xl rounded-2xl border border-zinc-800 p-5">
                        <h2 className="text-sm font-bold text-zinc-500 uppercase tracking-wider mb-4">
                            Metadata
                        </h2>
                        <dl className="space-y-2 text-xs">
                            <Meta label="Conversation ID" value={lead.conversationId} mono />
                            <Meta label="Capture count" value={String(lead.captureCount)} />
                            <Meta
                                label="Last seen"
                                value={new Date(lead.lastSeenAt).toLocaleString()}
                            />
                            <Meta label="IP" value={lead.metadata?.ip || "—"} mono />
                            <Meta
                                label="Referer"
                                value={lead.metadata?.referer || "—"}
                                title={lead.metadata?.referer}
                            />
                            <Meta
                                label="User agent"
                                value={lead.metadata?.userAgent || "—"}
                                title={lead.metadata?.userAgent}
                            />
                        </dl>
                    </div>
                </div>

                {/* Right column */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Notes */}
                    <div className="bg-zinc-900/50 backdrop-blur-xl rounded-2xl border border-zinc-800 p-5">
                        <div className="flex items-center justify-between mb-3">
                            <h2 className="text-sm font-bold text-zinc-500 uppercase tracking-wider">
                                Qualification notes
                            </h2>
                            <button
                                onClick={saveNotes}
                                disabled={savingNotes || notes === (lead.qualificationNotes || "")}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-600 hover:bg-violet-500 text-white text-xs font-medium rounded-lg disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                {savingNotes ? (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                    <Save className="w-3.5 h-3.5" />
                                )}
                                Save
                            </button>
                        </div>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            rows={5}
                            placeholder="Add notes about this lead — context, follow-up plan, qualification answers…"
                            className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-xl text-white text-sm focus:ring-2 focus:ring-violet-500 outline-none"
                        />
                    </div>

                    {/* Transcript */}
                    <div className="bg-zinc-900/50 backdrop-blur-xl rounded-2xl border border-zinc-800 p-5">
                        <h2 className="text-sm font-bold text-zinc-500 uppercase tracking-wider mb-4">
                            Conversation transcript
                        </h2>
                        {lead.transcript.length === 0 ? (
                            <p className="text-sm text-zinc-500">No transcript captured.</p>
                        ) : (
                            <div className="space-y-3">
                                {lead.transcript.map((t, i) => (
                                    <div
                                        key={i}
                                        className={`p-3 rounded-xl border ${t.role === "user"
                                            ? "bg-blue-500/5 border-blue-500/20"
                                            : "bg-violet-500/5 border-violet-500/20"
                                            }`}
                                    >
                                        <div className="flex items-center justify-between mb-1.5">
                                            <span
                                                className={`text-xs font-semibold uppercase tracking-wider ${t.role === "user" ? "text-blue-300" : "text-violet-300"
                                                    }`}
                                            >
                                                {t.role === "user" ? "User" : "Bot"}
                                            </span>
                                            <span className="text-xs text-zinc-500">
                                                {t.ts ? new Date(t.ts).toLocaleString() : ""}
                                            </span>
                                        </div>
                                        <p className="text-sm text-zinc-200 whitespace-pre-wrap">
                                            {t.content}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

function Field({
    icon,
    label,
    value,
}: {
    icon: React.ReactNode;
    label: string;
    value?: string;
}) {
    return (
        <div className="flex items-start gap-3">
            <div className="text-zinc-500 mt-0.5">{icon}</div>
            <div className="min-w-0 flex-1">
                <p className="text-xs text-zinc-500 uppercase tracking-wider">{label}</p>
                <p className="text-sm text-white break-words">{value || "—"}</p>
            </div>
        </div>
    );
}

function Meta({
    label,
    value,
    mono,
    title,
}: {
    label: string;
    value: string;
    mono?: boolean;
    title?: string;
}) {
    return (
        <div className="flex items-center justify-between gap-3">
            <dt className="text-zinc-500 flex-shrink-0">{label}</dt>
            <dd
                className={`text-zinc-300 truncate text-right ${mono ? "font-mono text-[11px]" : ""
                    }`}
                title={title || value}
            >
                {value}
            </dd>
        </div>
    );
}
