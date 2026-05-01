import { notFound } from "next/navigation";
import dbConnect from "@/lib/db";
import { Bot } from "@/models";
import { PublicChat } from "./public-chat";

interface PageProps {
    params: Promise<{ botId: string }>;
    searchParams: Promise<{ embed?: string }>;
}

export default async function SharePage({ params, searchParams }: PageProps) {
    const { botId } = await params;
    const sp = await searchParams;
    const embedded = sp.embed === "true";

    await dbConnect();

    const bot = await Bot.findOne({ publicId: botId }).lean();

    if (!bot || !(bot as unknown as { isActive: boolean }).isActive) {
        notFound();
    }

    const botDoc = bot as unknown as {
        name: string;
        publicId: string;
        theme: {
            launcher?: { bgColor?: string };
            primaryColor?: string;
        };
    };

    if (embedded) {
        return (
            <div className="min-h-screen bg-white dark:bg-zinc-900">
                <PublicChat
                    botId={botDoc.publicId}
                    botName={botDoc.name}
                    theme={botDoc.theme}
                />
            </div>
        );
    }

    const accent =
        botDoc.theme?.launcher?.bgColor || botDoc.theme?.primaryColor || "#8b5cf6";

    return (
        <div
            className="min-h-screen flex items-center justify-center p-4 sm:p-6"
            style={{
                background: `radial-gradient(circle at 30% 20%, ${accent}22, transparent 60%), radial-gradient(circle at 70% 80%, ${accent}18, transparent 55%), #0a0a0a`,
            }}
        >
            <PublicChat
                botId={botDoc.publicId}
                botName={botDoc.name}
                theme={botDoc.theme}
            />
        </div>
    );
}
