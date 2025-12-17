import React, { useState, useMemo } from 'react';
import { Plus, MessageSquare, Search, Settings, PanelLeftClose, PanelLeft, Trash2 } from 'lucide-react';

const Sidebar = ({
    sessions = [],
    currentSessionId,
    onNewChat,
    onSelectSession,
    onDeleteSession,
    onOpenProfile,
    onOpenSettings,
    userMobile,
    isOpen,
    onToggle
}) => {
    const [searchTerm, setSearchTerm] = useState('');

    const groupedSessions = useMemo(() => {
        const groups = { Today: [], Yesterday: [], 'Previous 7 Days': [], Older: [] };
        if (!sessions || !Array.isArray(sessions)) return groups; // Crash Protection

        sessions.forEach(session => {
            const date = new Date(session.timestamp || session.createdAt || Date.now());
            const now = new Date();
            const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));

            if (diffDays === 0) groups['Today'].push(session);
            else if (diffDays === 1) groups['Yesterday'].push(session);
            else if (diffDays < 7) groups['Previous 7 Days'].push(session);
            else groups['Older'].push(session);
        });
        return groups;
    }, [sessions]);

    const filteredGroups = useMemo(() => {
        if (!searchTerm) return groupedSessions;
        const lowerTerm = searchTerm.toLowerCase();
        const newGroups = {};
        Object.keys(groupedSessions).forEach(key => {
            const filtered = groupedSessions[key].filter(s =>
                (s.title || "New Chat").toLowerCase().includes(lowerTerm)
            );
            if (filtered.length > 0) newGroups[key] = filtered;
        });
        return newGroups;
    }, [groupedSessions, searchTerm]);

    if (!isOpen) {
        return (
            <div className="h-full bg-[#171717] border-r border-[#333] w-14 flex flex-col items-center py-4 gap-4 transition-all duration-300">
                <button onClick={onToggle} className="p-2 text-gray-400 hover:text-white hover:bg-[#212121] rounded-lg" title="Expand">
                    <PanelLeft size={20} />
                </button>
                <button onClick={onNewChat} className="p-2 text-white bg-[#212121] hover:bg-[#333] rounded-lg" title="New Chat">
                    <Plus size={20} />
                </button>
                <div className="flex-1" />
                <button onClick={onOpenProfile} className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xs text-white font-bold ring-1 ring-white/20">
                    {userMobile ? "U" : "G"}
                </button>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-[#171717] text-gray-100 w-[260px] flex-shrink-0 font-sans border-r border-[#333] transition-all duration-300">
            {/* Header */}
            <div className="p-3 pb-2 flex flex-col gap-2 relative">
                <div className="flex justify-between items-center px-1">
                    <button
                        onClick={onNewChat}
                        className="flex-1 flex items-center gap-2 px-3 py-2 hover:bg-[#212121] rounded-lg transition-colors text-sm font-medium text-white border border-[#333] hover:border-[#444]"
                    >
                        <Plus size={16} />
                        <span>New chat</span>
                    </button>
                    <button onClick={onToggle} className="ml-2 p-2 text-gray-400 hover:text-white hover:bg-[#212121] rounded-lg">
                        <PanelLeftClose size={18} />
                    </button>
                </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto px-3 py-2 custom-scrollbar">
                {/* Search */}
                <div className="mb-4 relative group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                    <input
                        type="text"
                        placeholder="Search..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-[#212121] text-gray-200 rounded-lg py-1.5 pl-9 pr-2 text-xs outline-none focus:ring-1 focus:ring-gray-600 transition-all"
                    />
                </div>

                {Object.entries(filteredGroups).map(([label, group]) => (
                    group.length > 0 && (
                        <div key={label} className="mb-6">
                            <h3 className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-2 px-2">{label}</h3>
                            <div className="flex flex-col gap-0.5">
                                {group.map(session => {
                                    const isActive = session.id === currentSessionId || session.sessionId === currentSessionId;
                                    return (
                                        <div
                                            key={session.id || session.sessionId}
                                            className={`relative group flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-left w-full cursor-pointer transition-all ${isActive
                                                ? 'bg-[#212121] text-white'
                                                : 'text-gray-300 hover:bg-[#212121]'
                                                }`}
                                            onClick={() => onSelectSession(session)}
                                        >
                                            <span className="truncate flex-1 text-xs relative z-10">
                                                {session.title || "New Chat"}
                                            </span>

                                            {/* Mask & Actions */}
                                            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-20 bg-[#212121] pl-2">
                                                <button
                                                    className="text-gray-500 hover:text-red-400"
                                                    onClick={(e) => { e.stopPropagation(); if (onDeleteSession) onDeleteSession(session.sessionId); }}
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )
                ))}
            </div>

            {/* Footer */}
            <div className="p-3 border-t border-[#333] bg-[#171717]">
                <button
                    onClick={onOpenProfile}
                    className="flex items-center gap-3 w-full px-2 py-2 hover:bg-[#212121] rounded-lg transition-colors text-left"
                >
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center font-bold text-xs shadow-inner ring-1 ring-white/10">
                        {userMobile ? "U" : "G"}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-200 truncate">
                            {userMobile ? `User ${userMobile.slice(-4)}` : 'Guest User'}
                        </p>
                    </div>
                    <Settings size={16} className="text-gray-500 hover:text-gray-300" onClick={(e) => { e.stopPropagation(); onOpenSettings(); }} />
                </button>
            </div>
        </div>
    );
};

export default Sidebar;
