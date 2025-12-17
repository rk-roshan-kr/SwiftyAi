import React from 'react';
import { X, Search, MessageSquare } from 'lucide-react';

const formatDate = (isoString) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    const now = new Date();
    const diff = now - date;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return date.toLocaleDateString('en-US', { weekday: 'short' });
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const HistorySidebar = ({ isOpen, onClose, onSelectChat, onNewChat, sessions = [], currentSessionId }) => {

    return (
        <div className={`fixed inset-y-0 left-0 w-80 bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <h2 className="font-bold text-slate-800">Chat History</h2>
                <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-lg transition-colors">
                    <X size={20} className="text-slate-500" />
                </button>
            </div>

            <div className="p-4 flex flex-col h-full">
                <button
                    onClick={() => { onNewChat(); onClose(); }}
                    className="w-full mb-4 py-3 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-xl font-semibold shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center gap-2"
                >
                    <MessageSquare size={18} />
                    New Chat
                </button>

                <div className="relative mb-4">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input
                        type="text"
                        placeholder="Search chats..."
                        className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                </div>

                <div className="space-y-2 flex-1 overflow-y-auto pb-20">
                    {sessions.length === 0 ? (
                        <div className="text-center text-slate-400 mt-10 flex flex-col items-center gap-2">
                            <MessageSquare size={32} className="opacity-20" />
                            <p className="text-sm">No recent chats</p>
                        </div>
                    ) : (
                        sessions.map(session => {
                            const lastMsg = session.messages[session.messages.length - 1];
                            const preview = lastMsg ? lastMsg.text : "New Conversation";
                            const isActive = session.id === currentSessionId;

                            return (
                                <div
                                    key={session.id}
                                    onClick={() => { onSelectChat(session); onClose(); }} // Close sidebar on selection mobile? Keep open desktop? Let's just select.
                                    className={`p-3 rounded-xl cursor-pointer transition-all group border ${isActive
                                        ? 'bg-blue-50 border-blue-200 shadow-sm'
                                        : 'hover:bg-slate-50 border-transparent hover:border-slate-100'}`}
                                >
                                    <div className="flex justify-between items-start mb-1">
                                        <h3 className={`font-semibold text-sm truncate pr-2 ${isActive ? 'text-blue-700' : 'text-slate-700'}`}>
                                            {session.title || "New Chat"}
                                        </h3>
                                        <span className="text-[10px] text-slate-400 whitespace-nowrap flex-shrink-0">
                                            {formatDate(session.timestamp)}
                                        </span>
                                    </div>
                                    <p className={`text-xs truncate ${isActive ? 'text-blue-500/80' : 'text-slate-500'}`}>
                                        {preview}
                                    </p>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
};

export default HistorySidebar;
