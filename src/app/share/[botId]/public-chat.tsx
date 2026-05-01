"use client";

import { useState, useRef, useEffect, useMemo, type CSSProperties } from "react";
import { useSearchParams } from "next/navigation";
import { Send, Bot, User, RefreshCw } from "lucide-react";
import { MessageRenderer } from "@/components/message-renderer";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface PublicChatProps {
  botId: string;
  botName: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  theme: any;
}

const CONVO_KEY_PREFIX = "buildx_convo_";

function generateConversationId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `c_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * Build the design-token object (CSS variables) for the chat root.
 * Every visible element in the widget references one of these vars rather than a
 * hardcoded value, so themes (and Phase 3 customCSS) can override anything by
 * setting the matching CSS variable on `[data-bx-root]`.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildTokens(theme: any): CSSProperties {
  const radius = theme?.common?.borderRadius ?? "0.75rem";
  const shadow = theme?.common?.shadow ?? "0 4px 6px -1px rgb(0 0 0 / 0.1)";
  const fontFamily = theme?.common?.fontFamily ?? "Inter, sans-serif";
  const headerBg = theme?.header?.bgColor ?? theme?.primaryColor ?? "#8b5cf6";
  const headerText = theme?.header?.textColor ?? "#ffffff";
  const userBg = theme?.userMessage?.bgColor ?? theme?.primaryColor ?? "#3b82f6";
  const userText = theme?.userMessage?.textColor ?? "#ffffff";
  const botBg = theme?.botMessage?.bgColor ?? "#f3f4f6";
  const botText = theme?.botMessage?.textColor ?? "#1f2937";

  return {
    // Common
    "--bx-font": fontFamily,
    "--bx-radius": radius,
    "--bx-shadow": shadow,

    // Window
    "--bx-window-bg": theme?.chatWindow?.backgroundColor ?? "#ffffff",
    "--bx-window-footer-bg": theme?.chatWindow?.footerBackgroundColor ?? "#ffffff",

    // Header
    "--bx-header-bg": headerBg,
    "--bx-header-text": headerText,
    "--bx-header-padding": theme?.header?.padding ?? "12px 16px",
    "--bx-header-icon-bg": theme?.header?.iconBgColor ?? "rgba(255,255,255,0.2)",
    "--bx-header-icon-color": theme?.header?.iconColor ?? "currentColor",
    "--bx-header-icon-size": theme?.header?.iconSize ?? "20px",
    "--bx-header-subtitle-color": theme?.header?.subtitleColor ?? "rgba(255,255,255,0.7)",
    "--bx-header-refresh-color": theme?.header?.refreshIconColor ?? headerText,

    // Bot message
    "--bx-bubble-bot-bg": botBg,
    "--bx-bubble-bot-text": botText,
    "--bx-bubble-bot-border": theme?.botMessage?.borderColor ?? "rgba(0,0,0,0.06)",
    "--bx-bubble-bot-border-width": theme?.botMessage?.borderWidth ?? "1px",
    "--bx-bubble-bot-shadow": theme?.botMessage?.shadow ?? "0 1px 2px 0 rgb(0 0 0 / 0.05)",
    "--bx-bubble-bot-padding": theme?.botMessage?.padding ?? "12px 16px",

    // User message
    "--bx-bubble-user-bg": userBg,
    "--bx-bubble-user-text": userText,
    "--bx-bubble-user-border": theme?.userMessage?.borderColor ?? "transparent",
    "--bx-bubble-user-border-width": theme?.userMessage?.borderWidth ?? "0",
    "--bx-bubble-user-shadow": theme?.userMessage?.shadow ?? "0 1px 2px 0 rgb(0 0 0 / 0.05)",
    "--bx-bubble-user-padding": theme?.userMessage?.padding ?? "12px 16px",

    // Avatars
    "--bx-avatar-bot-bg": theme?.botMessage?.avatarBgColor ?? botBg,
    "--bx-avatar-bot-color": theme?.botMessage?.avatarColor ?? botText,
    "--bx-avatar-user-bg": theme?.userMessage?.avatarBgColor ?? "#e4e4e7",
    "--bx-avatar-user-color": theme?.userMessage?.avatarColor ?? "#52525b",
    "--bx-avatar-bot-size": theme?.botMessage?.avatarSize ?? "32px",
    "--bx-avatar-user-size": theme?.userMessage?.avatarSize ?? "32px",

    // Empty-state ("chat area") icon — uses bot bubble look unless overridden
    "--bx-empty-icon-bg": theme?.chatWindow?.emptyStateIconBgColor ?? botBg,
    "--bx-empty-icon-color": theme?.chatWindow?.emptyStateIconColor ?? botText,
    "--bx-empty-subtitle-color": "rgb(113 113 122)",

    // Loading dots
    "--bx-loading-dot": theme?.chatWindow?.loadingDotColor ?? "#a1a1aa",
    "--bx-loading-bubble-bg": theme?.chatWindow?.typingBubbleBg ?? "#f4f4f5",
    "--bx-loading-bubble-border":
      theme?.chatWindow?.typingBubbleBorder ?? "rgba(0,0,0,0.06)",

    // Input — radius falls back to the global common.borderRadius if not overridden,
    // so Global Settings → Corner Radius actually feels global.
    "--bx-input-bg": theme?.inputArea?.backgroundColor ?? "#f4f4f5",
    "--bx-input-text": theme?.inputArea?.textColor ?? "#000000",
    "--bx-input-placeholder": theme?.inputArea?.placeholderColor ?? "#a1a1aa",
    "--bx-input-border": theme?.inputArea?.borderColor ?? "transparent",
    "--bx-input-radius": theme?.inputArea?.borderRadius ?? "9999px",
    "--bx-input-padding": theme?.inputArea?.padding ?? "12px 16px",
    // Standalone-mode card radius — also sourced from common.
    "--bx-card-radius": radius,

    // Send button
    "--bx-send-bg": theme?.sendButton?.backgroundColor ?? headerBg,
    "--bx-send-color": theme?.sendButton?.iconColor ?? "#ffffff",
    "--bx-send-radius": theme?.sendButton?.borderRadius ?? "9999px",
    "--bx-send-size": theme?.sendButton?.size ?? "44px",

    // Roots
    fontFamily: "var(--bx-font)",
  } as CSSProperties;
}

/**
 * Pick the right border-radius for a bubble. Asymmetric mode uses a
 * "tail corner" (the corner closest to the avatar is sharper). Symmetric mode
 * just rounds all four corners equally to the common radius.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function bubbleRadius(role: "user" | "assistant", theme: any): string {
  const radius = theme?.common?.borderRadius ?? "0.75rem";
  const cfg = role === "user" ? theme?.userMessage : theme?.botMessage;
  // explicit override always wins
  if (cfg?.borderRadius) return cfg.borderRadius;
  const style: "symmetric" | "asymmetric" = cfg?.cornerStyle ?? "asymmetric";
  if (style === "symmetric") return radius;
  return role === "user"
    ? `${radius} ${radius} 0 ${radius}`
    : `${radius} ${radius} ${radius} 0`;
}

export function PublicChat({ botId, botName, theme }: PublicChatProps) {
  const searchParams = useSearchParams();
  const embedded = searchParams.get("embed") === "true";

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string>("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [previewTheme, setPreviewTheme] = useState(theme);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const key = CONVO_KEY_PREFIX + botId;
    let id = window.localStorage.getItem(key);
    if (!id) {
      id = generateConversationId();
      window.localStorage.setItem(key, id);
    }
    setConversationId(id);
  }, [botId]);

  function startNewConversation() {
    if (loading) return;
    if (typeof window !== "undefined") {
      const key = CONVO_KEY_PREFIX + botId;
      const id = generateConversationId();
      window.localStorage.setItem(key, id);
      setConversationId(id);
    }
    setMessages([]);
    setInput("");
  }

  // Notify parent (DesignTab) of element clicks for click-to-edit.
  const notifyClick = (section: string) => {
    if (typeof window !== "undefined" && window.parent && window.parent !== window) {
      window.parent.postMessage({ type: "BUILDX_ELEMENT_CLICK", section }, "*");
    }
  };

  // Live theme preview from the design studio.
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (typeof event.data === "object" && event.data.type === "BUILDX_THEME_UPDATE") {
        setPreviewTheme(event.data.theme);
      }
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  const currentTheme = previewTheme || theme;
  const tokens = useMemo(() => buildTokens(currentTheme), [currentTheme]);

  // Read element-level toggles (default = show)
  const showRefresh = currentTheme?.elements?.refreshButton?.show !== false;
  const showBranding =
    currentTheme?.elements?.branding?.show !== false && currentTheme?.showBranding !== false;
  const showWelcomeSubtitle = currentTheme?.elements?.welcomeSubtitle?.show !== false;
  const showEmptyIcon = currentTheme?.elements?.emptyStateIcon?.show !== false;

  const chatTitle = currentTheme?.header?.title || currentTheme?.chatTitle || botName;
  const headerSubtitle = currentTheme?.header?.subtitle ?? "Powered by Buildx";
  const welcomeMessage = currentTheme?.welcomeMessage;
  const welcomeSubtitle = currentTheme?.chatWindow?.welcomeSubtitle ?? "Ask me anything!";
  const placeholderText = currentTheme?.inputArea?.placeholderText ?? "Type a message...";

  const showBotAvatar = currentTheme?.botMessage?.showAvatar ?? true;
  const showUserAvatar = currentTheme?.userMessage?.showAvatar ?? false;

  const headerIcon = currentTheme?.header?.icon;
  const sendBtnIcon = currentTheme?.sendButton?.icon;
  const headerTitleFont = currentTheme?.header?.titleFont;
  const inputFont = currentTheme?.inputArea?.font;

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
          conversationId,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setMessages([...newMessages, { role: "assistant", content: data.message }]);
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
        { role: "assistant", content: "Sorry, I'm having trouble connecting right now." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  const containerClass = embedded
    ? "flex flex-col h-screen overflow-hidden"
    : "flex flex-col w-full max-w-md h-[min(720px,calc(100vh-3rem))] mx-auto shadow-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800";

  return (
    <div
      data-bx-root
      className={containerClass}
      style={{
        ...tokens,
        background: "var(--bx-window-bg)",
        // Standalone card uses common.borderRadius; embedded mode lets the iframe own corner-rounding.
        ...(embedded ? {} : { borderRadius: "var(--bx-card-radius)" }),
      }}
    >
      {/* Scoped <style> for the input placeholder (not reachable via inline style). */}
      <style>{`
        [data-bx-root] [data-bx-element="input"]::placeholder {
          color: var(--bx-input-placeholder);
        }
      `}</style>

      {/* Header */}
      <div
        data-bx-element="header"
        onClick={() => notifyClick("header")}
        className="flex items-center justify-between shrink-0 cursor-pointer"
        style={{
          background: "var(--bx-header-bg)",
          color: "var(--bx-header-text)",
          padding: "var(--bx-header-padding)",
        }}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div
            data-bx-element="header-icon"
            className="w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-sm shrink-0"
            style={{
              background: "var(--bx-header-icon-bg)",
              color: "var(--bx-header-icon-color)",
            }}
          >
            {headerIcon ? (
              <div
                dangerouslySetInnerHTML={{ __html: headerIcon }}
                style={{
                  width: "var(--bx-header-icon-size)",
                  height: "var(--bx-header-icon-size)",
                }}
              />
            ) : (
              <Bot
                style={{
                  width: "var(--bx-header-icon-size)",
                  height: "var(--bx-header-icon-size)",
                }}
              />
            )}
          </div>
          <div className="min-w-0">
            <h1
              data-bx-element="header-title"
              className="font-semibold text-sm truncate"
              style={{
                fontSize: headerTitleFont?.size,
                fontWeight: headerTitleFont?.weight,
                fontFamily: headerTitleFont?.family,
              }}
            >
              {chatTitle}
            </h1>
            {showBranding && (
              <p
                data-bx-element="header-subtitle"
                className="text-xs truncate"
                style={{
                  color: "var(--bx-header-subtitle-color)",
                  fontSize: currentTheme?.header?.subtitleFont?.size,
                  fontWeight: currentTheme?.header?.subtitleFont?.weight,
                  fontFamily: currentTheme?.header?.subtitleFont?.family,
                }}
              >
                {headerSubtitle}
              </p>
            )}
          </div>
        </div>
        {showRefresh && (
          <button
            data-bx-element="header-button"
            onClick={(e) => {
              e.stopPropagation();
              startNewConversation();
            }}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors disabled:opacity-50"
            style={{ color: "var(--bx-header-refresh-color)" }}
            title="Start new conversation"
            disabled={loading}
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Messages */}
      <div
        data-bx-element="messages"
        className="flex-1 overflow-y-auto p-4 space-y-4 cursor-pointer"
        onClick={() => notifyClick("chatWindow")}
        style={{ background: "var(--bx-window-bg)" }}
      >
        {messages.length === 0 && (
          <div
            data-bx-element="empty-state"
            className="text-center py-12"
            onClick={(e) => {
              e.stopPropagation();
              notifyClick("botMessage");
            }}
          >
            {showEmptyIcon && (
              <div
                data-bx-element="empty-icon"
                className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center"
                style={{
                  background: "var(--bx-empty-icon-bg)",
                  color: "var(--bx-empty-icon-color)",
                }}
              >
                {currentTheme?.chatWindow?.emptyStateIcon ? (
                  <div
                    dangerouslySetInnerHTML={{
                      __html: currentTheme.chatWindow.emptyStateIcon,
                    }}
                    style={{ width: "32px", height: "32px" }}
                  />
                ) : (
                  <Bot className="w-8 h-8" />
                )}
              </div>
            )}
            {welcomeMessage && (
              <p
                data-bx-element="empty-title"
                className="text-lg mb-2"
                style={{ color: "var(--bx-bubble-bot-text)" }}
              >
                {welcomeMessage}
              </p>
            )}
            {showWelcomeSubtitle && (
              <p
                data-bx-element="empty-subtitle"
                className="text-sm"
                style={{ color: "var(--bx-empty-subtitle-color)" }}
              >
                {welcomeSubtitle}
              </p>
            )}
          </div>
        )}
        {messages.map((msg, i) => (
          <div
            key={i}
            data-bx-element="message-row"
            data-bx-role={msg.role}
            className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            onClick={(e) => {
              e.stopPropagation();
              notifyClick(msg.role === "user" ? "userMessage" : "botMessage");
            }}
          >
            {msg.role === "assistant" && showBotAvatar && (
              <div
                data-bx-element="avatar-bot"
                className="rounded-full flex items-center justify-center flex-shrink-0"
                style={{
                  width: "var(--bx-avatar-bot-size)",
                  height: "var(--bx-avatar-bot-size)",
                  background: "var(--bx-avatar-bot-bg)",
                  color: "var(--bx-avatar-bot-color)",
                }}
              >
                {currentTheme?.botMessage?.avatarIcon ? (
                  <div
                    dangerouslySetInnerHTML={{ __html: currentTheme.botMessage.avatarIcon }}
                    style={{ width: "16px", height: "16px" }}
                  />
                ) : (
                  <Bot className="w-4 h-4" />
                )}
              </div>
            )}
            <div
              data-bx-element={msg.role === "user" ? "bubble-user" : "bubble-bot"}
              className="max-w-[80%]"
              style={{
                background:
                  msg.role === "user"
                    ? "var(--bx-bubble-user-bg)"
                    : "var(--bx-bubble-bot-bg)",
                color:
                  msg.role === "user"
                    ? "var(--bx-bubble-user-text)"
                    : "var(--bx-bubble-bot-text)",
                borderColor:
                  msg.role === "user"
                    ? "var(--bx-bubble-user-border)"
                    : "var(--bx-bubble-bot-border)",
                borderWidth:
                  msg.role === "user"
                    ? "var(--bx-bubble-user-border-width)"
                    : "var(--bx-bubble-bot-border-width)",
                borderStyle: "solid",
                boxShadow:
                  msg.role === "user"
                    ? "var(--bx-bubble-user-shadow)"
                    : "var(--bx-bubble-bot-shadow)",
                padding:
                  msg.role === "user"
                    ? "var(--bx-bubble-user-padding)"
                    : "var(--bx-bubble-bot-padding)",
                borderRadius: bubbleRadius(msg.role, currentTheme),
                fontSize:
                  msg.role === "user"
                    ? currentTheme?.userMessage?.font?.size
                    : currentTheme?.botMessage?.font?.size,
                fontWeight:
                  msg.role === "user"
                    ? currentTheme?.userMessage?.font?.weight
                    : currentTheme?.botMessage?.font?.weight,
              }}
            >
              <MessageRenderer content={msg.content} role={msg.role} />
            </div>
            {msg.role === "user" && showUserAvatar && (
              <div
                data-bx-element="avatar-user"
                className="rounded-full flex items-center justify-center flex-shrink-0"
                style={{
                  width: "var(--bx-avatar-user-size)",
                  height: "var(--bx-avatar-user-size)",
                  background: "var(--bx-avatar-user-bg)",
                  color: "var(--bx-avatar-user-color)",
                }}
              >
                {currentTheme?.userMessage?.avatarIcon ? (
                  <div
                    dangerouslySetInnerHTML={{ __html: currentTheme.userMessage.avatarIcon }}
                    style={{ width: "16px", height: "16px" }}
                  />
                ) : (
                  <User className="w-4 h-4" />
                )}
              </div>
            )}
          </div>
        ))}
        {loading && (
          <div
            data-bx-element="typing"
            className="flex gap-3"
            onClick={(e) => {
              e.stopPropagation();
              notifyClick("botMessage");
            }}
          >
            {showBotAvatar && (
              <div
                data-bx-element="avatar-bot"
                className="rounded-full flex items-center justify-center"
                style={{
                  width: "var(--bx-avatar-bot-size)",
                  height: "var(--bx-avatar-bot-size)",
                  background: "var(--bx-avatar-bot-bg)",
                  color: "var(--bx-avatar-bot-color)",
                }}
              >
                <Bot className="w-4 h-4" />
              </div>
            )}
            <div
              className="px-4 py-3 rounded-2xl"
              style={{
                background: "var(--bx-loading-bubble-bg)",
                borderColor: "var(--bx-loading-bubble-border)",
                borderWidth: "1px",
                borderStyle: "solid",
              }}
            >
              <div className="flex gap-1">
                <span
                  data-bx-element="typing-dot"
                  className="w-2 h-2 rounded-full animate-bounce"
                  style={{ background: "var(--bx-loading-dot)" }}
                />
                <span
                  data-bx-element="typing-dot"
                  className="w-2 h-2 rounded-full animate-bounce"
                  style={{ background: "var(--bx-loading-dot)", animationDelay: "0.1s" }}
                />
                <span
                  data-bx-element="typing-dot"
                  className="w-2 h-2 rounded-full animate-bounce"
                  style={{ background: "var(--bx-loading-dot)", animationDelay: "0.2s" }}
                />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form
        data-bx-element="input-form"
        onSubmit={sendMessage}
        onClick={() => notifyClick("inputArea")}
        className="border-t cursor-pointer"
        style={{
          background: "var(--bx-window-footer-bg)",
          borderColor: "var(--bx-bubble-bot-border)",
          padding: "16px",
        }}
      >
        <div className="flex gap-2">
          <input
            data-bx-element="input"
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={placeholderText}
            className="flex-1 border-0 focus:outline-none focus:ring-2"
            style={
              {
                "--tw-ring-color": "var(--bx-header-bg)",
                background: "var(--bx-input-bg)",
                color: "var(--bx-input-text)",
                borderRadius: "var(--bx-input-radius)",
                padding: "var(--bx-input-padding)",
                fontSize: inputFont?.size,
                fontWeight: inputFont?.weight,
              } as CSSProperties
            }
          />
          <button
            data-bx-element="send-button"
            type="submit"
            disabled={!input.trim() || loading}
            className="text-white transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed shadow-md flex items-center justify-center"
            style={{
              width: "var(--bx-send-size)",
              height: "var(--bx-send-size)",
              background: "var(--bx-send-bg)",
              color: "var(--bx-send-color)",
              borderRadius: "var(--bx-send-radius)",
            }}
            onClick={(e) => {
              e.stopPropagation();
              notifyClick("sendButton");
            }}
          >
            {sendBtnIcon ? (
              <div
                dangerouslySetInnerHTML={{ __html: sendBtnIcon }}
                style={{ width: "20px", height: "20px", fill: "currentcolor" }}
              />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
