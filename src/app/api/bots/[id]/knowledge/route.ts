import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { Bot, KnowledgeBase, KnowledgeChunk } from "@/models";
import dbConnect from "@/lib/db";
import { getEmbedding } from "@/lib/gemini";


// @ts-ignore
const mammoth = require("mammoth");

// Polyfill for pdf-parseive text splitter implementation since langchain import was failing
function splitTextRecursive(text: string, chunkSize: number = 1000, chunkOverlap: number = 200): string[] {
    if (text.length <= chunkSize) return [text];

    const chunks: string[] = [];
    let start = 0;

    while (start < text.length) {
        let end = start + chunkSize;

        if (end >= text.length) {
            chunks.push(text.slice(start));
            break;
        }

        // Try to break at a newline or space
        let breakPoint = text.lastIndexOf("\n", end);
        if (breakPoint === -1 || breakPoint < start + chunkOverlap) {
            breakPoint = text.lastIndexOf(" ", end);
        }

        if (breakPoint === -1 || breakPoint < start + chunkOverlap) {
            breakPoint = end; // Force break
        }

        chunks.push(text.slice(start, breakPoint).trim());
        start = breakPoint - chunkOverlap; // Overlap

        // Ensure forward progress
        if (start >= end) start = end;
    }

    return chunks.filter(c => c.length > 0);
}

// Disable body parser for file uploads if needed, but App Router handles FormData well
// export const config = { api: { bodyParser: false } };

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
        const { id } = await params; // Bot ID

        if (!file) {
            return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
        }

        await dbConnect();

        // 1. Parse File Content
        let textContent = "";
        const buffer = Buffer.from(await file.arrayBuffer());

        if (file.type === "application/pdf") {
            // const pdfData = await pdf(buffer);
            // textContent = pdfData.text;
            return NextResponse.json({ error: "PDF processing is temporarily disabled due to server environment limits. Please try .txt or .docx" }, { status: 400 });
        } else if (
            file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        ) {
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

        // 2. Create KnowledgeBase Document
        const kbDoc = await KnowledgeBase.create({
            botId: id,
            sourceType: file.name.endsWith(".pdf") ? "pdf" : file.name.endsWith(".docx") ? "word" : "text",
            sourceName: file.name,
            content: textContent, // Optional: Store full text? maybe not if huge. Let's store for now.
            metadata: {
                originalFileName: file.name,
                charCount: textContent.length,
            },
        });

        // 3. Split Text into Chunks
        const chunks = splitTextRecursive(textContent, 1000, 200);

        // 4. Embed and Save Chunks
        const chunkDocs = [];

        // Process in batches
        for (let i = 0; i < chunks.length; i++) {
            const chunk = chunks[i];
            const cleanContent = chunk.replace(/\n\s*\n/g, "\n");

            const embedding = await getEmbedding(cleanContent);

            // Create Mongo Doc
            const chunkDoc = new KnowledgeChunk({
                botId: id,
                sourceId: kbDoc._id,
                content: cleanContent,
                embedding: embedding, // Atlas uses this for indexing
                chunkIndex: i,
            });
            chunkDocs.push(chunkDoc);

            await new Promise(r => setTimeout(r, 200));
        }

        await KnowledgeChunk.insertMany(chunkDocs);

        // Update kbDoc with chunk count
        kbDoc.metadata.chunkCount = chunks.length;
        kbDoc.isProcessed = true;
        await kbDoc.save();

        return NextResponse.json({ success: true, document: kbDoc });


    } catch (error) {
        console.error("Ingestion error:", error);
        return NextResponse.json({ error: "Failed to process file" }, { status: 500 });
    }
}


