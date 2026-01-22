import { notFound } from "next/navigation";
import dbConnect from "@/lib/db";
import { Bot } from "@/models";
import { PublicChat } from "./public-chat";

interface PageProps {
    params: Promise<{ botId: string }>;
}

export default async function SharePage({ params }: PageProps) {
    const { botId } = await params;

    await dbConnect();

    const bot = await Bot.findOne({ publicId: botId }).lean();

    if (!bot || !(bot as unknown as { isActive: boolean }).isActive) {
        notFound();
    }

    const botDoc = bot as unknown as {
        name: string;
        publicId: string;
        theme: {
            primaryColor: string;
            chatTitle: string;
            welcomeMessage: string;
        };
    };

    return (
        <div className="min-h-screen bg-zinc-950">
            <PublicChat
                botId={botDoc.publicId}
                botName={botDoc.name}
                theme={botDoc.theme}
            />
        </div>
    );
}
