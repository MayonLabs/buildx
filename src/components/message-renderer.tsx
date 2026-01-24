
import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface MessageRendererProps {
    content: string;
    role: "user" | "assistant";
}

export function MessageRenderer({ content, role }: MessageRendererProps) {
    return (
        <div
            className={`prose prose-sm max-w-none break-words ${role === "user" ? "prose-invert" : "prose-zinc dark:prose-invert"
                } prose-p:my-1 prose-pre:bg-black/50 prose-pre:p-2 prose-pre:rounded-lg prose-code:bg-black/20 prose-code:px-1 prose-code:rounded prose-code:before:content-none prose-code:after:content-none`}
            style={{ color: 'inherit' }}
        >
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {content}
            </ReactMarkdown>
        </div>
    );
}
