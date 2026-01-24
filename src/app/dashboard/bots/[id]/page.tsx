"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Save,
  Loader2,
  Bot,
  Brain,
  Code,
  Terminal,
  Check,
  Copy,
  Globe,
  Layout,
  Power,
  Upload,
  FileText,
  Trash2,
  Moon,
  Sun,
  User,
  Plus,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import { DesignTab } from "@/components/dashboard/bot-editor/design-tab";
import { SecurityTab } from "@/components/dashboard/bot-editor/security-tab";

interface BotData {
  _id: string;
  name: string;
  systemPrompt: string;
  aiModel: string;
  temperature: number;
  publicId: string;
  allowedDomains: string[];
  widgetPosition: "bottom-right" | "bottom-left" | "top-right" | "top-left";
  isActive: boolean;
  theme: {
    launcher: {
      bgColor: string;
      iconColor: string;
      icon?: string;
      closeIcon?: string;
      borderRadius?: string;
    };
    header: {
      bgColor: string;
      textColor: string;
      title: string;
      titleFont?: { size?: string; weight?: string; family?: string };
      icon?: string;
      iconColor?: string;
      iconBgColor?: string;
    };
    chatWindow?: {
      backgroundColor?: string;
      footerBackgroundColor?: string;
      backgroundImage?: string;
    };
    userMessage: {
      bgColor: string;
      textColor: string;
      showAvatar: boolean;
      avatarIcon?: string;
      borderRadius?: string;
      font?: { size?: string; weight?: string; family?: string };
    };
    botMessage: {
      bgColor: string;
      textColor: string;
      showAvatar: boolean;
      avatarIcon?: string;
      borderRadius?: string;
      font?: { size?: string; weight?: string; family?: string };
    };
    inputArea?: {
      backgroundColor?: string;
      textColor?: string;
      placeholderColor?: string;
      font?: { size?: string; weight?: string; family?: string };
    };
    sendButton?: {
      backgroundColor?: string;
      iconColor?: string;
      icon?: string;
    };
    common: {
      fontFamily: string;
      borderRadius: string;
      shadow: string;
    };
    showBranding: boolean;
    welcomeMessage?: string;
    welcomeMessageStyle?: {
      color?: string;
      fontSize?: string;
      fontWeight?: string;
      fontFamily?: string;
    };
    // Legacy mapping helpers
    primaryColor?: string;
    chatTitle?: string;
  };
}

interface KnowledgeDoc {
  _id: string;
  sourceName: string;
  sourceType: string;
  metadata: {
    charCount: number;
    chunkCount: number;
  };
  createdAt: string;
}

const AI_MODELS = [
  { id: "gemini-2.0-flash", name: "Gemini 2.0 Flash" },
  { id: "gemini-1.5-pro", name: "Gemini 1.5 Pro" },
  { id: "gemini-1.5-flash", name: "Gemini 1.5 Flash" },
];

const THEME_COLORS = [
  "#8b5cf6", // Violet
  "#6366f1", // Indigo
  "#3b82f6", // Blue
  "#06b6d4", // Cyan
  "#10b981", // Emerald
  "#f59e0b", // Amber
  "#ef4444", // Red
  "#ec4899", // Pink
];

const WIDGET_POSITIONS = [
  { id: "bottom-right", label: "Bottom Right" },
  { id: "bottom-left", label: "Bottom Left" },
  { id: "top-right", label: "Top Right" },
  { id: "top-left", label: "Top Left" },
];

export default function BotEditorPage() {
  const params = useParams();
  const router = useRouter();
  const [bot, setBot] = useState<BotData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "prompt" | "model" | "knowledge" | "design" | "security"
  >("prompt");
  const [copied, setCopied] = useState(false);
  const [newDomain, setNewDomain] = useState("");

  // Knowledge State
  const [knowledge, setKnowledge] = useState<KnowledgeDoc[]>([]);
  const [knowledgeLoading, setKnowledgeLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Fetch Bot Data
  useEffect(() => {
    async function fetchBot() {
      try {
        const res = await fetch(`/api/bots/${params.id}`);
        if (!res.ok) throw new Error("Bot not found");
        const data = await res.json();

        // Ensure array/defaults exist
        const botData = data.bot;
        if (!botData.allowedDomains) botData.allowedDomains = [];
        if (!botData.widgetPosition) botData.widgetPosition = "bottom-right";
        // Ensure defaults exist for theme properties
        if (!botData.theme) botData.theme = {};

        // Initialize Granular Theme (Migrate from legacy if needed)
        const primary = botData.theme.primaryColor || "#8b5cf6";
        const title = botData.theme.chatTitle || botData.name || "Chat with us";
        const welcome = botData.theme.welcomeMessage || "Hello! How can I help you?";

        botData.theme = {
          // Preserve all existing theme properties first
          ...botData.theme,
          launcher: {
            bgColor: botData.theme.launcher?.bgColor || primary,
            iconColor: botData.theme.launcher?.iconColor || "#ffffff",
            icon: botData.theme.launcher?.icon,
            closeIcon: botData.theme.launcher?.closeIcon,
            borderRadius: botData.theme.launcher?.borderRadius,
            ...botData.theme.launcher,
          },
          header: {
            bgColor: botData.theme.header?.bgColor || primary,
            textColor: botData.theme.header?.textColor || "#ffffff",
            title: botData.theme.header?.title || title,
            ...botData.theme.header,
          },
          chatWindow: {
            backgroundColor: botData.theme.chatWindow?.backgroundColor,
            footerBackgroundColor: botData.theme.chatWindow?.footerBackgroundColor,
            backgroundImage: botData.theme.chatWindow?.backgroundImage,
            ...botData.theme.chatWindow,
          },
          userMessage: {
            bgColor: botData.theme.userMessage?.bgColor || "#3b82f6",
            textColor: botData.theme.userMessage?.textColor || "#ffffff",
            showAvatar: botData.theme.userMessage?.showAvatar ?? false,
            ...botData.theme.userMessage,
          },
          botMessage: {
            bgColor: botData.theme.botMessage?.bgColor || "#f3f4f6",
            textColor: botData.theme.botMessage?.textColor || "#1f2937",
            showAvatar: botData.theme.botMessage?.showAvatar ?? true,
            ...botData.theme.botMessage,
          },
          inputArea: {
            ...botData.theme.inputArea,
          },
          sendButton: {
            ...botData.theme.sendButton,
          },
          common: {
            fontFamily: botData.theme.common?.fontFamily || "Inter, sans-serif",
            borderRadius: botData.theme.common?.borderRadius || "0.75rem",
            shadow: botData.theme.common?.shadow || "0 4px 6px -1px rgb(0 0 0 / 0.1)",
            ...botData.theme.common,
          },
          showBranding: botData.theme.showBranding ?? true,
          welcomeMessage: welcome,
          welcomeMessageStyle: botData.theme.welcomeMessageStyle,
          // Keep legacy for now
          primaryColor: primary,
          chatTitle: title
        };

        setBot(botData);
      } catch (error) {
        console.error(error);
        router.push("/dashboard/bots");
      } finally {
        setLoading(false);
      }
    }
    fetchBot();
  }, [params.id, router]);

  // Fetch Knowledge
  useEffect(() => {
    if (activeTab === "knowledge" && bot) {
      fetchKnowledge();
    }
  }, [activeTab, bot?._id]);

  async function fetchKnowledge() {
    if (!bot) return;
    setKnowledgeLoading(true);
    try {
      const res = await fetch(`/api/bots/${bot._id}/knowledge`);
      if (res.ok) {
        const data = await res.json();
        setKnowledge(data.documents || []);
      }
    } catch (error) {
      console.error("Failed to fetch knowledge", error);
    } finally {
      setKnowledgeLoading(false);
    }
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files || !e.target.files[0] || !bot) return;

    const file = e.target.files[0];
    if (file.size > 10 * 1024 * 1024) {
      alert("File size too large (Max 10MB)");
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch(`/api/bots/${bot._id}/knowledge`, {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        await fetchKnowledge();
      } else {
        const err = await res.json();
        alert(err.error || "Upload failed");
      }
    } catch (error) {
      console.error("Upload error", error);
      alert("Upload failed");
    } finally {
      setUploading(false);
      // Reset input
      e.target.value = "";
    }
  }

  async function handleDeleteKnowledge(docId: string) {
    if (!bot) return;
    const confirmed = window.confirm(
      "Are you sure you want to delete this document?"
    );
    if (!confirmed) return;

    try {
      const res = await fetch(`/api/bots/${bot._id}/knowledge/${docId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setKnowledge(knowledge.filter((k) => k._id !== docId));
      } else {
        const err = await res.json();
        alert(err.error || "Failed to delete document");
      }
    } catch (error) {
      console.error("Delete error", error);
      alert("Error deleting document");
    }
  }

  // Save Changes
  async function handleSave(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (!bot) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/bots/${bot._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bot),
      });
      if (!res.ok) throw new Error("Failed to save");
    } catch (error) {
      alert("Error saving bot");
    } finally {
      setSaving(false);
    }
  }

  // Embed Code Copy
  const handleCopyCode = () => {
    if (!bot) return;
    const code = `<script src="${window.location.origin
      }/embed.js" data-bot-id="${bot.publicId}"${bot.theme.primaryColor !== "#8b5cf6"
        ? ` data-color="${bot.theme.primaryColor}"`
        : ""
      }${bot.widgetPosition !== "bottom-right"
        ? ` data-position="${bot.widgetPosition}"`
        : ""
      }></script>`;
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Domain Management
  const addDomain = () => {
    if (!bot || !newDomain.trim()) return;
    if (bot.allowedDomains.includes(newDomain.trim())) return;
    setBot({
      ...bot,
      allowedDomains: [...bot.allowedDomains, newDomain.trim()],
    });
    setNewDomain("");
  };

  const removeDomain = (domain: string) => {
    if (!bot) return;
    setBot({
      ...bot,
      allowedDomains: bot.allowedDomains.filter((d) => d !== domain),
    });
  };

  if (loading)
    return (
      <div className="p-8 text-center text-zinc-500">Loading editor...</div>
    );
  if (!bot) return null;

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard/bots"
            className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-white max-w-md truncate">
                {bot.name}
              </h1>
              <span
                className={`text-xs px-2 py-0.5 rounded-full border ${bot.isActive
                  ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                  : "bg-zinc-800 border-zinc-700 text-zinc-400"
                  }`}
              >
                {bot.isActive ? "Active" : "Inactive"}
              </span>
            </div>
            <p className="text-zinc-400 text-sm">Configuration & Settings</p>
          </div>
        </div>
        <button
          onClick={() => handleSave()}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-2.5 bg-violet-600 hover:bg-violet-500 text-white font-medium rounded-xl transition-colors disabled:opacity-50"
        >
          {saving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          Save Changes
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-zinc-900 rounded-xl mb-6 overflow-x-auto">
        {[
          { id: "prompt", label: "Prompt", icon: Terminal },
          { id: "model", label: "Model", icon: Bot },
          { id: "knowledge", label: "Knowledge", icon: Brain },
          { id: "design", label: "Design", icon: Layout },
          { id: "security", label: "Security", icon: Globe },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg transition-colors whitespace-nowrap flex-1 justify-center ${activeTab === tab.id
              ? "bg-zinc-800 text-white shadow-sm"
              : "text-zinc-400 hover:text-white hover:bg-zinc-800/50"
              }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div className="grid grid-cols-1 gap-8">
        {/* Main Form */}
        <div className="space-y-6">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSave();
            }}
            className="bg-zinc-900/50 backdrop-blur-xl rounded-2xl border border-zinc-800 p-6"
          >
            {/* PROMPT TAB */}
            {activeTab === "prompt" && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">
                    Bot Name
                  </label>
                  <input
                    type="text"
                    value={bot.name}
                    onChange={(e) => setBot({ ...bot, name: e.target.value })}
                    className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-xl text-white focus:ring-2 focus:ring-violet-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">
                    Bot Public ID (Use this for API)
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={bot.publicId}
                      readOnly
                      className="w-full pl-4 pr-12 py-3 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-400 font-mono text-sm focus:ring-2 focus:ring-violet-500 outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(bot.publicId);
                        setCopied(true);
                        setTimeout(() => setCopied(false), 2000);
                      }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-zinc-500 hover:text-white bg-zinc-800/50 hover:bg-zinc-700 rounded-lg transition-colors"
                      title="Copy ID"
                    >
                      {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">
                    System Prompt
                  </label>
                  <textarea
                    value={bot.systemPrompt}
                    onChange={(e) =>
                      setBot({ ...bot, systemPrompt: e.target.value })
                    }
                    rows={12}
                    className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-xl text-white focus:ring-2 focus:ring-violet-500 font-mono text-sm leading-relaxed"
                  />
                  <p className="text-xs text-zinc-500 mt-2">
                    markdown supported
                  </p>
                </div>
                <div className="pt-4 border-t border-zinc-800">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-white">
                        Bot Status
                      </p>
                      <p className="text-xs text-zinc-500">
                        Enable or disable public access
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setBot({ ...bot, isActive: !bot.isActive })
                      }
                      className={`w-12 h-6 rounded-full transition-colors relative ${bot.isActive ? "bg-emerald-500" : "bg-zinc-700"
                        }`}
                    >
                      <div
                        className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${bot.isActive ? "left-7" : "left-1"
                          }`}
                      />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* MODEL TAB */}
            {activeTab === "model" && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-4">
                    AI Model
                  </label>
                  <div className="grid grid-cols-1 gap-3">
                    {AI_MODELS.map((model) => (
                      <label
                        key={model.id}
                        className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all ${bot.aiModel === model.id
                          ? "bg-violet-500/10 border-violet-500 text-white"
                          : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700"
                          }`}
                      >
                        <input
                          type="radio"
                          name="aiModel"
                          value={model.id}
                          checked={bot.aiModel === model.id}
                          onChange={(e) =>
                            setBot({ ...bot, aiModel: e.target.value })
                          }
                          className="w-4 h-4 accent-violet-500"
                        />
                        <span className="font-medium">{model.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">
                    Temperature: {bot.temperature}
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={bot.temperature}
                    onChange={(e) =>
                      setBot({
                        ...bot,
                        temperature: parseFloat(e.target.value),
                      })
                    }
                    className="w-full accent-violet-500"
                  />
                  <div className="flex justify-between text-xs text-zinc-500 mt-1">
                    <span>Precise (0.0)</span>
                    <span>Creative (1.0)</span>
                  </div>
                </div>
              </div>
            )}

            {/* KNOWLEDGE TAB */}
            {activeTab === "knowledge" && (
              <div className="space-y-6">
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 text-center">
                  <h3 className="text-lg font-medium text-white mb-2">
                    Upload Knowledge
                  </h3>
                  <p className="text-sm text-zinc-400 mb-6 max-w-sm mx-auto">
                    Upload PDF or Text files to train your bot. The content will
                    be automatically indexed for vector search.
                  </p>

                  <div className="flex flex-col items-center justify-center gap-4">
                    <label
                      className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-zinc-700 rounded-xl cursor-pointer hover:border-violet-500 hover:bg-zinc-800/50 transition-all ${uploading ? "opacity-50 pointer-events-none" : ""
                        }`}
                    >
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        {uploading ? (
                          <Loader2 className="w-8 h-8 text-violet-500 animate-spin mb-2" />
                        ) : (
                          <Upload className="w-8 h-8 text-zinc-500 mb-2" />
                        )}
                        <p className="text-sm text-zinc-400">
                          {uploading
                            ? "Processing..."
                            : "Click to upload or drag & drop"}
                        </p>
                        <p className="text-xs text-zinc-500 mt-1">
                          PDF, TXT, MD (Max 10MB)
                        </p>
                      </div>
                      <input
                        type="file"
                        className="hidden"
                        accept=".pdf,.txt,.md"
                        onChange={handleFileUpload}
                        disabled={uploading}
                      />
                    </label>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-wider mb-4">
                    Indexed Documents
                  </h3>
                  {knowledgeLoading ? (
                    <div className="text-center py-8 text-zinc-500">
                      Loading documents...
                    </div>
                  ) : knowledge.length === 0 ? (
                    <div className="text-center py-8 bg-zinc-900/50 rounded-xl border border-dashed border-zinc-800">
                      <FileText className="w-8 h-8 text-zinc-700 mx-auto mb-2" />
                      <p className="text-sm text-zinc-500">
                        No documents indexed yet.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {knowledge.map((doc) => (
                        <div
                          key={doc._id}
                          className="flex items-center justify-between p-4 bg-zinc-900 border border-zinc-800 rounded-xl group hover:border-zinc-700 transition-colors"
                        >
                          <div className="flex items-center gap-3 overflow-hidden">
                            <div className="w-10 h-10 bg-violet-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
                              <FileText className="w-5 h-5 text-violet-400" />
                            </div>
                            <div className="min-w-0">
                              <h4 className="font-medium text-white text-sm truncate">
                                {doc.sourceName || "Untitled Document"}
                              </h4>
                              <p className="text-xs text-zinc-500">
                                {doc.metadata?.charCount
                                  ? (doc.metadata.charCount / 1024).toFixed(1)
                                  : "0.0"}{" "}
                                KB •{" "}
                                {doc.createdAt
                                  ? new Date(doc.createdAt).toLocaleDateString()
                                  : "Unknown Date"}
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => handleDeleteKnowledge(doc._id)}
                            className="p-2 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                            title="Delete Document"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* NEW TABS */}
            {activeTab === "design" && (
              <DesignTab
                bot={bot}
                setBot={setBot}
                handleCopyCode={handleCopyCode}
                copied={copied}
              />
            )}

            {activeTab === "security" && (
              <SecurityTab
                bot={bot}
                newDomain={newDomain}
                setNewDomain={setNewDomain}
                addDomain={addDomain}
                removeDomain={removeDomain}
              />
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
