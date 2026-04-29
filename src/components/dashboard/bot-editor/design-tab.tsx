"use client";

import { useState, useRef, useEffect } from "react";
import { IBotData, IBotTheme } from "@/models/bot.model";
import {
    Palette, MessageSquare, LayoutTemplate,
    Type, MousePointerClick, Settings,
    Copy, Check, Bot, User, MoveHorizontal,
    ChevronLeft, ChevronRight, Send, X
} from "lucide-react";

interface DesignTabProps {
    bot: { theme: IBotTheme; publicId: string;[key: string]: any };
    setBot: (bot: any) => void;
    handleCopyCode: () => void;
    copied: boolean;
}

type DesignSection = "header" | "userMessage" | "botMessage" | "launcher" | "common" | "inputArea" | "chatWindow" | null;

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
        <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-200px)] min-h-[600px]">
            {/* Canvas Area (Center) */}
            <div className="flex-1 bg-zinc-950/50 rounded-2xl border border-zinc-800 relative overflow-hidden flex flex-col items-center justify-center p-8 group">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

                <div className="absolute top-4 left-4 flex items-center gap-2 text-xs text-zinc-500 bg-zinc-900/80 px-3 py-1.5 rounded-full border border-zinc-800">
                    <MousePointerClick className="w-3 h-3" />
                    Click on elements to edit styles
                </div>

                {/* Simulated Widget Container (Iframe Host) */}
                <div className="relative w-full max-w-[380px] h-[700px] flex flex-col items-end justify-end pointer-events-auto">

                    {/* Iframe Container */}
                    <div
                        className={`
                            w-[380px] h-[600px] bg-transparent overflow-hidden origin-bottom-right transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]
                            ${isOpen ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-90 translate-y-4 pointer-events-none'}
                        `}
                        style={{
                            marginBottom: '20px', // Space for launcher spacing
                            boxShadow: bot.theme.common.shadow, // Use shadow from theme config
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
                            onClick={(e) => {
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

                    {/* Launcher */}
                    <div
                        onClick={(e) => {
                            e.stopPropagation();
                            setSelectedSection("launcher");
                            setIsOpen(!isOpen);
                        }}
                        className={`
                            absolute bottom-6 -right-19 w-[60px] h-[60px] rounded-full flex items-center justify-center shadow-lg cursor-pointer z-10
                            transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)]
                            ${selectedSection === "launcher" ? "ring-4 ring-violet-500/50 scale-105" : "hover:scale-105"}
                            hover:shadow-xl
                        `}
                        style={{
                            backgroundColor: bot.theme.launcher.bgColor,
                            fontFamily: bot.theme.common.fontFamily
                        }}
                    >
                        {isOpen ? (
                            <X className="w-7 h-7" style={{ color: bot.theme.launcher.iconColor }} />
                        ) : bot.theme.launcher.icon ? (
                            <div dangerouslySetInnerHTML={{ __html: bot.theme.launcher.icon }} className="flex items-center justify-center" style={{ color: bot.theme.launcher.iconColor }} />
                        ) : (
                            <Bot className="w-7 h-7" style={{ color: bot.theme.launcher.iconColor }} />
                        )}
                    </div>
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
                        &lt;script src="..." /&gt;
                    </code>
                </div>
            </div>
        </div >
    );
}
