"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Minimize2, Maximize2 } from "lucide-react";
import { MessageRenderer } from "@/components/message-renderer";

interface Message {
    role: "user" | "assistant";
    content: string;
}

interface PublicChatProps {
    botId: string;
    botName: string;
    theme: {
        primaryColor: string;
        chatTitle: string;
        welcomeMessage: string;
    };
}

export function PublicChat({ botId, botName, theme }: PublicChatProps) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [isFullScreen, setIsFullScreen] = useState(true);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    async function sendMessage(e: React.FormEvent) {
        e.preventDefault();
        if (!input.trim() || loading) return;

        const userMessage = input.trim();
        setInput("");
        const newMessages = [...messages, { role: "user" as const, content: userMessage }];
        setMessages(newMessages);
        setLoading(true);

        try {
            const res = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    message: userMessage,
                    botId,
                    history: messages,
                }),
            });

            if (res.ok) {
                const data = await res.json();
                setMessages([...newMessages, { role: "assistant", content: data.message }]);
            } else {
                const error = await res.json();
                setMessages([
                    ...newMessages,
                    { role: "assistant", content: `Sorry, I encountered an error: ${error.error}` },
                ]);
            }
        } catch {
            setMessages([
                ...newMessages,
                { role: "assistant", content: "Sorry, I'm having trouble connecting right now." },
            ]);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div
            className={`flex flex-col ${isFullScreen ? "h-screen" : "h-[600px] max-w-lg mx-auto mt-8 rounded-2xl shadow-2xl"
                } bg-zinc-900 overflow-hidden`}
        >
            {/* Header */}
            <div
                className="flex items-center justify-between px-4 py-3"
                style={{ backgroundColor: theme.primaryColor }}
            >
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                        <Bot className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h1 className="font-semibold text-white">{theme.chatTitle || botName}</h1>
                        <p className="text-xs text-white/70">Powered by AI</p>
                    </div>
                </div>
                <button
                    onClick={() => setIsFullScreen(!isFullScreen)}
                    className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                >
                    {isFullScreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
                </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 && (
                    <div className="text-center py-12">
                        <div
                            className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center"
                            style={{ backgroundColor: theme.primaryColor + "20" }}
                        >
                            <Bot className="w-8 h-8" style={{ color: theme.primaryColor }} />
                        </div>
                        <p className="text-zinc-300 text-lg mb-2">{theme.welcomeMessage}</p>
                        <p className="text-zinc-500 text-sm">Ask me anything!</p>
                    </div>
                )}
                {messages.map((msg, i) => (
                    <div
                        key={i}
                        className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                        {msg.role === "assistant" && (
                            <div
                                className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                                style={{ backgroundColor: theme.primaryColor + "20" }}
                            >
                                <Bot className="w-4 h-4" style={{ color: theme.primaryColor }} />
                            </div>
                        )}
                        <div
                            className={`max-w-[80%] px-4 py-3 rounded-2xl ${msg.role === "user"
                                ? "text-white"
                                : "bg-zinc-800 text-zinc-200"
                                }`}
                            style={msg.role === "user" ? { backgroundColor: theme.primaryColor } : undefined}
                        >
                            <MessageRenderer content={msg.content} role={msg.role} />
                        </div>
                        {msg.role === "user" && (
                            <div className="w-8 h-8 rounded-full bg-zinc-700 flex items-center justify-center flex-shrink-0">
                                <User className="w-4 h-4 text-zinc-300" />
                            </div>
                        )}
                    </div>
                ))}
                {loading && (
                    <div className="flex gap-3">
                        <div
                            className="w-8 h-8 rounded-full flex items-center justify-center"
                            style={{ backgroundColor: theme.primaryColor + "20" }}
                        >
                            <Bot className="w-4 h-4" style={{ color: theme.primaryColor }} />
                        </div>
                        <div className="bg-zinc-800 px-4 py-3 rounded-2xl">
                            <div className="flex gap-1">
                                <span className="w-2 h-2 bg-zinc-500 rounded-full animate-bounce" />
                                <span
                                    className="w-2 h-2 bg-zinc-500 rounded-full animate-bounce"
                                    style={{ animationDelay: "0.1s" }}
                                />
                                <span
                                    className="w-2 h-2 bg-zinc-500 rounded-full animate-bounce"
                                    style={{ animationDelay: "0.2s" }}
                                />
                            </div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form onSubmit={sendMessage} className="p-4 border-t border-zinc-800">
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Type a message..."
                        className="flex-1 px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-full text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:border-transparent"
                        style={{ "--tw-ring-color": theme.primaryColor } as React.CSSProperties}
                    />
                    <button
                        type="submit"
                        disabled={!input.trim() || loading}
                        className="p-3 text-white rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        style={{ backgroundColor: theme.primaryColor }}
                    >
                        <Send className="w-5 h-5" />
                    </button>
                </div>
            </form>
        </div>
    );
}
