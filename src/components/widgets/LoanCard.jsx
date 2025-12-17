import React, { useState } from 'react';
import { IndianRupee, Calendar, ChevronRight } from 'lucide-react';

const LoanCard = ({ onConfirm, initialData }) => {
    const [amount, setAmount] = useState(initialData?.amount || 500000);
    const [tenure, setTenure] = useState(initialData?.tenure || 24);

    React.useEffect(() => {
        if (initialData) {
            if (initialData.amount) setAmount(initialData.amount);
            if (initialData.tenure) setTenure(initialData.tenure);
        }
    }, [initialData]);

    const interestRate = 12.5;
    const calculateEMI = () => {
        const r = interestRate / 12 / 100;
        const emi = amount * r * Math.pow(1 + r, tenure) / (Math.pow(1 + r, tenure) - 1);
        return Math.round(emi);
    };

    return (
        <div className="bg-white p-8 rounded-3xl shadow-xl shadow-slate-200 border border-white/50 relative overflow-hidden w-full max-w-sm mx-auto">
            {/* Background Decor */}
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-blue-100 rounded-full blur-3xl opacity-50"></div>

            <div className="relative z-10 flex flex-col gap-6">
                <div className="flex flex-col gap-1">
                    <h3 className="text-xl font-bold text-slate-900 tracking-tight">Configure Loan</h3>
                    <p className="text-sm text-slate-500 font-medium">Personal Loan • Fixed Rate {interestRate}%</p>
                </div>

                {/* Amount Slider */}
                <div className="group">
                    <div className="flex justify-between items-end mb-3">
                        <span className="text-sm font-semibold text-slate-600">Amount</span>
                        <span className="text-2xl font-bold text-blue-600 flex items-center tracking-tight">
                            <IndianRupee size={20} className="stroke-[2.5px]" /> {amount.toLocaleString()}
                        </span>
                    </div>
                    <input
                        type="range"
                        min="100000"
                        max="2000000"
                        step="50000"
                        value={amount}
                        onChange={(e) => setAmount(Number(e.target.value))}
                        className="w-full h-2 bg-slate-100 rounded-full appearance-none cursor-pointer accent-blue-600 hover:accent-blue-500 transition-all"
                    />
                </div>

                {/* Tenure Slider */}
                <div className="group">
                    <div className="flex justify-between items-end mb-3">
                        <span className="text-sm font-semibold text-slate-600">Tenure</span>
                        <span className="text-2xl font-bold text-blue-600 flex items-center tracking-tight gap-1">
                            {tenure} <span className="text-sm font-semibold text-slate-400 pt-2">Months</span>
                        </span>
                    </div>
                    <input
                        type="range"
                        min="12"
                        max="60"
                        step="6"
                        value={tenure}
                        onChange={(e) => setTenure(Number(e.target.value))}
                        className="w-full h-2 bg-slate-100 rounded-full appearance-none cursor-pointer accent-blue-600 hover:accent-blue-500 transition-all"
                    />
                </div>

                {/* EMI Summary */}
                <div className="bg-slate-50/80 backdrop-blur-sm p-5 rounded-2xl border border-slate-100 flex justify-between items-center group hover:bg-white hover:shadow-md transition-all">
                    <div>
                        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Monthly EMI</span>
                        <p className="text-3xl font-bold text-slate-900 flex items-center mt-1 tracking-tight">
                            <IndianRupee size={24} className="stroke-[3px]" /> {calculateEMI().toLocaleString()}
                        </p>
                    </div>
                </div>

                <button
                    onClick={() => onConfirm({ amount, tenure, emi: calculateEMI() })}
                    className="w-full py-4 bg-slate-900 hover:bg-black text-white font-bold rounded-2xl shadow-lg shadow-slate-900/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                >
                    Confirm Plan <ChevronRight size={18} />
                </button>
            </div>
        </div>
    );
};

export default LoanCard;
