import React from 'react';
import { motion } from 'framer-motion';
import { Bot, LineChart, ShieldCheck, PenTool } from 'lucide-react';

const agentConfig = {
    MASTER_AGENT: {
        name: 'Master Command',
        color: 'bg-slate-800',
        icon: Bot,
        pulseColor: 'bg-slate-400',
        borderColor: 'border-slate-300'
    },
    SALES_AGENT: {
        name: 'Sales Intelligence',
        color: 'bg-blue-600',
        icon: LineChart,
        pulseColor: 'bg-blue-400',
        borderColor: 'border-blue-200'
    },
    VERIFICATION_AGENT: {
        name: 'Identity & Fraud',
        color: 'bg-emerald-600',
        icon: ShieldCheck,
        pulseColor: 'bg-emerald-400',
        borderColor: 'border-emerald-200'
    },
    UNDERWRITING_AGENT: {
        name: 'Risk Engine',
        color: 'bg-violet-600',
        icon: PenTool,
        pulseColor: 'bg-violet-400',
        borderColor: 'border-violet-200'
    },
    SANCTION_AGENT: {
        name: 'Approvals',
        color: 'bg-indigo-600',
        icon: Bot,
        pulseColor: 'bg-indigo-400',
        borderColor: 'border-indigo-200'
    }
};

const AgentStatusBadge = ({ agentType, status }) => {
    const config = agentConfig[agentType] || agentConfig['MASTER_AGENT'];
    const Icon = config.icon;

    if (status === 'idle') return null;

    return (
        <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex items-center gap-3 bg-white/90 backdrop-blur-md pl-1.5 pr-4 py-1.5 rounded-full shadow-lg border ${config.borderColor} w-fit`}
        >
            <div className="relative flex items-center justify-center">
                <motion.div
                    className={`absolute w-full h-full rounded-full ${config.pulseColor} opacity-50`}
                    animate={{ scale: [1, 1.8, 1], opacity: [0.5, 0, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                />
                <div className={`relative z-10 p-2 rounded-full ${config.color} text-white shadow-inner`}>
                    <Icon size={14} />
                </div>
            </div>
            <div className="flex flex-col">
                <span className="text-xs font-bold text-slate-800 tracking-tight">{config.name}</span>
                <span className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold flex items-center gap-1">
                    {status === 'routing' ? 'Routing Request...' : status === 'analyzing' ? 'Processing Data...' : 'Generating Response...'}
                </span>
            </div>
        </motion.div>
    );
};

export default AgentStatusBadge;
