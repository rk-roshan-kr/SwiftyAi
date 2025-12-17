import React from 'react';
import { Download, CheckCircle, ShieldCheck } from 'lucide-react';

const SanctionLetter = ({ customerName = "John Doe", amount = "5,00,000", date = new Date().toLocaleDateString(), rate = "12.0", onAccept }) => {
    return (
        <div className="relative bg-white w-full max-w-md mx-auto aspect-[1/1.414] shadow-xl shadow-slate-200 border border-slate-200 rounded-sm overflow-hidden flex flex-col font-serif">
            {/* ... (keep existing lines) ... */}

            {/* Table */}
            <div className="border border-slate-200 rounded-lg overflow-hidden my-4">
                <div className="flex bg-slate-50 border-b border-slate-100 p-2 font-semibold">
                    <span className="flex-1">Approved Amount</span>
                    <span className="flex-1 text-right text-slate-900">₹ {amount}</span>
                </div>
                <div className="flex bg-white p-2">
                    <span className="flex-1">Interest Rate</span>
                    <span className="flex-1 text-right text-slate-900">{rate}% p.a</span>
                </div>
                <div className="flex bg-slate-50 border-t border-slate-100 p-2">
                    <span className="flex-1">Processing Fee</span>
                    <span className="flex-1 text-right text-slate-900">Waived</span>
                </div>
            </div>

            {/* ... (keep existing lines) ... */}

            {/* Action Bar Overlay */}
            <div className="absolute bottom-0 inset-x-0 bg-white/90 backdrop-blur-sm p-4 border-t border-slate-100 flex gap-3">
                <button onClick={onAccept} className="flex-1 bg-slate-900 text-white py-2 rounded-lg font-sans font-semibold text-sm hover:bg-black transition-colors flex items-center justify-center gap-2">
                    <CheckCircle size={16} className="text-emerald-400" /> Accept Offer
                </button>
                <button className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600">
                    <Download size={18} />
                </button>
            </div>
        </div>
    );
};

export default SanctionLetter;
