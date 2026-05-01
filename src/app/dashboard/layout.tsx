"use client";

import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/dashboard/sidebar";

// Routes that should render full-screen without the dashboard sidebar.
// Each entry is a regex matched against `pathname`.
const FULLSCREEN_ROUTES: RegExp[] = [
    /^\/dashboard\/bots\/[^/]+\/design(?:\/|$)/,
];

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const isFullScreen = FULLSCREEN_ROUTES.some(re => re.test(pathname));

    if (isFullScreen) {
        return <div className="min-h-screen bg-zinc-950">{children}</div>;
    }

    return (
        <div className="min-h-screen bg-zinc-950">
            <Sidebar />
            <main className="lg:pl-64">
                <div className="min-h-screen">{children}</div>
            </main>
        </div>
    );
}
