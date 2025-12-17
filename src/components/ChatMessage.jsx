import React from 'react';
import { motion } from 'framer-motion';
import { Bot, User, ShieldCheck, LineChart, PenTool } from 'lucide-react';
import clsx from 'clsx';
import ReactMarkdown from 'react-markdown';
import ProductListWidget from './widgets/ProductListWidget';
import RichChatMessage from './RichChatMessage'; // [NEW]

const AgentIcon = ({ type, className }) => {
    switch (type) {
        case 'SALES_AGENT': return <LineChart size={16} className={className} />;
        case 'VERIFICATION_AGENT': return <ShieldCheck size={16} className={className} />;
        case 'UNDERWRITING_AGENT': return <PenTool size={16} className={className} />;
        default: return <Bot size={16} className={className} />;
    }
};

const ChatMessage = ({ message, onSendMessage }) => {
    const isUser = message.sender === 'user';

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={clsx(
                "flex w-full mb-6",
                isUser ? "justify-end" : "justify-start"
            )}
        >
            <div
                className={clsx(
                    "max-w-[85%] md:max-w-[70%] flex gap-3",
                    isUser ? "flex-row-reverse" : "flex-row"
                )}
            >
                {/* Avatar */}
                <div
                    className={clsx(
                        "w-8 h-8 rounded-full flex items-center justify-center shrink-0 border shadow-sm",
                        isUser ? "bg-indigo-100 border-indigo-200 text-indigo-700" : "bg-white border-slate-200 text-slate-600"
                    )}
                >
                    {isUser ? <User size={16} /> : <AgentIcon type={message.agentType} />}
                </div>

                {/* Message Bubble */}
                <div className="flex flex-col gap-1">
                    {!isUser && (
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">
                            {message.agentType?.replace('_', ' ') || 'Assistant'}
                        </span>
                    )}
                    <div className={`
                        relative px-5 py-3.5 rounded-3xl text-sm md:text-base shadow-sm
                        ${isUser
                            ? 'bg-blue-600 text-white rounded-tr-sm'
                            : (message.agentType === 'MasterAgent' || message.agentType === 'MASTER_AGENT')
                                ? 'bg-slate-50 text-slate-500 border border-slate-100 italic text-sm'
                                : 'bg-white text-slate-800 border border-slate-100 rounded-tl-sm shadow-slate-100'}
                    `}>
                        {isUser ? (
                            <p>{message.text}</p>
                        ) : (
                            // [INTEGRATION] User RichChatMessage for Bot to support Images
                            <div className="prose prose-sm md:prose-base max-w-none prose-p:leading-relaxed prose-blue">
                                <RichChatMessage content={message.text} isBot={true} />
                            </div>
                        )}

                    </div>

                    {/* INLINE WIDGETS */}
                    {message.widget === 'PRODUCT_LIST' && (
                        <div className="mt-2 max-w-sm">
                            <ProductListWidget
                                onSelect={(name) => onSendMessage && onSendMessage(`I want the ${name}`)}
                                filterType={message.filterType}
                            />
                        </div>
                    )}

                    <span className="text-[10px] text-slate-400 px-1 opacity-70">
                        {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                </div>
            </div>
        </motion.div>
    );
};

export default ChatMessage;
