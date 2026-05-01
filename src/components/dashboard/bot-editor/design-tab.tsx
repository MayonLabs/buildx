"use client";

import { useState, useRef, useEffect } from "react";
import { IBotTheme } from "@/models/bot.model";
import {
    Palette, MessageSquare, LayoutTemplate,
    Type, MousePointerClick, Settings,
    Copy, Check, Bot, User,
    ChevronLeft, ChevronRight, X, Code,
} from "lucide-react";

interface DesignTabProps {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    bot: { theme: IBotTheme; publicId: string;[key: string]: any };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setBot: (bot: any) => void;
    handleCopyCode: () => void;
    copied: boolean;
}

type DesignSection = "header" | "userMessage" | "botMessage" | "launcher" | "common" | "inputArea" | "chatWindow" | "advanced" | null;

export function DesignTab({ bot, setBot, handleCopyCode, copied }: DesignTabProps) {
    const [selectedSection, setSelectedSection] = useState<DesignSection>(null);
    const [isOpen, setIsOpen] = useState(true);
    // Corner radius state: independent mode toggle + which corner is selected (TL/TR/BR/BL)
    const [cornerMode, setCornerMode] = useState<{
        botIndependent: boolean;
        botSelectedCorner: 'TL' | 'TR' | 'BR' | 'BL' | null;
        userIndependent: boolean;
        userSelectedCorner: 'TL' | 'TR' | 'BR' | 'BL' | null;
    }>({ botIndependent: false, botSelectedCorner: null, userIndependent: false, userSelectedCorner: null });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateTheme = (section: keyof IBotTheme, key: string, value: any) => {
        if (section === 'common') {
            setBot({ ...bot, theme: { ...bot.theme, common: { ...bot.theme.common, [key]: value } } });
            return;
        }
        const currentSectionValue = bot.theme[section];
        const updatedSection = typeof currentSectionValue === 'object' && currentSectionValue !== null
            ? { ...currentSectionValue, [key]: value }
            : { [key]: value };
        setBot({
            ...bot,
            theme: {
                ...bot.theme,
                [section]: updatedSection
            } as IBotTheme
        });
    };

    // Toggle a visibility flag under theme.elements.{key}.show
    type ToggleableElement = "refreshButton" | "branding" | "welcomeSubtitle" | "emptyStateIcon";
    const setElementShow = (elementKey: ToggleableElement, show: boolean) => {
        const elements = (bot.theme as IBotTheme).elements || {};
        setBot({
            ...bot,
            theme: {
                ...bot.theme,
                elements: {
                    ...elements,
                    [elementKey]: { ...(elements[elementKey] || {}), show },
                },
            } as IBotTheme,
        });
    };
    const isElementShown = (elementKey: ToggleableElement): boolean => {
        const elements = (bot.theme as IBotTheme).elements;
        return elements?.[elementKey]?.show !== false;
    };

    // Sync theme to iframe when it changes
    const iframeRef = useRef<HTMLIFrameElement>(null);

    // Sync theme to iframe when it changes
    useEffect(() => {
        if (iframeRef.current?.contentWindow) {
            iframeRef.current.contentWindow.postMessage({
                type: 'BUILDX_THEME_UPDATE',
                theme: bot.theme
            }, '*');
        }
    }, [bot.theme]);

    // Listen for click events from iframe
    useEffect(() => {
        const handleMessage = (event: MessageEvent) => {
            if (typeof event.data === 'object' && event.data.type === 'BUILDX_ELEMENT_CLICK') {
                setSelectedSection(event.data.section as DesignSection);
                setIsOpen(true); // Ensure widget is open if internal element clicked
            }
        };
        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, []);

    return (
        <div className="flex flex-col lg:flex-row gap-6 h-full min-h-[600px]">
            {/* Canvas Area (Center) */}
            <div className="flex-1 bg-zinc-950/50 rounded-2xl border border-zinc-800 relative overflow-hidden flex flex-col items-center justify-center p-8 group">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

                <div className="absolute top-4 left-4 flex items-center gap-2 text-xs text-zinc-500 bg-zinc-900/80 px-3 py-1.5 rounded-full border border-zinc-800">
                    <MousePointerClick className="w-3 h-3" />
                    Click on elements to edit styles
                </div>

                {/* Simulated Widget Container (Iframe Host) */}
                <div className="relative w-full max-w-[420px] h-[760px] flex flex-col items-end justify-end pointer-events-auto">

                    {/* Iframe Container — honours chatWindow.width/height + common.borderRadius */}
                    <div
                        className={`
                            bg-transparent overflow-hidden origin-bottom-right transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]
                            ${isOpen ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-90 translate-y-4 pointer-events-none'}
                        `}
                        style={{
                            width: bot.theme.chatWindow?.width || '380px',
                            height: bot.theme.chatWindow?.height || '600px',
                            marginBottom: '20px',
                            boxShadow: bot.theme.common.shadow,
                            borderRadius: bot.theme.common.borderRadius,
                        }}
                    >
                        <iframe
                            ref={iframeRef}
                            className="w-full h-full border-0"
                            src={`${window.location.origin}/share/${bot.publicId}`}
                            title="Bot Preview"
                            onLoad={(e) => {
                                // Initial Sync on Load
                                const iframe = e.currentTarget;
                                iframe.contentWindow?.postMessage({
                                    type: 'BUILDX_THEME_UPDATE',
                                    theme: bot.theme
                                }, '*');
                            }}
                        />
                        {/* Transparent Overlay for Click Capture */}
                        <div
                            className="absolute inset-0 z-10"
                            onClick={() => {
                                // Heuristic: Calculate click position relative to iframe to guess element?
                                // Actually, getting element-level selection inside an iframe from outside is hard cross-origin (even same-origin can be tricky with events)
                                // For now, we unfortunately lose "Click-to-Select-Element" inside the iframe content unless we use postMessage FROM iframe.
                                // BUT user demanded "use that embed" so we must prioritize visual fidelity.
                                // We can provide a generic "Select Component" overlay or rely entirely on Side Panel.
                                // Let's try to pass clicks through but capture generic click to "Inspect".
                                // NO, currently user wants visual fidelity.
                                // Let's keep the Overlay pointer-events-auto but make it "pass through" only if we implement complex logic.
                                // Use a simple overlay that hides when "Interacting"?
                                // Or better: Adding the overlay defeats the purpose of "Simulated Widget".
                                // REMOVE OVERLAY for full interactivity, but then "Click to Edit" feature is lost inside iframe.
                                // Compromise: We update the side panel to be the primary controller. 
                                // Or we inject a script into the iframe to handle "Inspect Mode"?
                                // Given complexity, I will remove the overlay and let the user interact with the real bot.
                            }}
                            style={{ pointerEvents: 'none' }}
                        />
                    </div>

                    {/* Launcher — preview honours every launcher.* field including close-state. */}
                    {(() => {
                        const launcherSizePx = parseInt(bot.theme.launcher.size || "") || 60;
                        const launcherIconSizePx = parseInt(bot.theme.launcher.iconSize || "") || 28;
                        const launcherBg = isOpen
                            ? (bot.theme.launcher.closeBgColor || bot.theme.launcher.bgColor)
                            : bot.theme.launcher.bgColor;
                        const launcherIconCol = isOpen
                            ? (bot.theme.launcher.closeIconColor || bot.theme.launcher.iconColor)
                            : bot.theme.launcher.iconColor;
                        const launcherShape = bot.theme.launcher.borderRadius || "50%";
                        const launcherBorderW = bot.theme.launcher.borderWidth || "0";
                        const launcherBorderC = bot.theme.launcher.borderColor || "transparent";
                        return (
                            <div
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedSection("launcher");
                                    setIsOpen(!isOpen);
                                }}
                                className={`
                                    absolute bottom-6 -right-19 flex items-center justify-center shadow-lg cursor-pointer z-10
                                    transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)]
                                    ${selectedSection === "launcher" ? "scale-105" : "hover:scale-105"}
                                    hover:shadow-xl
                                `}
                                style={{
                                    width: `${launcherSizePx}px`,
                                    height: `${launcherSizePx}px`,
                                    borderRadius: launcherShape,
                                    backgroundColor: launcherBg,
                                    border: `${launcherBorderW} solid ${launcherBorderC}`,
                                    fontFamily: bot.theme.common.fontFamily,
                                }}
                            >
                                {isOpen ? (
                                    bot.theme.launcher.closeIcon ? (
                                        <div
                                            dangerouslySetInnerHTML={{ __html: bot.theme.launcher.closeIcon }}
                                            className="flex items-center justify-center"
                                            style={{
                                                color: launcherIconCol,
                                                width: `${launcherIconSizePx}px`,
                                                height: `${launcherIconSizePx}px`,
                                            }}
                                        />
                                    ) : (
                                        <X
                                            style={{
                                                color: launcherIconCol,
                                                width: `${launcherIconSizePx}px`,
                                                height: `${launcherIconSizePx}px`,
                                            }}
                                        />
                                    )
                                ) : bot.theme.launcher.icon ? (
                                    <div
                                        dangerouslySetInnerHTML={{ __html: bot.theme.launcher.icon }}
                                        className="flex items-center justify-center"
                                        style={{
                                            color: launcherIconCol,
                                            width: `${launcherIconSizePx}px`,
                                            height: `${launcherIconSizePx}px`,
                                        }}
                                    />
                                ) : (
                                    <Bot
                                        style={{
                                            color: launcherIconCol,
                                            width: `${launcherIconSizePx}px`,
                                            height: `${launcherIconSizePx}px`,
                                        }}
                                    />
                                )}
                            </div>
                        );
                    })()}
                </div>
            </div>

            {/* Inspector Panel (Right) */}
            <div className="w-full lg:w-80 shrink-0 space-y-4 overflow-y-auto">
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 shadow-lg min-h-[500px]">

                    {/* List View (Main Menu) */}
                    {selectedSection === null ? (
                        <div className="space-y-2">
                            <div className="flex items-center gap-2 mb-6 text-violet-400 border-b border-zinc-800 pb-3">
                                <Settings className="w-4 h-4" />
                                <h3 className="text-sm font-semibold uppercase tracking-wider">Design Elements</h3>
                            </div>

                            {[
                                { id: "common", label: "Global Settings", icon: Settings },
                                { id: "header", label: "Header Styles", icon: LayoutTemplate },
                                { id: "chatWindow", label: "Chat Window", icon: MessageSquare },
                                { id: "botMessage", label: "Bot Message", icon: Bot },
                                { id: "userMessage", label: "User Message", icon: User },
                                { id: "inputArea", label: "Input Area & Footer", icon: Type },
                                { id: "launcher", label: "Launcher Button", icon: MousePointerClick },
                                { id: "advanced", label: "Advanced & Custom CSS", icon: Code },
                            ].map((item) => (
                                <button
                                    key={item.id}
                                    onClick={() => setSelectedSection(item.id as DesignSection)}
                                    className="w-full flex items-center justify-between p-3 rounded-lg bg-zinc-950/50 hover:bg-zinc-800 border border-zinc-800/50 hover:border-zinc-700 transition-all text-left group"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-zinc-900 flex items-center justify-center text-zinc-400 group-hover:text-violet-400 transition-colors">
                                            <item.icon className="w-4 h-4" />
                                        </div>
                                        <span className="text-sm font-medium text-zinc-300 group-hover:text-white">{item.label}</span>
                                    </div>
                                    <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-zinc-400" />
                                </button>
                            ))}
                        </div>
                    ) : (
                        /* Detail View */
                        <div className="space-y-5 animate-in slide-in-from-right-4 duration-200">
                            <div className="flex items-center gap-2 mb-6 text-violet-400 border-b border-zinc-800 pb-3">
                                <button
                                    onClick={() => setSelectedSection(null)}
                                    className="hover:bg-zinc-800 p-1 rounded-md -ml-2 mr-1 transition-colors text-zinc-400 hover:text-white"
                                >
                                    <ChevronLeft className="w-5 h-5" />
                                </button>
                                <Palette className="w-4 h-4" />
                                <h3 className="text-sm font-semibold uppercase tracking-wider">
                                    {selectedSection === "header" && "Header Styles"}
                                    {selectedSection === "botMessage" && "Bot Message"}
                                    {selectedSection === "userMessage" && "User Message"}
                                    {selectedSection === "launcher" && "Launcher Button"}
                                    {selectedSection === "common" && "Global Settings"}
                                    {selectedSection === "inputArea" && "Input Area & Footer"}
                                    {selectedSection === "chatWindow" && "Chat Window"}
                                    {selectedSection === "advanced" && "Advanced & Custom CSS"}
                                </h3>
                            </div>

                            <div className="space-y-5">
                                {/* Font Control Helper */}
                                {/* We'll inline it to avoid creating new file for now, or just repeat logic if simple */}
                                {/* Header Config */}
                                {selectedSection === "header" && (
                                    <>
                                        <div>
                                            <label className="block text-xs font-medium text-zinc-400 mb-2">Title Text</label>
                                            <input
                                                type="text"
                                                value={bot.theme.header.title}
                                                onChange={(e) => updateTheme("header", "title", e.target.value)}
                                                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-700 rounded-lg text-sm text-white focus:outline-none focus:border-violet-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-zinc-400 mb-2">Background Color</label>
                                            <div className="flex gap-2">
                                                <input
                                                    type="color"
                                                    value={bot.theme.header.bgColor}
                                                    onChange={(e) => updateTheme("header", "bgColor", e.target.value)}
                                                    className="w-10 h-10 rounded cursor-pointer border-0 p-0 bg-transparent"
                                                />
                                                <input
                                                    type="text"
                                                    value={bot.theme.header.bgColor}
                                                    onChange={(e) => updateTheme("header", "bgColor", e.target.value)}
                                                    className="flex-1 px-3 py-2 bg-zinc-950 border border-zinc-700 rounded-lg text-sm text-white uppercase font-mono"
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-zinc-400 mb-2">Text Color</label>
                                            <div className="flex gap-2">
                                                <input
                                                    type="color"
                                                    value={bot.theme.header.textColor}
                                                    onChange={(e) => updateTheme("header", "textColor", e.target.value)}
                                                    className="w-10 h-10 rounded cursor-pointer border-0 p-0 bg-transparent"
                                                />
                                                <input
                                                    type="text"
                                                    value={bot.theme.header.textColor}
                                                    onChange={(e) => updateTheme("header", "textColor", e.target.value)}
                                                    className="flex-1 px-3 py-2 bg-zinc-950 border border-zinc-700 rounded-lg text-sm text-white uppercase font-mono"
                                                />
                                            </div>
                                        </div>

                                        <div className="border-t border-zinc-800 my-4 pt-4">
                                            <label className="block text-xs font-semibold text-zinc-300 mb-3">Header Icon</label>
                                            <div className="space-y-3">
                                                <div>
                                                    <label className="block text-xs font-medium text-zinc-400 mb-2">Icon Color</label>
                                                    <div className="flex gap-2">
                                                        <input
                                                            type="color"
                                                            value={bot.theme.header.iconColor || "#ffffff"}
                                                            onChange={(e) => updateTheme("header", "iconColor", e.target.value)}
                                                            className="w-10 h-10 rounded cursor-pointer border-0 p-0 bg-transparent"
                                                        />
                                                        <input
                                                            type="text"
                                                            value={bot.theme.header.iconColor || "#ffffff"}
                                                            onChange={(e) => updateTheme("header", "iconColor", e.target.value)}
                                                            className="flex-1 px-3 py-2 bg-zinc-950 border border-zinc-700 rounded-lg text-sm text-white uppercase font-mono"
                                                        />
                                                    </div>
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-medium text-zinc-400 mb-2">Icon Background</label>
                                                    <div className="flex gap-2">
                                                        <input
                                                            type="color"
                                                            value={bot.theme.header.iconBgColor || "#ffffff"}
                                                            onChange={(e) => updateTheme("header", "iconBgColor", e.target.value)}
                                                            className="w-10 h-10 rounded cursor-pointer border-0 p-0 bg-transparent"
                                                        />
                                                        <input
                                                            type="text"
                                                            value={bot.theme.header.iconBgColor || ""}
                                                            onChange={(e) => updateTheme("header", "iconBgColor", e.target.value)}
                                                            placeholder="rgba(255,255,255,0.2)"
                                                            className="flex-1 px-3 py-2 bg-zinc-950 border border-zinc-700 rounded-lg text-sm text-white font-mono"
                                                        />
                                                    </div>
                                                </div>
                                                <div>
                                                    <div className="flex items-center justify-between mb-1.5">
                                                        <label className="text-xs font-medium text-zinc-400">Icon Size</label>
                                                        <span className="text-xs text-zinc-500 font-mono">
                                                            {parseInt(bot.theme.header.iconSize || "") || 20}px
                                                        </span>
                                                    </div>
                                                    <input
                                                        type="range"
                                                        min={12}
                                                        max={36}
                                                        value={parseInt(bot.theme.header.iconSize || "") || 20}
                                                        onChange={(e) => updateTheme("header", "iconSize", `${e.target.value}px`)}
                                                        className="w-full h-1.5 accent-violet-500"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-medium text-zinc-400 mb-2">Custom Header Icon (SVG)</label>
                                                    <textarea
                                                        value={bot.theme.header.icon || ""}
                                                        onChange={(e) => updateTheme("header", "icon", e.target.value)}
                                                        placeholder="Paste SVG code..."
                                                        className="w-full px-3 py-2 bg-zinc-950 border border-zinc-700 rounded-lg text-sm text-white focus:outline-none focus:border-violet-500 font-mono text-[10px] min-h-[60px]"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="border-t border-zinc-800 my-4 pt-4">
                                            <label className="block text-xs font-semibold text-zinc-300 mb-3">Subtitle (description)</label>
                                            <div className="space-y-3">
                                                <div>
                                                    <label className="block text-xs font-medium text-zinc-400 mb-2">Subtitle Text</label>
                                                    <input
                                                        type="text"
                                                        value={bot.theme.header.subtitle ?? ""}
                                                        onChange={(e) => updateTheme("header", "subtitle", e.target.value)}
                                                        placeholder="Powered by Buildx"
                                                        className="w-full px-3 py-2 bg-zinc-950 border border-zinc-700 rounded-lg text-sm text-white focus:outline-none focus:border-violet-500"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-medium text-zinc-400 mb-2">Subtitle Color</label>
                                                    <div className="flex gap-2">
                                                        <input
                                                            type="color"
                                                            value={bot.theme.header.subtitleColor || "#ffffff"}
                                                            onChange={(e) => updateTheme("header", "subtitleColor", e.target.value)}
                                                            className="w-10 h-10 rounded cursor-pointer border-0 p-0 bg-transparent"
                                                        />
                                                        <input
                                                            type="text"
                                                            value={bot.theme.header.subtitleColor || ""}
                                                            onChange={(e) => updateTheme("header", "subtitleColor", e.target.value)}
                                                            placeholder="rgba(255,255,255,0.7)"
                                                            className="flex-1 px-3 py-2 bg-zinc-950 border border-zinc-700 rounded-lg text-sm text-white font-mono"
                                                        />
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-2 gap-2">
                                                    <div>
                                                        <label className="block text-[10px] font-medium text-zinc-400 mb-1">Font Size</label>
                                                        <input
                                                            type="text"
                                                            value={bot.theme.header.subtitleFont?.size ?? ""}
                                                            onChange={(e) => updateTheme("header", "subtitleFont", { ...(bot.theme.header.subtitleFont || {}), size: e.target.value })}
                                                            placeholder="12px"
                                                            className="w-full px-3 py-2 bg-zinc-950 border border-zinc-700 rounded-lg text-xs text-white font-mono"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-[10px] font-medium text-zinc-400 mb-1">Font Weight</label>
                                                        <input
                                                            type="text"
                                                            value={bot.theme.header.subtitleFont?.weight ?? ""}
                                                            onChange={(e) => updateTheme("header", "subtitleFont", { ...(bot.theme.header.subtitleFont || {}), weight: e.target.value })}
                                                            placeholder="400"
                                                            className="w-full px-3 py-2 bg-zinc-950 border border-zinc-700 rounded-lg text-xs text-white font-mono"
                                                        />
                                                    </div>
                                                </div>
                                                <div>
                                                    <label className="block text-[10px] font-medium text-zinc-400 mb-1">Font Family</label>
                                                    <input
                                                        type="text"
                                                        value={bot.theme.header.subtitleFont?.family ?? ""}
                                                        onChange={(e) => updateTheme("header", "subtitleFont", { ...(bot.theme.header.subtitleFont || {}), family: e.target.value })}
                                                        placeholder="Inter, sans-serif"
                                                        className="w-full px-3 py-2 bg-zinc-950 border border-zinc-700 rounded-lg text-xs text-white font-mono"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="border-t border-zinc-800 my-4 pt-4">
                                            <label className="block text-xs font-semibold text-zinc-300 mb-3">Refresh Button</label>
                                            <div>
                                                <label className="block text-xs font-medium text-zinc-400 mb-2">Refresh Icon Color</label>
                                                <div className="flex gap-2">
                                                    <input
                                                        type="color"
                                                        value={bot.theme.header.refreshIconColor || bot.theme.header.textColor || "#ffffff"}
                                                        onChange={(e) => updateTheme("header", "refreshIconColor", e.target.value)}
                                                        className="w-10 h-10 rounded cursor-pointer border-0 p-0 bg-transparent"
                                                    />
                                                    <input
                                                        type="text"
                                                        value={bot.theme.header.refreshIconColor || ""}
                                                        onChange={(e) => updateTheme("header", "refreshIconColor", e.target.value)}
                                                        placeholder="Defaults to header text color"
                                                        className="flex-1 px-3 py-2 bg-zinc-950 border border-zinc-700 rounded-lg text-sm text-white font-mono"
                                                    />
                                                </div>
                                                <p className="text-[10px] text-zinc-500 mt-1">Toggle the button itself in <span className="text-violet-300">Advanced → Element visibility</span>.</p>
                                            </div>
                                        </div>
                                    </>
                                )}

                                {/* Bot Message Config */}
                                {selectedSection === "botMessage" && (
                                    <>
                                        <div>
                                            <label className="block text-xs font-medium text-zinc-400 mb-2">Background Color</label>
                                            <div className="flex gap-2">
                                                <input
                                                    type="color"
                                                    value={bot.theme.botMessage.bgColor}
                                                    onChange={(e) => updateTheme("botMessage", "bgColor", e.target.value)}
                                                    className="w-10 h-10 rounded cursor-pointer border-0 p-0 bg-transparent"
                                                />
                                                <input
                                                    type="text"
                                                    value={bot.theme.botMessage.bgColor}
                                                    onChange={(e) => updateTheme("botMessage", "bgColor", e.target.value)}
                                                    className="flex-1 px-3 py-2 bg-zinc-950 border border-zinc-700 rounded-lg text-sm text-white uppercase font-mono"
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-zinc-400 mb-2">Text Color</label>
                                            <div className="flex gap-2">
                                                <input
                                                    type="color"
                                                    value={bot.theme.botMessage.textColor}
                                                    onChange={(e) => updateTheme("botMessage", "textColor", e.target.value)}
                                                    className="w-10 h-10 rounded cursor-pointer border-0 p-0 bg-transparent"
                                                />
                                                <input
                                                    type="text"
                                                    value={bot.theme.botMessage.textColor}
                                                    onChange={(e) => updateTheme("botMessage", "textColor", e.target.value)}
                                                    className="flex-1 px-3 py-2 bg-zinc-950 border border-zinc-700 rounded-lg text-sm text-white uppercase font-mono"
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-zinc-400 mb-2">Welcome Message</label>
                                            <textarea
                                                value={bot.theme.welcomeMessage}
                                                onChange={(e) => setBot({ ...bot, theme: { ...bot.theme, welcomeMessage: e.target.value } })}
                                                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-700 rounded-lg text-sm text-white focus:outline-none focus:border-violet-500 min-h-[100px]"
                                            />
                                        </div>
                                        <div>
                                            {/* Header with toggle */}
                                            <div className="flex items-center justify-between mb-2">
                                                <label className="text-xs font-medium text-zinc-400">Corner Radius</label>
                                                <button
                                                    type="button"
                                                    onClick={() => setCornerMode(prev => ({
                                                        ...prev,
                                                        botIndependent: !prev.botIndependent,
                                                        botSelectedCorner: !prev.botIndependent ? 'TL' : null
                                                    }))}
                                                    className={`relative w-10 h-5 rounded-full transition-all ${cornerMode.botIndependent ? 'bg-violet-500' : 'bg-zinc-700'
                                                        }`}
                                                >
                                                    <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${cornerMode.botIndependent ? 'left-5' : 'left-0.5'
                                                        }`} />
                                                </button>
                                            </div>
                                            <div className="space-y-3">
                                                {!cornerMode.botIndependent ? (
                                                    <>
                                                        {/* Preset buttons */}
                                                        <div className="flex gap-2">
                                                            {[
                                                                { label: "None", value: "0px" },
                                                                { label: "Small", value: "4px" },
                                                                { label: "Medium", value: "8px" },
                                                                { label: "Large", value: "16px" },
                                                            ].map((opt) => (
                                                                <button
                                                                    key={opt.value}
                                                                    type="button"
                                                                    onClick={() => updateTheme("botMessage", "borderRadius", opt.value)}
                                                                    className={`flex-1 py-2 px-1 text-[10px] font-medium rounded-md border transition-all ${bot.theme.botMessage.borderRadius === opt.value
                                                                        ? "border-violet-500 bg-violet-500/20 text-white"
                                                                        : "border-zinc-700 bg-zinc-950 text-zinc-400 hover:border-zinc-600"
                                                                        }`}
                                                                >
                                                                    {opt.label}
                                                                </button>
                                                            ))}
                                                        </div>
                                                        {/* Slider + preview */}
                                                        <div className="flex items-center gap-3">
                                                            <div
                                                                className="w-10 h-8 bg-zinc-600 flex-shrink-0"
                                                                style={{ borderRadius: bot.theme.botMessage.borderRadius || '8px' }}
                                                            />
                                                            <input
                                                                type="range"
                                                                min="0"
                                                                max="24"
                                                                value={parseInt(bot.theme.botMessage.borderRadius || '') || 8}
                                                                onChange={(e) => updateTheme("botMessage", "borderRadius", `${e.target.value}px`)}
                                                                className="flex-1 h-1.5 accent-violet-500"
                                                            />
                                                            <span className="text-xs text-zinc-400 w-8 text-right font-mono">
                                                                {parseInt(bot.theme.botMessage.borderRadius || '') || 8}px
                                                            </span>
                                                        </div>
                                                    </>
                                                ) : (
                                                    /* Independent corners mode - 4 corner icons */
                                                    <div className="bg-zinc-950 border border-zinc-700 rounded-lg p-3">
                                                        {/* Visual corner selector with preview */}
                                                        <div className="flex items-center gap-3 mb-3">
                                                            {/* Corner icon grid */}
                                                            <div className="grid grid-cols-2 gap-1">
                                                                {(['TL', 'TR', 'BL', 'BR'] as const).map((corner) => {
                                                                    const isSelected = cornerMode.botSelectedCorner === corner;
                                                                    const cornerStyles: Record<string, string> = {
                                                                        TL: 'rounded-tl-lg',
                                                                        TR: 'rounded-tr-lg',
                                                                        BL: 'rounded-bl-lg',
                                                                        BR: 'rounded-br-lg'
                                                                    };
                                                                    return (
                                                                        <button
                                                                            key={corner}
                                                                            type="button"
                                                                            onClick={() => setCornerMode(prev => ({ ...prev, botSelectedCorner: corner }))}
                                                                            className={`w-6 h-6 border-2 transition-all ${cornerStyles[corner]} ${isSelected
                                                                                ? 'border-violet-500 bg-violet-500/30'
                                                                                : 'border-zinc-600 bg-zinc-800 hover:border-zinc-500'
                                                                                }`}
                                                                            title={corner === 'TL' ? 'Top Left' : corner === 'TR' ? 'Top Right' : corner === 'BL' ? 'Bottom Left' : 'Bottom Right'}
                                                                        />
                                                                    );
                                                                })}
                                                            </div>
                                                            {/* Live preview */}
                                                            <div
                                                                className="flex-1 h-12 bg-zinc-600"
                                                                style={{ borderRadius: bot.theme.botMessage.borderRadius || '8px' }}
                                                            />
                                                        </div>
                                                        {/* Slider for selected corner */}
                                                        {cornerMode.botSelectedCorner && (() => {
                                                            const cornerIdx = { TL: 0, TR: 1, BR: 2, BL: 3 }[cornerMode.botSelectedCorner];
                                                            const parts = (bot.theme.botMessage.borderRadius || '8px 8px 8px 8px').split(' ');
                                                            while (parts.length < 4) parts.push(parts[0] || '8px');
                                                            const val = parseInt(parts[cornerIdx]) || 8;
                                                            const cornerNames = { TL: 'Top Left', TR: 'Top Right', BR: 'Bottom Right', BL: 'Bottom Left' };
                                                            return (
                                                                <div className="flex items-center gap-2">
                                                                    <span className="text-[10px] text-zinc-500 w-16">{cornerNames[cornerMode.botSelectedCorner]}</span>
                                                                    <input
                                                                        type="range"
                                                                        min="0"
                                                                        max="24"
                                                                        value={val}
                                                                        onChange={(e) => {
                                                                            const newParts = [...parts];
                                                                            newParts[cornerIdx] = `${e.target.value}px`;
                                                                            updateTheme('botMessage', 'borderRadius', newParts.join(' '));
                                                                        }}
                                                                        className="flex-1 h-1.5 accent-violet-500"
                                                                    />
                                                                    <span className="text-xs text-zinc-400 w-8 text-right font-mono">{val}px</span>
                                                                </div>
                                                            );
                                                        })()}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                            <div>
                                                <label className="block text-xs font-medium text-zinc-400 mb-2">Font Size</label>
                                                <input
                                                    type="text"
                                                    value={bot.theme.botMessage.font?.size || "14px"}
                                                    onChange={(e) => {
                                                        const font = { ...bot.theme.botMessage.font, size: e.target.value };
                                                        updateTheme("botMessage", "font", font);
                                                    }}
                                                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-700 rounded-lg text-sm text-white focus:outline-none focus:border-violet-500"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-zinc-400 mb-2">Font Weight</label>
                                                <select
                                                    value={bot.theme.botMessage.font?.weight || "400"}
                                                    onChange={(e) => {
                                                        const font = { ...bot.theme.botMessage.font, weight: e.target.value };
                                                        updateTheme("botMessage", "font", font);
                                                    }}
                                                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-700 rounded-lg text-sm text-white focus:outline-none focus:border-violet-500"
                                                >
                                                    <option value="300">Light</option>
                                                    <option value="400">Regular</option>
                                                    <option value="500">Medium</option>
                                                    <option value="600">SemiBold</option>
                                                    <option value="700">Bold</option>
                                                </select>
                                            </div>
                                        </div>
                                    </>
                                )}

                                {/* User Message Config */}
                                {selectedSection === "userMessage" && (
                                    <>
                                        <div>
                                            <label className="block text-xs font-medium text-zinc-400 mb-2">Background Color</label>
                                            <div className="flex gap-2">
                                                <input
                                                    type="color"
                                                    value={bot.theme.userMessage.bgColor}
                                                    onChange={(e) => updateTheme("userMessage", "bgColor", e.target.value)}
                                                    className="w-10 h-10 rounded cursor-pointer border-0 p-0 bg-transparent"
                                                />
                                                <input
                                                    type="text"
                                                    value={bot.theme.userMessage.bgColor}
                                                    onChange={(e) => updateTheme("userMessage", "bgColor", e.target.value)}
                                                    className="flex-1 px-3 py-2 bg-zinc-950 border border-zinc-700 rounded-lg text-sm text-white uppercase font-mono"
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-zinc-400 mb-2">Text Color</label>
                                            <div className="flex gap-2">
                                                <input
                                                    type="color"
                                                    value={bot.theme.userMessage.textColor}
                                                    onChange={(e) => updateTheme("userMessage", "textColor", e.target.value)}
                                                    className="w-10 h-10 rounded cursor-pointer border-0 p-0 bg-transparent"
                                                />
                                                <input
                                                    type="text"
                                                    value={bot.theme.userMessage.textColor}
                                                    onChange={(e) => updateTheme("userMessage", "textColor", e.target.value)}
                                                    className="flex-1 px-3 py-2 bg-zinc-950 border border-zinc-700 rounded-lg text-sm text-white uppercase font-mono"
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-zinc-400 mb-2">Show Avatar</label>
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="checkbox"
                                                    checked={bot.theme.userMessage.showAvatar}
                                                    onChange={(e) => updateTheme("userMessage", "showAvatar", e.target.checked)}
                                                    className="w-4 h-4 rounded border-zinc-700 bg-zinc-950 text-violet-500 focus:ring-violet-500 focus:ring-offset-zinc-900"
                                                />
                                                <span className="text-sm text-zinc-300">Show User Avatar</span>
                                            </div>
                                        </div>
                                        <div>
                                            {/* Header with toggle */}
                                            <div className="flex items-center justify-between mb-2">
                                                <label className="text-xs font-medium text-zinc-400">Corner Radius</label>
                                                <button
                                                    type="button"
                                                    onClick={() => setCornerMode(prev => ({
                                                        ...prev,
                                                        userIndependent: !prev.userIndependent,
                                                        userSelectedCorner: !prev.userIndependent ? 'TL' : null
                                                    }))}
                                                    className={`relative w-10 h-5 rounded-full transition-all ${cornerMode.userIndependent ? 'bg-violet-500' : 'bg-zinc-700'
                                                        }`}
                                                >
                                                    <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${cornerMode.userIndependent ? 'left-5' : 'left-0.5'
                                                        }`} />
                                                </button>
                                            </div>
                                            <div className="space-y-3">
                                                {!cornerMode.userIndependent ? (
                                                    <>
                                                        {/* Preset buttons */}
                                                        <div className="flex gap-2">
                                                            {[
                                                                { label: "None", value: "0px" },
                                                                { label: "Small", value: "4px" },
                                                                { label: "Medium", value: "8px" },
                                                                { label: "Large", value: "16px" },
                                                            ].map((opt) => (
                                                                <button
                                                                    key={opt.value}
                                                                    type="button"
                                                                    onClick={() => updateTheme("userMessage", "borderRadius", opt.value)}
                                                                    className={`flex-1 py-2 px-1 text-[10px] font-medium rounded-md border transition-all ${bot.theme.userMessage.borderRadius === opt.value
                                                                            ? "border-violet-500 bg-violet-500/20 text-white"
                                                                            : "border-zinc-700 bg-zinc-950 text-zinc-400 hover:border-zinc-600"
                                                                        }`}
                                                                >
                                                                    {opt.label}
                                                                </button>
                                                            ))}
                                                        </div>
                                                        {/* Slider + preview */}
                                                        <div className="flex items-center gap-3">
                                                            <div
                                                                className="w-10 h-8 bg-zinc-600 flex-shrink-0"
                                                                style={{ borderRadius: bot.theme.userMessage.borderRadius || '8px' }}
                                                            />
                                                            <input
                                                                type="range"
                                                                min="0"
                                                                max="24"
                                                                value={parseInt(bot.theme.userMessage.borderRadius || '') || 8}
                                                                onChange={(e) => updateTheme("userMessage", "borderRadius", `${e.target.value}px`)}
                                                                className="flex-1 h-1.5 accent-violet-500"
                                                            />
                                                            <span className="text-xs text-zinc-400 w-8 text-right font-mono">
                                                                {parseInt(bot.theme.userMessage.borderRadius || '') || 8}px
                                                            </span>
                                                        </div>
                                                    </>
                                                ) : (
                                                    /* Independent corners mode - 4 corner icons */
                                                    <div className="bg-zinc-950 border border-zinc-700 rounded-lg p-3">
                                                        {/* Visual corner selector with preview */}
                                                        <div className="flex items-center gap-3 mb-3">
                                                            {/* Corner icon grid */}
                                                            <div className="grid grid-cols-2 gap-1">
                                                                {(['TL', 'TR', 'BL', 'BR'] as const).map((corner) => {
                                                                    const isSelected = cornerMode.userSelectedCorner === corner;
                                                                    const cornerStyles: Record<string, string> = {
                                                                        TL: 'rounded-tl-lg',
                                                                        TR: 'rounded-tr-lg',
                                                                        BL: 'rounded-bl-lg',
                                                                        BR: 'rounded-br-lg'
                                                                    };
                                                                    return (
                                                                        <button
                                                                            key={corner}
                                                                            type="button"
                                                                            onClick={() => setCornerMode(prev => ({ ...prev, userSelectedCorner: corner }))}
                                                                            className={`w-6 h-6 border-2 transition-all ${cornerStyles[corner]} ${isSelected
                                                                                    ? 'border-violet-500 bg-violet-500/30'
                                                                                    : 'border-zinc-600 bg-zinc-800 hover:border-zinc-500'
                                                                                }`}
                                                                            title={corner === 'TL' ? 'Top Left' : corner === 'TR' ? 'Top Right' : corner === 'BL' ? 'Bottom Left' : 'Bottom Right'}
                                                                        />
                                                                    );
                                                                })}
                                                            </div>
                                                            {/* Live preview */}
                                                            <div
                                                                className="flex-1 h-12 bg-zinc-600"
                                                                style={{ borderRadius: bot.theme.userMessage.borderRadius || '8px' }}
                                                            />
                                                        </div>
                                                        {/* Slider for selected corner */}
                                                        {cornerMode.userSelectedCorner && (() => {
                                                            const cornerIdx = { TL: 0, TR: 1, BR: 2, BL: 3 }[cornerMode.userSelectedCorner];
                                                            const parts = (bot.theme.userMessage.borderRadius || '8px 8px 8px 8px').split(' ');
                                                            while (parts.length < 4) parts.push(parts[0] || '8px');
                                                            const val = parseInt(parts[cornerIdx]) || 8;
                                                            const cornerNames = { TL: 'Top Left', TR: 'Top Right', BR: 'Bottom Right', BL: 'Bottom Left' };
                                                            return (
                                                                <div className="flex items-center gap-2">
                                                                    <span className="text-[10px] text-zinc-500 w-16">{cornerNames[cornerMode.userSelectedCorner]}</span>
                                                                    <input
                                                                        type="range"
                                                                        min="0"
                                                                        max="24"
                                                                        value={val}
                                                                        onChange={(e) => {
                                                                            const newParts = [...parts];
                                                                            newParts[cornerIdx] = `${e.target.value}px`;
                                                                            updateTheme('userMessage', 'borderRadius', newParts.join(' '));
                                                                        }}
                                                                        className="flex-1 h-1.5 accent-violet-500"
                                                                    />
                                                                    <span className="text-xs text-zinc-400 w-8 text-right font-mono">{val}px</span>
                                                                </div>
                                                            );
                                                        })()}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                            <div>
                                                <label className="block text-xs font-medium text-zinc-400 mb-2">Font Size</label>
                                                <input
                                                    type="text"
                                                    value={bot.theme.userMessage.font?.size || "14px"}
                                                    onChange={(e) => {
                                                        const font = { ...bot.theme.userMessage.font, size: e.target.value };
                                                        updateTheme("userMessage", "font", font);
                                                    }}
                                                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-700 rounded-lg text-sm text-white focus:outline-none focus:border-violet-500"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-zinc-400 mb-2">Font Weight</label>
                                                <select
                                                    value={bot.theme.userMessage.font?.weight || "400"}
                                                    onChange={(e) => {
                                                        const font = { ...bot.theme.userMessage.font, weight: e.target.value };
                                                        updateTheme("userMessage", "font", font);
                                                    }}
                                                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-700 rounded-lg text-sm text-white focus:outline-none focus:border-violet-500"
                                                >
                                                    <option value="300">Light</option>
                                                    <option value="400">Regular</option>
                                                    <option value="500">Medium</option>
                                                    <option value="600">SemiBold</option>
                                                    <option value="700">Bold</option>
                                                </select>
                                            </div>
                                        </div>
                                    </>
                                )}

                                {/* Launcher Config */}
                                {selectedSection === "launcher" && (
                                    <>
                                        <div>
                                            <label className="block text-xs font-medium text-zinc-400 mb-2">Button Color</label>
                                            <div className="flex gap-2">
                                                <input
                                                    type="color"
                                                    value={bot.theme.launcher.bgColor}
                                                    onChange={(e) => updateTheme("launcher", "bgColor", e.target.value)}
                                                    className="w-10 h-10 rounded cursor-pointer border-0 p-0 bg-transparent"
                                                />
                                                <input
                                                    type="text"
                                                    value={bot.theme.launcher.bgColor}
                                                    onChange={(e) => updateTheme("launcher", "bgColor", e.target.value)}
                                                    className="flex-1 px-3 py-2 bg-zinc-950 border border-zinc-700 rounded-lg text-sm text-white uppercase font-mono"
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-zinc-400 mb-2">Icon Color</label>
                                            <div className="flex gap-2">
                                                <input
                                                    type="color"
                                                    value={bot.theme.launcher.iconColor}
                                                    onChange={(e) => updateTheme("launcher", "iconColor", e.target.value)}
                                                    className="w-10 h-10 rounded cursor-pointer border-0 p-0 bg-transparent"
                                                />
                                                <input
                                                    type="text"
                                                    value={bot.theme.launcher.iconColor}
                                                    onChange={(e) => updateTheme("launcher", "iconColor", e.target.value)}
                                                    className="flex-1 px-3 py-2 bg-zinc-950 border border-zinc-700 rounded-lg text-sm text-white uppercase font-mono"
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-zinc-400 mb-2">Shape</label>
                                            <div className="flex gap-2">
                                                {[
                                                    { label: "Square", value: "8px", preview: "rounded-md" },
                                                    { label: "Rounded", value: "16px", preview: "rounded-2xl" },
                                                    { label: "Circle", value: "50%", preview: "rounded-full" },
                                                ].map((opt) => (
                                                    <button
                                                        key={opt.value}
                                                        type="button"
                                                        onClick={() => updateTheme("launcher", "borderRadius", opt.value)}
                                                        className={`flex-1 flex flex-col items-center gap-1.5 p-2 rounded-lg border transition-all ${(bot.theme.launcher.borderRadius === opt.value || (!bot.theme.launcher.borderRadius && opt.value === "50%"))
                                                            ? "border-violet-500 bg-violet-500/10 text-white"
                                                            : "border-zinc-700 bg-zinc-950 text-zinc-400 hover:border-zinc-600"
                                                            }`}
                                                    >
                                                        <div className={`w-8 h-8 bg-zinc-600 ${opt.preview}`} />
                                                        <span className="text-[10px] font-medium">{opt.label}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-zinc-400 mb-2">Custom Icon (SVG/HTML)</label>
                                            <textarea
                                                value={bot.theme.launcher.icon || ""}
                                                onChange={(e) => updateTheme("launcher", "icon", e.target.value)}
                                                placeholder="Paste SVG code here..."
                                                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-700 rounded-lg text-sm text-white focus:outline-none focus:border-violet-500 font-mono text-[10px] min-h-[60px]"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-zinc-400 mb-2">Custom Close Icon (SVG/HTML)</label>
                                            <textarea
                                                value={bot.theme.launcher.closeIcon || ""}
                                                onChange={(e) => updateTheme("launcher", "closeIcon", e.target.value)}
                                                placeholder="Paste SVG code here..."
                                                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-700 rounded-lg text-sm text-white focus:outline-none focus:border-violet-500 font-mono text-[10px] min-h-[60px]"
                                            />
                                            <p className="text-[10px] text-zinc-500 mt-1">Click the launcher in the preview to toggle and verify.</p>
                                        </div>

                                        <div className="border-t border-zinc-800 my-4 pt-4">
                                            <label className="block text-xs font-semibold text-zinc-300 mb-3">Border</label>
                                            <div className="space-y-3">
                                                <div>
                                                    <label className="block text-xs font-medium text-zinc-400 mb-2">Border Color</label>
                                                    <div className="flex gap-2">
                                                        <input
                                                            type="color"
                                                            value={bot.theme.launcher.borderColor || "#000000"}
                                                            onChange={(e) => updateTheme("launcher", "borderColor", e.target.value)}
                                                            className="w-10 h-10 rounded cursor-pointer border-0 p-0 bg-transparent"
                                                        />
                                                        <input
                                                            type="text"
                                                            value={bot.theme.launcher.borderColor || ""}
                                                            onChange={(e) => updateTheme("launcher", "borderColor", e.target.value)}
                                                            placeholder="transparent"
                                                            className="flex-1 px-3 py-2 bg-zinc-950 border border-zinc-700 rounded-lg text-sm text-white font-mono"
                                                        />
                                                    </div>
                                                </div>
                                                <div>
                                                    <div className="flex items-center justify-between mb-1.5">
                                                        <label className="text-xs font-medium text-zinc-400">Border Width</label>
                                                        <span className="text-xs text-zinc-500 font-mono">
                                                            {parseInt(bot.theme.launcher.borderWidth || "") || 0}px
                                                        </span>
                                                    </div>
                                                    <input
                                                        type="range"
                                                        min={0}
                                                        max={8}
                                                        value={parseInt(bot.theme.launcher.borderWidth || "") || 0}
                                                        onChange={(e) => updateTheme("launcher", "borderWidth", `${e.target.value}px`)}
                                                        className="w-full h-1.5 accent-violet-500"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Sizing — sliders for size / icon size / offsets */}
                                        <div className="border-t border-zinc-800 my-4 pt-4">
                                            <label className="block text-xs font-semibold text-zinc-300 mb-3">Size & Position</label>
                                            <div className="space-y-4">
                                                {([
                                                    { key: "size", label: "Button size", min: 40, max: 120, fallback: 60 },
                                                    { key: "iconSize", label: "Icon size", min: 16, max: 56, fallback: 28 },
                                                    { key: "offsetX", label: "Offset from side", min: 0, max: 80, fallback: 20 },
                                                    { key: "offsetY", label: "Offset from top/bottom", min: 0, max: 80, fallback: 20 },
                                                ] as const).map(({ key, label, min, max, fallback }) => {
                                                    const raw = (bot.theme.launcher as Record<string, string | undefined>)?.[key];
                                                    const px = parseInt(raw || "") || fallback;
                                                    return (
                                                        <div key={key}>
                                                            <div className="flex items-center justify-between mb-1.5">
                                                                <label className="text-xs font-medium text-zinc-400">{label}</label>
                                                                <span className="text-xs text-zinc-500 font-mono">{px}px</span>
                                                            </div>
                                                            <input
                                                                type="range"
                                                                min={min}
                                                                max={max}
                                                                value={px}
                                                                onChange={(e) => updateTheme("launcher", key, `${e.target.value}px`)}
                                                                className="w-full h-1.5 accent-violet-500"
                                                            />
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>

                                        <div className="border-t border-zinc-800 my-4 pt-4">
                                            <label className="block text-xs font-semibold text-zinc-300 mb-3">Close State (when widget is open)</label>
                                            <div className="space-y-3">
                                                <div>
                                                    <label className="block text-xs font-medium text-zinc-400 mb-2">Close Button Background</label>
                                                    <div className="flex gap-2">
                                                        <input
                                                            type="color"
                                                            value={bot.theme.launcher.closeBgColor || bot.theme.launcher.bgColor || "#8b5cf6"}
                                                            onChange={(e) => updateTheme("launcher", "closeBgColor", e.target.value)}
                                                            className="w-10 h-10 rounded cursor-pointer border-0 p-0 bg-transparent"
                                                        />
                                                        <input
                                                            type="text"
                                                            value={bot.theme.launcher.closeBgColor || ""}
                                                            onChange={(e) => updateTheme("launcher", "closeBgColor", e.target.value)}
                                                            placeholder="Defaults to button color"
                                                            className="flex-1 px-3 py-2 bg-zinc-950 border border-zinc-700 rounded-lg text-sm text-white font-mono"
                                                        />
                                                    </div>
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-medium text-zinc-400 mb-2">Close Icon Color</label>
                                                    <div className="flex gap-2">
                                                        <input
                                                            type="color"
                                                            value={bot.theme.launcher.closeIconColor || bot.theme.launcher.iconColor || "#ffffff"}
                                                            onChange={(e) => updateTheme("launcher", "closeIconColor", e.target.value)}
                                                            className="w-10 h-10 rounded cursor-pointer border-0 p-0 bg-transparent"
                                                        />
                                                        <input
                                                            type="text"
                                                            value={bot.theme.launcher.closeIconColor || ""}
                                                            onChange={(e) => updateTheme("launcher", "closeIconColor", e.target.value)}
                                                            placeholder="Defaults to icon color"
                                                            className="flex-1 px-3 py-2 bg-zinc-950 border border-zinc-700 rounded-lg text-sm text-white font-mono"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </>
                                )}

                                {/* Common Config */}
                                {selectedSection === "common" && (
                                    <>
                                        <div>
                                            <label className="block text-xs font-medium text-zinc-400 mb-2">Font Family</label>
                                            <select
                                                value={bot.theme.common.fontFamily}
                                                onChange={(e) => updateTheme("common", "fontFamily", e.target.value)}
                                                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-700 rounded-lg text-sm text-white focus:outline-none focus:border-violet-500"
                                            >
                                                <option value="Inter, sans-serif">Inter</option>
                                                <option value="Roboto, sans-serif">Roboto</option>
                                                <option value="'Open Sans', sans-serif">Open Sans</option>
                                                <option value="system-ui, sans-serif">System UI</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-zinc-400 mb-2">Corner Radius</label>
                                            <select
                                                value={bot.theme.common.borderRadius}
                                                onChange={(e) => updateTheme("common", "borderRadius", e.target.value)}
                                                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-700 rounded-lg text-sm text-white focus:outline-none focus:border-violet-500"
                                            >
                                                <option value="0rem">Square (0px)</option>
                                                <option value="0.5rem">Medium (8px)</option>
                                                <option value="0.75rem">Large (12px)</option>
                                                <option value="1rem">Rounded (16px)</option>
                                                <option value="1.5rem">Extra Rounded (24px)</option>
                                            </select>
                                        </div>
                                    </>
                                )}
                            </div>

                            {/* Chat Window Config */}
                            {selectedSection === "chatWindow" && (
                                <>
                                    <div>
                                        <label className="block text-xs font-medium text-zinc-400 mb-2">Page Background</label>
                                        <div className="flex gap-2">
                                            <input
                                                type="color"
                                                value={bot.theme.chatWindow?.backgroundColor || "#ffffff"}
                                                onChange={(e) => setBot({
                                                    ...bot,
                                                    theme: {
                                                        ...bot.theme,
                                                        chatWindow: { ...bot.theme.chatWindow, backgroundColor: e.target.value }
                                                    }
                                                })}
                                                className="w-10 h-10 rounded cursor-pointer border-0 p-0 bg-transparent"
                                            />
                                            <input
                                                type="text"
                                                value={bot.theme.chatWindow?.backgroundColor || "#ffffff"}
                                                onChange={(e) => setBot({
                                                    ...bot,
                                                    theme: {
                                                        ...bot.theme,
                                                        chatWindow: { ...bot.theme.chatWindow, backgroundColor: e.target.value }
                                                    }
                                                })}
                                                className="flex-1 px-3 py-2 bg-zinc-950 border border-zinc-700 rounded-lg text-sm text-white uppercase font-mono"
                                            />
                                        </div>
                                    </div>

                                    {/* Chat-area icon (empty state) */}
                                    <div className="border-t border-zinc-800 my-4 pt-4">
                                        <label className="block text-xs font-semibold text-zinc-300 mb-3">Chat Area Icon</label>
                                        <div className="space-y-3">
                                            <div>
                                                <label className="block text-xs font-medium text-zinc-400 mb-2">Icon Color</label>
                                                <div className="flex gap-2">
                                                    <input
                                                        type="color"
                                                        value={bot.theme.chatWindow?.emptyStateIconColor || bot.theme.botMessage?.textColor || "#1f2937"}
                                                        onChange={(e) => updateTheme("chatWindow", "emptyStateIconColor", e.target.value)}
                                                        className="w-10 h-10 rounded cursor-pointer border-0 p-0 bg-transparent"
                                                    />
                                                    <input
                                                        type="text"
                                                        value={bot.theme.chatWindow?.emptyStateIconColor || ""}
                                                        onChange={(e) => updateTheme("chatWindow", "emptyStateIconColor", e.target.value)}
                                                        placeholder="Defaults to bot text color"
                                                        className="flex-1 px-3 py-2 bg-zinc-950 border border-zinc-700 rounded-lg text-sm text-white font-mono"
                                                    />
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-zinc-400 mb-2">Icon Background</label>
                                                <div className="flex gap-2">
                                                    <input
                                                        type="color"
                                                        value={bot.theme.chatWindow?.emptyStateIconBgColor || bot.theme.botMessage?.bgColor || "#f3f4f6"}
                                                        onChange={(e) => updateTheme("chatWindow", "emptyStateIconBgColor", e.target.value)}
                                                        className="w-10 h-10 rounded cursor-pointer border-0 p-0 bg-transparent"
                                                    />
                                                    <input
                                                        type="text"
                                                        value={bot.theme.chatWindow?.emptyStateIconBgColor || ""}
                                                        onChange={(e) => updateTheme("chatWindow", "emptyStateIconBgColor", e.target.value)}
                                                        placeholder="Defaults to bot bubble color"
                                                        className="flex-1 px-3 py-2 bg-zinc-950 border border-zinc-700 rounded-lg text-sm text-white font-mono"
                                                    />
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-zinc-400 mb-2">Custom Icon (SVG)</label>
                                                <textarea
                                                    value={bot.theme.chatWindow?.emptyStateIcon || ""}
                                                    onChange={(e) => updateTheme("chatWindow", "emptyStateIcon", e.target.value)}
                                                    placeholder="Paste SVG code..."
                                                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-700 rounded-lg text-sm text-white focus:outline-none focus:border-violet-500 font-mono text-[10px] min-h-[60px]"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Widget size — slider in px (drives the iframe container) */}
                                    <div className="border-t border-zinc-800 my-4 pt-4">
                                        <label className="block text-xs font-semibold text-zinc-300 mb-3">Widget Size</label>
                                        <div className="space-y-4">
                                            {([
                                                { key: "width", label: "Width", min: 280, max: 560, fallback: 380 },
                                                { key: "height", label: "Height", min: 400, max: 900, fallback: 600 },
                                            ] as const).map(({ key, label, min, max, fallback }) => {
                                                const raw = (bot.theme.chatWindow as Record<string, string | undefined> | undefined)?.[key];
                                                const px = parseInt(raw || "") || fallback;
                                                return (
                                                    <div key={key}>
                                                        <div className="flex items-center justify-between mb-1.5">
                                                            <label className="text-xs font-medium text-zinc-400">{label}</label>
                                                            <span className="text-xs text-zinc-500 font-mono">{px}px</span>
                                                        </div>
                                                        <input
                                                            type="range"
                                                            min={min}
                                                            max={max}
                                                            value={px}
                                                            onChange={(e) => updateTheme("chatWindow", key, `${e.target.value}px`)}
                                                            className="w-full h-1.5 accent-violet-500"
                                                        />
                                                    </div>
                                                );
                                            })}
                                        </div>
                                        <p className="text-[10px] text-zinc-500 mt-2">
                                            Applied by <code className="text-violet-300">embed.js</code> when the widget is loaded on a host site.
                                        </p>
                                    </div>
                                </>
                            )}

                            {/* Input Area Config */}
                            {selectedSection === "inputArea" && (
                                <>
                                    <div>
                                        <label className="block text-xs font-medium text-zinc-400 mb-2">Footer Background</label>
                                        <div className="flex gap-2">
                                            <input
                                                type="color"
                                                value={bot.theme.chatWindow?.footerBackgroundColor || "#ffffff"}
                                                onChange={(e) => setBot({
                                                    ...bot,
                                                    theme: {
                                                        ...bot.theme,
                                                        chatWindow: { ...bot.theme.chatWindow, footerBackgroundColor: e.target.value }
                                                    }
                                                })}
                                                className="w-10 h-10 rounded cursor-pointer border-0 p-0 bg-transparent"
                                            />
                                            <input
                                                type="text"
                                                value={bot.theme.chatWindow?.footerBackgroundColor || "#ffffff"}
                                                onChange={(e) => setBot({
                                                    ...bot,
                                                    theme: {
                                                        ...bot.theme,
                                                        chatWindow: { ...bot.theme.chatWindow, footerBackgroundColor: e.target.value }
                                                    }
                                                })}
                                                className="flex-1 px-3 py-2 bg-zinc-950 border border-zinc-700 rounded-lg text-sm text-white uppercase font-mono"
                                            />
                                        </div>
                                    </div>
                                    <div className="border-t border-zinc-800 my-4 pt-4">
                                        <label className="block text-xs font-semibold text-zinc-300 mb-3">Input Box</label>
                                        <div className="space-y-3">
                                            <div>
                                                <label className="block text-xs font-medium text-zinc-400 mb-2">Background</label>
                                                <div className="flex gap-2">
                                                    <input
                                                        type="color"
                                                        value={bot.theme.inputArea?.backgroundColor || "#ffffff"}
                                                        onChange={(e) => updateTheme("inputArea", "backgroundColor", e.target.value)}
                                                        className="w-10 h-10 rounded cursor-pointer border-0 p-0 bg-transparent"
                                                    />
                                                    <input
                                                        type="text"
                                                        value={bot.theme.inputArea?.backgroundColor || "#ffffff"}
                                                        onChange={(e) => updateTheme("inputArea", "backgroundColor", e.target.value)}
                                                        className="flex-1 px-3 py-2 bg-zinc-950 border border-zinc-700 rounded-lg text-sm text-white uppercase font-mono"
                                                    />
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-zinc-400 mb-2">Text Color</label>
                                                <div className="flex gap-2">
                                                    <input
                                                        type="color"
                                                        value={bot.theme.inputArea?.textColor || "#000000"}
                                                        onChange={(e) => updateTheme("inputArea", "textColor", e.target.value)}
                                                        className="w-10 h-10 rounded cursor-pointer border-0 p-0 bg-transparent"
                                                    />
                                                    <input
                                                        type="text"
                                                        value={bot.theme.inputArea?.textColor || "#000000"}
                                                        onChange={(e) => updateTheme("inputArea", "textColor", e.target.value)}
                                                        className="flex-1 px-3 py-2 bg-zinc-950 border border-zinc-700 rounded-lg text-sm text-white uppercase font-mono"
                                                    />
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-zinc-400 mb-2">Border Color</label>
                                                <div className="flex gap-2">
                                                    <input
                                                        type="color"
                                                        value={bot.theme.inputArea?.borderColor || "#e4e4e7"}
                                                        onChange={(e) => updateTheme("inputArea", "borderColor", e.target.value)}
                                                        className="w-10 h-10 rounded cursor-pointer border-0 p-0 bg-transparent"
                                                    />
                                                    <input
                                                        type="text"
                                                        value={bot.theme.inputArea?.borderColor || ""}
                                                        onChange={(e) => updateTheme("inputArea", "borderColor", e.target.value)}
                                                        placeholder="transparent"
                                                        className="flex-1 px-3 py-2 bg-zinc-950 border border-zinc-700 rounded-lg text-sm text-white font-mono"
                                                    />
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-zinc-400 mb-2">Placeholder Text</label>
                                                <input
                                                    type="text"
                                                    value={bot.theme.inputArea?.placeholderText ?? ""}
                                                    onChange={(e) => updateTheme("inputArea", "placeholderText", e.target.value)}
                                                    placeholder="Type a message..."
                                                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-700 rounded-lg text-sm text-white focus:outline-none focus:border-violet-500"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-zinc-400 mb-2">Placeholder Color</label>
                                                <div className="flex gap-2">
                                                    <input
                                                        type="color"
                                                        value={bot.theme.inputArea?.placeholderColor || "#a1a1aa"}
                                                        onChange={(e) => updateTheme("inputArea", "placeholderColor", e.target.value)}
                                                        className="w-10 h-10 rounded cursor-pointer border-0 p-0 bg-transparent"
                                                    />
                                                    <input
                                                        type="text"
                                                        value={bot.theme.inputArea?.placeholderColor || "#a1a1aa"}
                                                        onChange={(e) => updateTheme("inputArea", "placeholderColor", e.target.value)}
                                                        className="flex-1 px-3 py-2 bg-zinc-950 border border-zinc-700 rounded-lg text-sm text-white uppercase font-mono"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="border-t border-zinc-800 my-4 pt-4">
                                        <label className="block text-xs font-semibold text-zinc-300 mb-3">Send Button</label>
                                        <div className="space-y-3">
                                            <div>
                                                <label className="block text-xs font-medium text-zinc-400 mb-2">Background</label>
                                                <div className="flex gap-2">
                                                    <input
                                                        type="color"
                                                        value={bot.theme.sendButton?.backgroundColor || "#8b5cf6"}
                                                        onChange={(e) => updateTheme("sendButton", "backgroundColor", e.target.value)}
                                                        className="w-10 h-10 rounded cursor-pointer border-0 p-0 bg-transparent"
                                                    />
                                                    <input
                                                        type="text"
                                                        value={bot.theme.sendButton?.backgroundColor || "#8b5cf6"}
                                                        onChange={(e) => updateTheme("sendButton", "backgroundColor", e.target.value)}
                                                        className="flex-1 px-3 py-2 bg-zinc-950 border border-zinc-700 rounded-lg text-sm text-white uppercase font-mono"
                                                    />
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-zinc-400 mb-2">Icon Color</label>
                                                <div className="flex gap-2">
                                                    <input
                                                        type="color"
                                                        value={bot.theme.sendButton?.iconColor || "#ffffff"}
                                                        onChange={(e) => updateTheme("sendButton", "iconColor", e.target.value)}
                                                        className="w-10 h-10 rounded cursor-pointer border-0 p-0 bg-transparent"
                                                    />
                                                    <input
                                                        type="text"
                                                        value={bot.theme.sendButton?.iconColor || "#ffffff"}
                                                        onChange={(e) => updateTheme("sendButton", "iconColor", e.target.value)}
                                                        className="flex-1 px-3 py-2 bg-zinc-950 border border-zinc-700 rounded-lg text-sm text-white uppercase font-mono"
                                                    />
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-zinc-400 mb-2">Custom Icon (SVG)</label>
                                                <textarea
                                                    value={bot.theme.sendButton?.icon || ""}
                                                    onChange={(e) => updateTheme("sendButton", "icon", e.target.value)}
                                                    placeholder="Paste SVG code..."
                                                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-700 rounded-lg text-sm text-white focus:outline-none focus:border-violet-500 font-mono text-[10px] min-h-[60px]"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </>
                            )}

                            {/* ADVANCED — visibility toggles, text overrides, launcher sliders */}
                            {selectedSection === "advanced" && (
                                <div className="space-y-6">
                                    {/* Element visibility toggles */}
                                    <div>
                                        <label className="block text-xs font-semibold text-zinc-300 mb-3">Element visibility</label>
                                        <div className="space-y-2">
                                            {([
                                                { key: "refreshButton", label: "Refresh button (header)" },
                                                { key: "branding", label: "Header subtitle / branding" },
                                                { key: "welcomeSubtitle", label: "Welcome subtitle (empty state)" },
                                                { key: "emptyStateIcon", label: "Empty-state icon" },
                                            ] as const).map(({ key, label }) => {
                                                const shown = isElementShown(key);
                                                return (
                                                    <button
                                                        key={key}
                                                        type="button"
                                                        onClick={() => setElementShow(key, !shown)}
                                                        className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg bg-zinc-950 border border-zinc-800 hover:border-zinc-700 text-left"
                                                    >
                                                        <span className="text-xs text-zinc-300">{label}</span>
                                                        <span className={`relative w-10 h-5 rounded-full transition-colors ${shown ? "bg-emerald-500" : "bg-zinc-700"}`}>
                                                            <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${shown ? "left-5" : "left-0.5"}`} />
                                                        </span>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Customisable text strings */}
                                    <div className="border-t border-zinc-800 pt-4">
                                        <label className="block text-xs font-semibold text-zinc-300 mb-3">Text overrides</label>
                                        <div className="space-y-3">
                                            <div>
                                                <label className="block text-xs font-medium text-zinc-400 mb-1.5">Header subtitle</label>
                                                <input
                                                    type="text"
                                                    value={bot.theme.header?.subtitle ?? ""}
                                                    onChange={(e) => updateTheme("header", "subtitle", e.target.value)}
                                                    placeholder="Powered by Buildx"
                                                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-700 rounded-lg text-sm text-white focus:outline-none focus:border-violet-500"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-zinc-400 mb-1.5">Welcome subtitle</label>
                                                <input
                                                    type="text"
                                                    value={bot.theme.chatWindow?.welcomeSubtitle ?? ""}
                                                    onChange={(e) => updateTheme("chatWindow", "welcomeSubtitle", e.target.value)}
                                                    placeholder="Ask me anything!"
                                                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-700 rounded-lg text-sm text-white focus:outline-none focus:border-violet-500"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-zinc-400 mb-1.5">Input placeholder</label>
                                                <input
                                                    type="text"
                                                    value={bot.theme.inputArea?.placeholderText ?? ""}
                                                    onChange={(e) => updateTheme("inputArea", "placeholderText", e.target.value)}
                                                    placeholder="Type a message..."
                                                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-700 rounded-lg text-sm text-white focus:outline-none focus:border-violet-500"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                </div>
                            )}
                        </div>
                        // </div>
                    )}
                </div>

                {/* Integration Helper */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-medium text-zinc-400">Embed Code</span>
                        <button
                            onClick={handleCopyCode}
                            className="text-xs text-violet-400 hover:text-violet-300 flex items-center gap-1"
                        >
                            {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                            Copy
                        </button>
                    </div>
                    <code className="block bg-black p-2 rounded text-[10px] text-zinc-500 font-mono truncate">
                        &lt;script src=&quot;...&quot; /&gt;
                    </code>
                </div>
            </div>
        </div >
    );
}
