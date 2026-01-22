import { Sidebar } from "@/components/dashboard/sidebar";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-zinc-950">
            <Sidebar />
            <main className="lg:pl-64">
                <div className="min-h-screen">{children}</div>
            </main>
        </div>
    );
}
