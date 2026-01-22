import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { KnowledgeBase, KnowledgeChunk } from "@/models";
import dbConnect from "@/lib/db";

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string; docId: string }> }
) {
    try {
        const session = await auth();
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { docId } = await params;

        if (!docId) return NextResponse.json({ error: "Missing document ID" }, { status: 400 });

        await dbConnect();

        // Delete parent doc
        const deletedDoc = await KnowledgeBase.findByIdAndDelete(docId);

        if (!deletedDoc) {
            return NextResponse.json({ error: "Document not found" }, { status: 404 });
        }

        // Delete all chunks
        await KnowledgeChunk.deleteMany({ sourceId: docId });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Delete error:", error);
        return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
    }
}
