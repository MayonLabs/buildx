"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Users, Search, ChevronLeft, ChevronRight, Mail, Phone, ExternalLink } from "lucide-react";

interface LeadRow {
    _id: string;
    botId: string;
    botName: string;
    name?: string;
    email?: string;
    phone?: string;
    intent?: string;
    status: "new" | "contacted" | "qualified" | "archived";
    captureCount: number;
    createdAt: string;
}

interface BotOption {
    _id: string;
    name: string;
}

const STATUSES: { value: string; label: string }[] = [
    { value: "", label: "All statuses" },
    { value: "new", label: "New" },
    { value: "contacted", label: "Contacted" },
    { value: "qualified", label: "Qualified" },
    { value: "archived", label: "Archived" },
];

const STATUS_STYLES: Record<string, string> = {
    new: "bg-violet-500/10 text-violet-300 border-violet-500/20",
    contacted: "bg-blue-500/10 text-blue-300 border-blue-500/20",
    qualified: "bg-emerald-500/10 text-emerald-300 border-emerald-500/20",
    archived: "bg-zinc-700/50 text-zinc-400 border-zinc-700",
};

export default function LeadsPage() {
    const searchParams = useSearchParams();
    const initialBotId = searchParams.get("botId") || "";
    const [leads, setLeads] = useState<LeadRow[]>([]);
    const [bots, setBots] = useState<BotOption[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);
    const [botFilter, setBotFilter] = useState(initialBotId);
    const [statusFilter, setStatusFilter] = useState("");
    const [search, setSearch] = useState("");

    useEffect(() => {
        async function fetchBots() {
            try {
                const res = await fetch("/api/bots");
                if (res.ok) {
                    const data = await res.json();
                    setBots(
                        (data.bots || []).map((b: { _id: string; name: string }) => ({
                            _id: b._id,
                            name: b.name,
                        }))
                    );
                }
            } catch (err) {
                console.error("Failed to fetch bots", err);
            }
        }
        fetchBots();
    }, []);

    const fetchLeads = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (botFilter) params.set("botId", botFilter);
            if (statusFilter) params.set("status", statusFilter);
            if (search.trim()) params.set("q", search.trim());
            params.set("page", String(page));

            const res = await fetch(`/api/leads?${params.toString()}`);
            if (res.ok) {
                const data = await res.json();
                setLeads(data.leads || []);
                setTotalPages(data.totalPages || 1);
                setTotal(data.total || 0);
            }
        } catch (err) {
            console.error("Failed to fetch leads", err);
        } finally {
            setLoading(false);
        }
    }, [botFilter, statusFilter, search, page]);

    useEffect(() => {
        fetchLeads();
    }, [fetchLeads]);

    function onSearchSubmit(e: React.FormEvent) {
        e.preventDefault();
        setPage(1);
        fetchLeads();
    }

    function resetFilters() {
        setBotFilter("");
        setStatusFilter("");
        setSearch("");
        setPage(1);
    }

    return (
        <div className="p-6 lg:p-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl lg:text-3xl font-bold text-white mb-2 flex items-center gap-3">
                        <Users className="w-7 h-7 text-violet-400" />
                        Leads
                    </h1>
                    <p className="text-zinc-400">
                        {loading ? "Loading…" : `${total} captured ${total === 1 ? "lead" : "leads"}`}
                    </p>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-zinc-900/50 backdrop-blur-xl rounded-2xl border border-zinc-800 p-4 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <select
                        value={botFilter}
                        onChange={(e) => {
                            setBotFilter(e.target.value);
                            setPage(1);
                        }}
                        className="px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-white text-sm focus:ring-2 focus:ring-violet-500 outline-none"
                    >
                        <option value="">All bots</option>
                        {bots.map((b) => (
                            <option key={b._id} value={b._id}>
                                {b.name}
                            </option>
                        ))}
                    </select>
                    <select
                        value={statusFilter}
                        onChange={(e) => {
                            setStatusFilter(e.target.value);
                            setPage(1);
                        }}
                        className="px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-white text-sm focus:ring-2 focus:ring-violet-500 outline-none"
                    >
                        {STATUSES.map((s) => (
                            <option key={s.value} value={s.value}>
                                {s.label}
                            </option>
                        ))}
                    </select>
                    <form onSubmit={onSearchSubmit} className="md:col-span-2 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search name, email, phone, intent…"
                            className="w-full pl-9 pr-24 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-white text-sm placeholder-zinc-500 focus:ring-2 focus:ring-violet-500 outline-none"
                        />
                        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
                            {(botFilter || statusFilter || search) && (
                                <button
                                    type="button"
                                    onClick={resetFilters}
                                    className="px-3 py-1 text-xs text-zinc-400 hover:text-white"
                                >
                                    Clear
                                </button>
                            )}
                            <button
                                type="submit"
                                className="px-3 py-1 text-xs bg-violet-600 hover:bg-violet-500 text-white rounded-lg"
                            >
                                Search
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            {/* Table */}
            <div className="bg-zinc-900/50 backdrop-blur-xl rounded-2xl border border-zinc-800 overflow-hidden">
                {loading ? (
                    <div className="p-8 animate-pulse space-y-3">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <div key={i} className="h-12 bg-zinc-800 rounded-lg" />
                        ))}
                    </div>
                ) : leads.length === 0 ? (
                    <div className="p-12 text-center">
                        <Users className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
                        <p className="text-zinc-400 mb-2">No leads yet.</p>
                        <p className="text-sm text-zinc-500">
                            Enable lead capture on a bot from its <span className="text-violet-400">Tools</span> tab,
                            and captured leads will appear here.
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-zinc-900/80 text-zinc-400 text-xs uppercase tracking-wider">
                                <tr>
                                    <th className="text-left px-4 py-3 font-medium">Bot</th>
                                    <th className="text-left px-4 py-3 font-medium">Name</th>
                                    <th className="text-left px-4 py-3 font-medium">Contact</th>
                                    <th className="text-left px-4 py-3 font-medium">Intent</th>
                                    <th className="text-left px-4 py-3 font-medium">Status</th>
                                    <th className="text-left px-4 py-3 font-medium">Captured</th>
                                    <th className="px-4 py-3" />
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-800">
                                {leads.map((l) => (
                                    <tr key={l._id} className="hover:bg-zinc-800/40 transition-colors">
                                        <td className="px-4 py-3 text-zinc-300">{l.botName}</td>
                                        <td className="px-4 py-3 text-white">{l.name || "—"}</td>
                                        <td className="px-4 py-3 text-zinc-300">
                                            <div className="space-y-0.5">
                                                {l.email && (
                                                    <div className="flex items-center gap-1.5 text-xs">
                                                        <Mail className="w-3 h-3 text-zinc-500" />
                                                        {l.email}
                                                    </div>
                                                )}
                                                {l.phone && (
                                                    <div className="flex items-center gap-1.5 text-xs">
                                                        <Phone className="w-3 h-3 text-zinc-500" />
                                                        {l.phone}
                                                    </div>
                                                )}
                                                {!l.email && !l.phone && <span className="text-zinc-600">—</span>}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-zinc-400 max-w-xs truncate">
                                            {l.intent || "—"}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span
                                                className={`inline-block px-2.5 py-0.5 text-xs rounded-full border capitalize ${STATUS_STYLES[l.status] || ""
                                                    }`}
                                            >
                                                {l.status}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-zinc-400 text-xs">
                                            {new Date(l.createdAt).toLocaleString()}
                                            {l.captureCount > 1 && (
                                                <span className="ml-2 text-zinc-500">
                                                    (×{l.captureCount})
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <Link
                                                href={`/dashboard/leads/${l._id}`}
                                                className="inline-flex items-center gap-1 text-violet-400 hover:text-violet-300 text-xs font-medium"
                                            >
                                                View <ExternalLink className="w-3 h-3" />
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                    <p className="text-sm text-zinc-400">
                        Page {page} of {totalPages}
                    </p>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                            disabled={page <= 1}
                            className="flex items-center gap-1 px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-zinc-300 hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            <ChevronLeft className="w-4 h-4" />
                            Prev
                        </button>
                        <button
                            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                            disabled={page >= totalPages}
                            className="flex items-center gap-1 px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-zinc-300 hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            Next
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
