import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { KnowledgeBase } from "@/models";
import dbConnect from "@/lib/db";
import { getVectorProvider } from "@/lib/vector";
import { getGlobalVectorConfig } from "@/lib/vector/settings-cache";

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string; docId: string }> }
) {
    try {
        const session = await auth();
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { id, docId } = await params;
        if (!docId) return NextResponse.json({ error: "Missing document ID" }, { status: 400 });

        await dbConnect();

        const kbDoc = await KnowledgeBase.findById(docId).lean();
        if (!kbDoc) return NextResponse.json({ error: "Document not found" }, { status: 404 });

        const vectorConfig = await getGlobalVectorConfig();
        const provider = getVectorProvider(vectorConfig);

        // Delete vectors from provider, then remove metadata doc
        await provider.delete(id, docId);
        await KnowledgeBase.findByIdAndDelete(docId);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Delete error:", error);
        return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
    }
}
