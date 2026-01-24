"use client";

import { useEffect, useState } from "react";
import { Activity, Database, Server, Smartphone, Cpu } from "lucide-react";
import clsx from "clsx";

interface HealthData {
    status: string;
    uptime: number;
    services: {
        database: {
            status: string;
            latency: string;
        };
        gemini: {
            status: string;
        };
    };
}

export function SystemHealth() {
    const [data, setData] = useState<HealthData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        const fetchHealth = async () => {
            try {
                const res = await fetch("/api/health");
                if (!res.ok) throw new Error("Failed");
                const json = await res.json();
                setData(json);
            } catch (err) {
                setError(true);
            } finally {
                setLoading(false);
            }
        };

        fetchHealth();
        // Poll every 30 seconds
        const interval = setInterval(fetchHealth, 30000);
        return () => clearInterval(interval);
    }, []);

    const formatUptime = (seconds: number) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        return `${h}h ${m}m`;
    };

    if (loading) return (
        <div className="h-48 animate-pulse bg-zinc-900/50 rounded-xl border border-zinc-800"></div>
    );

    const isHealthy = !error && data?.status === "healthy";

    return (
        <div className="bg-zinc-900/50 backdrop-blur-xl rounded-2xl border border-zinc-800 p-6 relative overflow-hidden group">
            {/* Background Glow Effect */}
            <div className={clsx(
                "absolute -right-20 -top-20 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl transition-opacity duration-1000",
                !isHealthy && "bg-red-500/10"
            )} />

            <div className="flex items-center justify-between mb-6 relative">
                <div className="flex items-start gap-4">
                    <div className={clsx(
                        "w-12 h-12 rounded-xl flex items-center justify-center transition-colors",
                        isHealthy ? "bg-emerald-500/10" : "bg-red-500/10"
                    )}>
                        <Activity className={clsx(
                            "w-6 h-6",
                            isHealthy ? "text-emerald-400" : "text-red-400"
                        )} />
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold text-white mb-1">
                            System Status
                        </h2>
                        <p className="text-sm text-zinc-400">
                            Real-time monitoring of system components.
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <div className={clsx(
                        "w-2.5 h-2.5 rounded-full animate-pulse",
                        isHealthy ? "bg-emerald-500" : "bg-red-500"
                    )} />
                    <span className={clsx(
                        "text-sm font-medium",
                        isHealthy ? "text-emerald-400" : "text-red-400"
                    )}>
                        {isHealthy ? "Operational" : "Issues Detected"}
                    </span>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 relative">
                {/* API Status */}
                <div className="p-4 bg-zinc-900/80 rounded-xl border border-zinc-800">
                    <div className="flex items-center gap-3 mb-2">
                        <Server className="w-4 h-4 text-violet-400" />
                        <span className="text-sm text-zinc-400">API Server</span>
                    </div>
                    <div className="flex items-end justify-between">
                        <span className="text-xl font-semibold text-white">Online</span>
                        <span className="text-xs text-zinc-500 mb-1">
                            UP: {data ? formatUptime(data.uptime) : "0m"}
                        </span>
                    </div>
                </div>

                {/* DB Status */}
                <div className="p-4 bg-zinc-900/80 rounded-xl border border-zinc-800">
                    <div className="flex items-center gap-3 mb-2">
                        <Database className="w-4 h-4 text-blue-400" />
                        <span className="text-sm text-zinc-400">Database</span>
                    </div>
                    <div className="flex items-end justify-between">
                        <span className={clsx(
                            "text-xl font-semibold",
                            data?.services.database.status === "connected" ? "text-white" : "text-red-400"
                        )}>
                            {data?.services.database.status === "connected" ? "Connected" : "Error"}
                        </span>
                        <span className="text-xs text-zinc-500 mb-1">
                            {data?.services.database.latency || "-"}
                        </span>
                    </div>
                </div>

                {/* AI Status */}
                <div className="p-4 bg-zinc-900/80 rounded-xl border border-zinc-800">
                    <div className="flex items-center gap-3 mb-2">
                        <Cpu className="w-4 h-4 text-orange-400" />
                        <span className="text-sm text-zinc-400">Gemini AI</span>
                    </div>
                    <div className="flex items-end justify-between">
                        <span className={clsx(
                            "text-xl font-semibold",
                            data?.services.gemini.status === "configured" ? "text-white" : "text-yellow-400"
                        )}>
                            {data?.services.gemini.status === "configured" ? "Ready" : "Missing Key"}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}
