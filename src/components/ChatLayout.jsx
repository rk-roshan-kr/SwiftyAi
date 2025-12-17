import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import AgentStatusBadge from './AgentStatusBadge';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';
import AgentWorkspace from './AgentWorkspace';
import ProfilePage from './ProfilePage';
import SettingsModal from './SettingsModal';
import Sidebar from './Sidebar';
import { Menu } from 'lucide-react';

const ChatLayout = ({
    messages,
    activeAgent,
    agentStatus,
    activeWidget,
    widgetData,
    suggestions,
    onSendMessage,
    onWidgetAction,
    onNewChat,
    currentSessionId,
    sessions,
    onSelectSession,
    onDeleteSession,
    stopGeneration // New Prop
}) => {
    const messagesEndRef = useRef(null);
    const [showMobileWorkspace, setShowMobileWorkspace] = useState(false);

    // UI State
    const [activeView, setActiveView] = useState('CHAT');
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [mobileNavOpen, setMobileNavOpen] = useState(false);

    // Desktop Sidebar State
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    // --- HARD SHIELD: UI OVERRIDE ---
    // If we are in Support Mode (Balance/Transactions), FORCE HIDE any widget (e.g. Sanction Letter)
    // This protects against "Zombie Widgets" persisting from previous states.
    const isSupportMode = activeAgent === 'SupportAgent' || activeAgent === 'SUPPORT_AGENT' || activeAgent === 'VerificationAgent';
    const effectiveWidget = isSupportMode ? null : activeWidget;

    useEffect(() => {
        if (activeView === 'CHAT') {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, agentStatus, activeView]);

    useEffect(() => {
        if (effectiveWidget) {
            setShowMobileWorkspace(true);
        } else {
            setShowMobileWorkspace(false);
        }
    }, [effectiveWidget]);

    const userMobile = localStorage.getItem('user_mobile');

    const handleSelectSession = (s) => {
        setActiveView('CHAT');
        onSelectSession(s);
        setMobileNavOpen(false);
    };

    const handleNewChat = () => {
        setActiveView('CHAT');
        onNewChat();
        setMobileNavOpen(false);
    };

    return (
        <div className="flex h-screen w-full bg-slate-50 overflow-hidden font-sans relative">

            {/* Desktop Sidebar (Fixed) */}
            <div className={`hidden md:flex h-full flex-shrink-0 transition-all duration-300 ${isSidebarOpen ? 'w-[260px]' : 'w-14'}`}>
                <Sidebar
                    sessions={sessions}
                    currentSessionId={currentSessionId}
                    onNewChat={handleNewChat}
                    onSelectSession={handleSelectSession}
                    onDeleteSession={onDeleteSession}
                    onOpenProfile={() => setActiveView('PROFILE')}
                    onOpenSettings={() => setSettingsOpen(true)}
                    userMobile={userMobile}
                    isOpen={isSidebarOpen}
                    onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
                />
            </div>

            {/* Mobile Sidebar (Drawer) */}
            <AnimatePresence>
                {mobileNavOpen && (
                    <div className="md:hidden fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" onClick={() => setMobileNavOpen(false)}>
                        <motion.div
                            initial={{ x: '-100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '-100%' }}
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                            className="absolute left-0 top-0 bottom-0 w-[80%] max-w-xs bg-[#171717] shadow-2xl h-full flex flex-col"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <Sidebar
                                sessions={sessions}
                                currentSessionId={currentSessionId}
                                onNewChat={handleNewChat}
                                onSelectSession={handleSelectSession}
                                onDeleteSession={onDeleteSession}
                                onOpenProfile={() => { setActiveView('PROFILE'); setMobileNavOpen(false); }}
                                onOpenSettings={() => { setSettingsOpen(true); setMobileNavOpen(false); }}
                                userMobile={userMobile}
                                isOpen={true}
                                onToggle={() => setMobileNavOpen(false)}
                            />
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col relative min-w-0 bg-white shadow-2xl overflow-hidden border-l border-slate-200/50">
                {activeView === 'CHAT' ? (
                    <>
                        {/* Header */}
                        <header className="h-14 border-b border-slate-100 bg-white/80 backdrop-blur-md flex items-center justify-between px-4 z-20 sticky top-0">
                            <div className="flex items-center gap-3">
                                <button onClick={() => setMobileNavOpen(true)} className="md:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                                    <Menu size={20} />
                                </button>
                                <div className="flex flex-col">
                                    <h1 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                                        Swifty AI <span className="px-1.5 py-0.5 bg-slate-100 text-[10px] text-slate-500 rounded-md">Beta</span>
                                    </h1>
                                </div>
                            </div>
                            <AgentStatusBadge agentType={activeAgent} status={agentStatus} />
                        </header>

                        {/* Chat Messages */}
                        <div className="flex-1 overflow-y-auto px-4 py-6 md:px-20 scroll-smooth">
                            <div className="max-w-3xl mx-auto flex flex-col pt-4 pb-2">
                                {messages.map((msg) => (
                                    <ChatMessage
                                        key={msg.id}
                                        message={msg}
                                        onSendMessage={onSendMessage}
                                    />
                                ))}
                                {(agentStatus === 'typing' || agentStatus === 'analyzing') && (
                                    <div className="flex justify-start mb-6">
                                        <div className="bg-white border border-slate-100 px-4 py-3 rounded-2xl rounded-tl-sm shadow-sm flex gap-3 items-center">
                                            <div className="relative">
                                                <div className="absolute inset-0 bg-blue-400 rounded-full opacity-20 animate-ping"></div>
                                                <div className="relative bg-blue-50 text-blue-600 p-1.5 rounded-full">
                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="animate-pulse">
                                                        <path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z" />
                                                        <path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z" />
                                                        <path d="M15 13a4.5 4.5 0 0 1-3-4 4.5 4.5 0 0 1-3 4" />
                                                        <path d="M17.599 6.5a3 3 0 0 0 .399-1.375" />
                                                        <path d="M6.003 5.125A3 3 0 0 0 6.401 6.5" />
                                                        <path d="M3.477 10.896a4 4 0 0 1 .585-.396" />
                                                        <path d="M19.938 10.5a4 4 0 0 1 .585.396" />
                                                        <path d="M6 18a4 4 0 0 1-1.97-1.375" />
                                                        <path d="M18 18a4 4 0 0 0 1.97-1.375" />
                                                    </svg>
                                                </div>
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-xs font-semibold text-slate-700">Swifty is thinking</span>
                                                <span className="text-[10px] text-slate-400">Processing request...</span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                <div ref={messagesEndRef} />
                            </div>
                        </div>

                        {/* Input Area */}
                        <div className="w-full bg-white z-20 relative">
                            {/* Suggestion Chips */}
                            {suggestions && suggestions.length > 0 && agentStatus === 'idle' && (
                                <div className="absolute bottom-full left-0 w-full p-4 flex gap-2 overflow-x-auto no-scrollbar justify-start md:justify-center bg-gradient-to-t from-white via-white/80 to-transparent mask-linear-fade flex-nowrap">
                                    {suggestions.map((s, i) => (
                                        <button
                                            key={i}
                                            onClick={() => onSendMessage(s)}
                                            className="px-4 py-2 bg-white/80 backdrop-blur-md border border-blue-200 text-blue-600 rounded-full text-sm font-medium hover:bg-blue-50 hover:scale-105 hover:shadow-md transition-all animate-in slide-in-from-bottom-2 fade-in shadow-sm whitespace-nowrap flex-shrink-0"
                                        >
                                            {s}
                                        </button>
                                    ))}
                                </div>
                            )}
                            <div className="max-w-3xl mx-auto">
                                <ChatInput
                                    onSend={onSendMessage}
                                    onStop={stopGeneration}
                                    agentStatus={agentStatus}
                                />
                            </div>
                        </div>
                    </>
                ) : (
                    <ProfilePage />
                )}
            </div>

            {/* Overlays */}
            <SettingsModal isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />

            {/* Workspace Panel (Desktop) - Only show in CHAT view */}
            {activeView === 'CHAT' && (
                <div className={`hidden lg:flex transition-all duration-300 ease-in-out border-l border-slate-200 bg-slate-50 ${effectiveWidget ? 'w-[450px]' : 'w-0 opacity-0 overflow-hidden'}`}>
                    <AgentWorkspace
                        className="w-full h-full"
                        activeWidget={effectiveWidget}
                        widgetData={widgetData}
                        onAction={onWidgetAction}
                        onClose={() => onWidgetAction('CLOSE')}
                    />
                </div>
            )}

            {/* Mobile Workspace */}
            {showMobileWorkspace && activeView === 'CHAT' && (
                <div className="lg:hidden fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/20 backdrop-blur-[2px]">
                    <div className="bg-white w-full sm:w-[400px] h-[80vh] sm:h-auto sm:max-h-[90vh] rounded-t-3xl sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-300">
                        <AgentWorkspace
                            className="w-full h-full"
                            activeWidget={activeWidget}
                            widgetData={widgetData}
                            onAction={onWidgetAction}
                            onClose={() => setShowMobileWorkspace(false)}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export default ChatLayout;
