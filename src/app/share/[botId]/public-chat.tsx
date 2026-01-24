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
  theme: any;
}

export function PublicChat({ botId, botName, theme }: PublicChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [previewTheme, setPreviewTheme] = useState(theme);

  // Helper to notify parent of clicks (for Design Tab "Click to Edit")
  const notifyClick = (section: string) => {
    if (typeof window !== 'undefined' && window.parent && window.parent !== window) {
      window.parent.postMessage({ type: 'BOTX_ELEMENT_CLICK', section }, '*');
    }
  };

  // Listen for live preview updates (from postMessage)
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (typeof event.data === 'object' && event.data.type === 'BOTX_THEME_UPDATE') {
        setPreviewTheme(event.data.theme);
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // Use previewTheme for rendering
  const currentTheme = previewTheme || theme;

  // Fallbacks
  const headerBg = currentTheme.header?.bgColor || currentTheme.primaryColor || "#8b5cf6";
  const headerText = currentTheme.header?.textColor || "#ffffff";
  const userBg = currentTheme.userMessage?.bgColor || currentTheme.primaryColor || "#3b82f6";
  const userText = currentTheme.userMessage?.textColor || "#ffffff";
  const botBg = currentTheme.botMessage?.bgColor || "#f3f4f6";
  const botText = currentTheme.botMessage?.textColor || "#1f2937";
  const radius = currentTheme.common?.borderRadius || "0.75rem";
  const fontFamily = currentTheme.common?.fontFamily || "Inter, sans-serif";
  const chatTitle = currentTheme.header?.title || currentTheme.chatTitle || botName;
  const welcomeMessage = currentTheme.welcomeMessage;
  const showBotAvatar = currentTheme.botMessage?.showAvatar ?? true;
  const showUserAvatar = currentTheme.userMessage?.showAvatar ?? false;

  // New Styles
  const chatBg = currentTheme.chatWindow?.backgroundColor || "#ffffff";
  const footerBg = currentTheme.chatWindow?.footerBackgroundColor || "#ffffff";

  const inputBg = currentTheme.inputArea?.backgroundColor || "#ffffff";
  const inputText = currentTheme.inputArea?.textColor || "#000000";
  const inputFont = currentTheme.inputArea?.font;

  const sendBtnBg = currentTheme.sendButton?.backgroundColor || headerBg;
  const sendBtnIconColor = currentTheme.sendButton?.iconColor || "#ffffff";
  const sendBtnIcon = currentTheme.sendButton?.icon;

  const headerTitleFont = currentTheme.header?.titleFont;
  const headerIcon = currentTheme.header?.icon;
  const headerIconColor = currentTheme.header?.iconColor;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput("");
    const newMessages = [
      ...messages,
      { role: "user" as const, content: userMessage },
    ];
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
        setMessages([
          ...newMessages,
          { role: "assistant", content: data.message },
        ]);
      } else {
        const error = await res.json();
        setMessages([
          ...newMessages,
          {
            role: "assistant",
            content: `Sorry, I encountered an error: ${error.error}`,
          },
        ]);
      }
    } catch {
      setMessages([
        ...newMessages,
        {
          role: "assistant",
          content: "Sorry, I'm having trouble connecting right now.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className={`flex flex-col ${isFullScreen
        ? "h-screen"
        : "h-[600px] max-w-lg mx-auto mt-8 rounded-2xl shadow-2xl"
        } bg-white dark:bg-zinc-900 overflow-hidden`}
      style={{ fontFamily }}
    >
      {/* Header */}
      <div
        onClick={() => notifyClick('header')}
        className="flex items-center justify-between px-4 py-3 shrink-0 cursor-pointer"
        style={{ backgroundColor: headerBg, color: headerText }}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
            {headerIcon ? (
              <div dangerouslySetInnerHTML={{ __html: headerIcon }} style={{ color: headerIconColor || 'inherit', width: '20px', height: '20px' }} />
            ) : (
              <Bot className="w-5 h-5 text-current" style={{ color: headerIconColor || 'inherit' }} />
            )}
          </div>
          <div>
            <h1 className="font-semibold text-sm" style={{
              fontSize: headerTitleFont?.size,
              fontWeight: headerTitleFont?.weight,
              fontFamily: headerTitleFont?.family
            }}>
              {chatTitle}
            </h1>
            <p className="text-xs opacity-70">Powered by Botx</p>
          </div>
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); setIsFullScreen(!isFullScreen); }}
          className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          style={{ color: headerText }}
        >
          {isFullScreen ? (
            <Minimize2 className="w-5 h-5" />
          ) : (
            <Maximize2 className="w-5 h-5" />
          )}
        </button>
      </div>

      {/* Messages */}
      <div
        className="flex-1 overflow-y-auto p-4 space-y-4 bg-zinc-50 dark:bg-zinc-950/50 cursor-pointer"
        onClick={() => notifyClick('chatWindow')} // Updated to 'chatWindow' or 'common'
        style={{ backgroundColor: chatBg }}
      >
        {messages.length === 0 && (
          <div className="text-center py-12" onClick={(e) => { e.stopPropagation(); notifyClick('botMessage'); }}>
            <div
              className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center"
              style={{ backgroundColor: botBg, color: botText }}
            >
              <Bot className="w-8 h-8" />
            </div>
            <p className="text-zinc-800 dark:text-zinc-300 text-lg mb-2">{welcomeMessage}</p>
            <p className="text-zinc-500 text-sm">Ask me anything!</p>
          </div>
        )}
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"
              }`}
            onClick={(e) => { e.stopPropagation(); notifyClick(msg.role === 'user' ? 'userMessage' : 'botMessage'); }}
          >
            {msg.role === "assistant" && showBotAvatar && (
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: botBg, color: botText }}
              >
                <Bot className="w-4 h-4" />
              </div>
            )}
            <div
              className={`max-w-[80%] px-4 py-3 shadow-sm ${msg.role === "user" ? "" : "border border-zinc-200 dark:border-zinc-700"
                }`}
              style={{
                backgroundColor: msg.role === "user" ? userBg : botBg,
                color: msg.role === "user" ? userText : botText,
                borderRadius: msg.role === 'user' ? (currentTheme.userMessage?.borderRadius || `${radius} 0 ${radius} ${radius}`) : (currentTheme.botMessage?.borderRadius || `0 ${radius} ${radius} ${radius}`),
                fontSize: msg.role === 'user' ? currentTheme.userMessage?.font?.size : currentTheme.botMessage?.font?.size,
                fontWeight: msg.role === 'user' ? currentTheme.userMessage?.font?.weight : currentTheme.botMessage?.font?.weight,
              }}
            >
              <MessageRenderer content={msg.content} role={msg.role} />
            </div>
            {msg.role === "user" && showUserAvatar && (
              <div className="w-8 h-8 rounded-full bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center flex-shrink-0">
                <User className="w-4 h-4 text-zinc-500 dark:text-zinc-300" />
              </div>
            )}
          </div>
        ))}
        {loading && (
          <div className="flex gap-3" onClick={(e) => { e.stopPropagation(); notifyClick('botMessage'); }}>
            {showBotAvatar && (
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{ backgroundColor: botBg, color: botText }}
              >
                <Bot className="w-4 h-4" />
              </div>
            )}
            <div className="bg-zinc-100 dark:bg-zinc-800 px-4 py-3 rounded-2xl border border-zinc-200 dark:border-zinc-700">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce" />
                <span
                  className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce"
                  style={{ animationDelay: "0.1s" }}
                />
                <span
                  className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce"
                  style={{ animationDelay: "0.2s" }}
                />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form
        onSubmit={sendMessage}
        onClick={() => notifyClick('inputArea')}
        className="p-4 border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 cursor-pointer"
        style={{ backgroundColor: footerBg }}
      >
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 px-4 py-3 bg-zinc-100 dark:bg-zinc-800 border-0 rounded-full text-zinc-900 dark:text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:border-transparent"
            style={
              {
                "--tw-ring-color": headerBg,
                backgroundColor: inputBg,
                color: inputText,
                fontSize: inputFont?.size,
                fontWeight: inputFont?.weight
              } as React.CSSProperties
            }
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="p-3 text-white rounded-full transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed shadow-md flex items-center justify-center"
            style={{ backgroundColor: sendBtnBg, color: sendBtnIconColor }}
            onClick={(e) => { e.stopPropagation(); notifyClick('sendButton'); }}
          >
            {sendBtnIcon ? (
              <div dangerouslySetInnerHTML={{ __html: sendBtnIcon }} style={{ width: '20px', height: '20px', fill: 'currentcolor' }} />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
