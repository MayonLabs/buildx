import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { KnowledgeBase } from "@/models";
import dbConnect from "@/lib/db";
import { getEmbedding } from "@/lib/gemini";
import { getVectorProvider } from "@/lib/vector";
import { getGlobalSettings } from "@/lib/vector/settings-cache";
import type { VectorChunk } from "@/lib/vector";
import { extractText, getDocumentProxy } from "unpdf";

// @ts-ignore
const mammoth = require("mammoth");

function splitTextRecursive(text: string, chunkSize = 1000, chunkOverlap = 200): string[] {
    if (text.length <= chunkSize) return [text];

    const chunks: string[] = [];
    let start = 0;

    while (start < text.length) {
        let end = start + chunkSize;
        if (end >= text.length) {
            chunks.push(text.slice(start));
            break;
        }
        let breakPoint = text.lastIndexOf("\n", end);
        if (breakPoint === -1 || breakPoint < start + chunkOverlap) {
            breakPoint = text.lastIndexOf(" ", end);
        }
        if (breakPoint === -1 || breakPoint < start + chunkOverlap) {
            breakPoint = end;
        }
        chunks.push(text.slice(start, breakPoint).trim());
        start = breakPoint - chunkOverlap;
        if (start >= end) start = end;
    }

    return chunks.filter(c => c.length > 0);
}

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        await dbConnect();
        const { id } = await params;

        const documents = await KnowledgeBase.find({ botId: id }).select("-content").sort({ createdAt: -1 });
        return NextResponse.json({ documents });
    } catch (error) {
        console.error("Error listing knowledge:", error);
        return NextResponse.json({ error: "Failed to list knowledge" }, { status: 500 });
    }
}

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const formData = await req.formData();
        const file = formData.get("file") as File;
        const { id } = await params;

        if (!file) {
            return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
        }

        await dbConnect();

        const globalSettings = await getGlobalSettings();
        const geminiKey = globalSettings.geminiApiKey || "";
        if (!geminiKey) {
            return NextResponse.json(
                { error: "Gemini API key not configured. Add it in Settings." },
                { status: 500 }
            );
        }
        const provider = getVectorProvider(globalSettings.vectorDb);

        // Parse file content
        let textContent = "";
        const buffer = Buffer.from(await file.arrayBuffer());

        if (file.type === "application/pdf") {
            const pdf = await getDocumentProxy(new Uint8Array(buffer));
            const { text } = await extractText(pdf, { mergePages: true });
            textContent = text;
        } else if (file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
            const result = await mammoth.extractRawText({ buffer });
            textContent = result.value;
        } else if (file.type === "text/plain") {
            textContent = await file.text();
        } else {
            return NextResponse.json({ error: "Unsupported file type" }, { status: 400 });
        }

        if (!textContent.trim()) {
            return NextResponse.json({ error: "File is empty" }, { status: 400 });
        }

        // Create KnowledgeBase metadata doc
        const kbDoc = await KnowledgeBase.create({
            botId: id,
            sourceType: file.name.endsWith(".pdf") ? "pdf" : file.name.endsWith(".docx") ? "word" : "text",
            sourceName: file.name,
            content: textContent,
            metadata: {
                originalFileName: file.name,
                charCount: textContent.length,
            },
        });

        // Split → embed → collect VectorChunks
        const rawChunks = splitTextRecursive(textContent, 1000, 200);
        const vectorChunks: VectorChunk[] = [];

        for (let i = 0; i < rawChunks.length; i++) {
            const cleanContent = rawChunks[i].replace(/\n\s*\n/g, "\n");
            const embedding = await getEmbedding(cleanContent, geminiKey);

            vectorChunks.push({
                id: `${kbDoc._id}_${i}`,
                content: cleanContent,
                embedding,
                metadata: {
                    botId: id,
                    sourceId: kbDoc._id.toString(),
                    chunkIndex: i,
                },
            });

            // Respect Gemini embedding rate limit
            await new Promise(r => setTimeout(r, 200));
        }

        // Store vectors via the selected provider
        await provider.upsert(vectorChunks);

        kbDoc.metadata.chunkCount = rawChunks.length;
        kbDoc.isProcessed = true;
        await kbDoc.save();

        return NextResponse.json({ success: true, document: kbDoc });
    } catch (error) {
        console.error("Ingestion error:", error);
        return NextResponse.json({ error: "Failed to process file" }, { status: 500 });
    }
}
