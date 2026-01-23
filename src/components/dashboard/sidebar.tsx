"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { cn } from "@/lib/utils";
import {
    Bot,
    LayoutDashboard,
    Settings,
    Key,
    LogOut,
    Menu,
    X,
    BookOpen,
} from "lucide-react";
import { useState } from "react";

const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "My Bots", href: "/dashboard/bots", icon: Bot },
    { name: "API Keys", href: "/dashboard/api-keys", icon: Key },
    { name: "Documentation", href: "/dashboard/docs", icon: BookOpen },
    { name: "Settings", href: "/dashboard/settings", icon: Settings },
];

export function Sidebar() {
    const pathname = usePathname();
    const { data: session } = useSession();
    const [mobileOpen, setMobileOpen] = useState(false);

    return (
        <>
            {/* Mobile menu button */}
            <button
                className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-zinc-800 rounded-lg border border-zinc-700"
                onClick={() => setMobileOpen(!mobileOpen)}
            >
                {mobileOpen ? (
                    <X className="w-5 h-5 text-white" />
                ) : (
                    <Menu className="w-5 h-5 text-white" />
                )}
            </button>

            {/* Backdrop */}
            {mobileOpen && (
                <div
                    className="lg:hidden fixed inset-0 bg-black/50 z-40"
                    onClick={() => setMobileOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside
                className={cn(
                    "fixed top-0 left-0 z-40 h-screen w-64 bg-zinc-900 border-r border-zinc-800 transition-transform duration-300 lg:translate-x-0",
                    mobileOpen ? "translate-x-0" : "-translate-x-full"
                )}
            >
                <div className="flex flex-col h-full">
                    {/* Logo */}
                    <div className="flex items-center gap-3 px-6 py-5 border-b border-zinc-800">
                        <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-violet-500/20">
                            <Bot className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-xl font-bold text-white">Botx </span>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
                        {navigation.map((item) => {
                            const isActive =
                                pathname === item.href ||
                                (item.href !== "/dashboard" && pathname.startsWith(item.href));

                            return (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    onClick={() => setMobileOpen(false)}
                                    className={cn(
                                        "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200",
                                        isActive
                                            ? "bg-violet-500/10 text-violet-400 border border-violet-500/20"
                                            : "text-zinc-400 hover:bg-zinc-800 hover:text-white"
                                    )}
                                >
                                    <item.icon className="w-5 h-5" />
                                    {item.name}
                                </Link>
                            );
                        })}
                    </nav>

                    {/* User section */}
                    <div className="p-4 border-t border-zinc-800">
                        <div className="flex items-center gap-3 px-3 py-2">
                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white font-medium text-sm">
                                {session?.user?.email?.charAt(0).toUpperCase() || "A"}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-white truncate">
                                    {session?.user?.name || "Admin"}
                                </p>
                                <p className="text-xs text-zinc-500 truncate">
                                    {session?.user?.email}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={() => signOut({ callbackUrl: "/login" })}
                            className="w-full mt-3 flex items-center justify-center gap-2 px-4 py-2.5 text-sm text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-xl transition-colors"
                        >
                            <LogOut className="w-4 h-4" />
                            Sign Out
                        </button>
                    </div>
                </div>
            </aside>
        </>
    );
}
