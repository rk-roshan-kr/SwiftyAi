import React from 'react';
import { Send, Mic, Paperclip } from 'lucide-react';

const ChatInput = ({ onSend, onStop, agentStatus = 'idle' }) => {
    const [input, setInput] = React.useState('');
    const isTyping = agentStatus === 'typing' || agentStatus === 'analyzing';

    const handleSubmit = (e) => {
        e.preventDefault();
        if (input.trim() && !isTyping) {
            onSend(input);
            setInput('');
        }
    };

    return (
        <form
            onSubmit={handleSubmit}
            className="bg-white p-4 border-t border-slate-200 flex items-center gap-3 shadow-sm"
        >
            <button
                type="button"
                className="p-2 text-slate-400 hover:text-slate-600 transition-colors rounded-full hover:bg-slate-100"
            >
                <Paperclip size={20} />
            </button>

            <div className="flex-1 relative">
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={isTyping ? "Swifty is thinking..." : "Type a message..."}
                    disabled={isTyping}
                    className="w-full bg-slate-50 border border-slate-200 rounded-full py-3 px-5 pr-12 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all placeholder:text-slate-400 disabled:opacity-50"
                />
                <button
                    type="button"
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-200/50 transition-colors"
                >
                    <Mic size={18} />
                </button>
            </div>

            {isTyping ? (
                <button
                    type="button"
                    onClick={onStop}
                    className="p-3 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-md shadow-red-500/20 animate-in zoom-in spin-in-90 duration-200 flex items-center justify-center w-[46px] h-[46px]"
                    title="Stop Generating"
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                        <rect x="4" y="4" width="16" height="16" rx="2" />
                    </svg>
                </button>
            ) : (
                <button
                    type="submit"
                    disabled={!input.trim()}
                    className="p-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-blue-600/20"
                >
                    <Send size={20} />
                </button>
            )}
        </form>
    );
};

export default ChatInput;
