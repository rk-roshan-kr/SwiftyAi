import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CreditCard, Rocket, Home, Briefcase, ChevronRight, ShieldCheck, PieChart, Wallet } from 'lucide-react';

const ProductListWidget = ({ onSelect, filterType }) => {
    // Determine initial tab based on filter or default to LOAN
    const initialTab = (filterType === 'INVESTMENT' || filterType === 'FD') ? 'INVESTMENT' : 'LOAN';
    const [activeTab, setActiveTab] = useState(initialTab);

    const allProducts = [
        {
            id: 'personal',
            name: 'Flexi-Cash Personal',
            rate: '10.50%',
            limit: 'Max ₹25L',
            type: 'LOAN',
            subtype: 'PERSONAL',
            icon: <Briefcase size={24} className="text-white" />,
            color: 'bg-purple-600'
        },
        {
            id: 'car',
            name: 'Velocity Drive (New)',
            rate: '8.50%',
            limit: 'Max ₹50L',
            type: 'LOAN',
            subtype: 'CAR',
            icon: <Rocket size={24} className="text-white" />,
            color: 'bg-blue-600'
        },
        {
            id: 'fd_tax',
            name: 'TaxShield FD',
            rate: '7.25%',
            limit: 'Lock-in 5yr',
            type: 'INVESTMENT',
            subtype: 'FD',
            icon: <ShieldCheck size={24} className="text-white" />,
            color: 'bg-green-600'
        },
        {
            id: 'fd_growth',
            name: 'SteadyGrowth FD',
            rate: '7.10%',
            limit: 'Guaranteed',
            type: 'INVESTMENT',
            subtype: 'FD',
            icon: <PieChart size={24} className="text-white" />,
            color: 'bg-emerald-500'
        },
        {
            id: 'ppf',
            name: 'PPF (Govt)',
            rate: '7.10%',
            limit: 'Tax-Free',
            type: 'INVESTMENT',
            subtype: 'GOVT',
            icon: <Wallet size={24} className="text-white" />,
            color: 'bg-orange-500'
        },
        {
            id: 'home',
            name: 'DreamNest Home',
            rate: '8.35%',
            limit: 'Max ₹5 Cr',
            type: 'LOAN',
            subtype: 'HOME',
            icon: <Home size={24} className="text-white" />,
            color: 'bg-cyan-600'
        }
    ];

    // Filter Logic based on Active Tab
    const displayedProducts = allProducts.filter(p => p.type === activeTab);

    // strict Mode: Hide tabs if we correspond to a specific category
    const isLoanContext = ['LOAN', 'PERSONAL', 'CAR', 'HOME', 'BIKE'].includes(filterType);
    const isInvestContext = ['INVESTMENT', 'FD', 'PPF'].includes(filterType);

    return (
        <div className="w-full bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
            {/* Header */}
            <div className="bg-slate-900 p-4 text-white">
                <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold text-lg flex items-center gap-2">
                        <Rocket size={20} className="text-blue-400" />
                        Explore Products
                    </h3>
                </div>

                {/* Tabs - Conditionally Rendered */}
                <div className="flex p-1 bg-slate-800 rounded-lg">
                    {!isInvestContext && (
                        <button
                            onClick={() => setActiveTab('LOAN')}
                            className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all flex items-center justify-center gap-2 ${activeTab === 'LOAN' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'}`}
                        >
                            <CreditCard size={14} /> Loans
                        </button>
                    )}

                    {!isLoanContext && (
                        <button
                            onClick={() => setActiveTab('INVESTMENT')}
                            className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all flex items-center justify-center gap-2 ${activeTab === 'INVESTMENT' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'}`}
                        >
                            <PieChart size={14} /> Investments
                        </button>
                    )}
                </div>
            </div>

            {/* List */}
            <div className="p-4 grid grid-cols-1 gap-3 max-h-[400px] overflow-y-auto min-h-[200px]">
                <AnimatePresence mode='wait'>
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                        className="space-y-3"
                    >
                        {displayedProducts.map((p, i) => (
                            <div
                                key={p.id}
                                onClick={() => onSelect && onSelect(p.name)}
                                className="flex items-center gap-4 p-3 rounded-xl border border-slate-100 hover:border-blue-200 hover:bg-slate-50 transition-all cursor-pointer group hover:shadow-sm"
                            >
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center shadow-sm ${p.color} text-white shrink-0`}>
                                    {p.icon}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-bold text-slate-800 text-sm group-hover:text-blue-700 transition-colors truncate">{p.name}</h4>
                                    <div className="flex gap-2 text-[10px] mt-1.5">
                                        <span className={`px-2 py-0.5 rounded-md font-bold tracking-wide border ${p.type === 'INVESTMENT' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-blue-50 text-blue-700 border-blue-200'}`}>
                                            {p.rate}
                                        </span>
                                        <span className="bg-slate-50 text-slate-500 px-2 py-0.5 rounded-md font-medium border border-slate-200 truncate">
                                            {p.limit}
                                        </span>
                                    </div>
                                </div>
                                <ChevronRight size={18} className="text-slate-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
                            </div>
                        ))}
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
};

export default ProductListWidget;
