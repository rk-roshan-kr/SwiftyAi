import React, { useState, useEffect } from 'react';
import { X, Building2, BadgeIndianRupee, Loader2, CheckCircle, CreditCard, ShieldCheck, AlertCircle } from 'lucide-react';

const BankVerificationModal = ({ isOpen, onClose, onVerified, customerName = "USER" }) => {
    const [step, setStep] = useState('INPUT'); // INPUT, VERIFYING, SUCCESS
    const [accountNo, setAccountNo] = useState('');
    const [ifsc, setIfsc] = useState('');
    const [error, setError] = useState('');

    // Reset state when opened
    useEffect(() => {
        if (isOpen) {
            setStep('INPUT');
            setAccountNo('');
            setIfsc('');
            setError('');
        }
    }, [isOpen]);

    const handleVerify = () => {
        if (!accountNo || !ifsc) {
            setError("Please enter both Account Number and IFSC Code");
            return;
        }
        if (ifsc.length !== 11) {
            setError("Invalid IFSC Code format");
            return;
        }

        setError('');
        setStep('VERIFYING');

        // Simulation Timeline
        // 0s: Start
        // 1.5s: Penny Dropped
        // 3.0s: Success

        setTimeout(() => {
            setStep('SUCCESS');
            // Mock Success Data
            setTimeout(() => {
                onVerified({
                    bankName: "HDFC Bank",
                    accountNo: accountNo,
                    ifsc: ifsc,
                    verifiedName: customerName.toUpperCase() // Matches mock profile
                });
                onClose();
            }, 1500); // Close after showing success briefly
        }, 3000);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden relative border border-slate-100">

                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-full hover:bg-slate-100"
                >
                    <X size={20} />
                </button>

                {/* Header */}
                <div className="bg-[#f0f6ff] p-6 border-b border-blue-50">
                    <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center mb-3">
                        <Building2 size={24} />
                    </div>
                    <h2 className="text-xl font-bold text-slate-800">Link Bank Account</h2>
                    <p className="text-sm text-slate-500 mt-1">
                        Instant account verification via <strong className="text-blue-600">Penny Drop</strong>.
                    </p>
                </div>

                <div className="p-6">
                    {step === 'INPUT' && (
                        <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">Account Number</label>
                                <div className="relative">
                                    <input
                                        type="password" // Masked for realistic feel initially or just text
                                        value={accountNo}
                                        onChange={(e) => setAccountNo(e.target.value)}
                                        placeholder="Enter Account Number"
                                        className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 font-mono tracking-wider"
                                    />
                                    <CreditCard className="absolute left-3 top-3.5 text-slate-400" size={18} />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">IFSC Code</label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={ifsc}
                                        onChange={(e) => setIfsc(e.target.value.toUpperCase())}
                                        placeholder="e.g. HDFC0001234"
                                        maxLength={11}
                                        className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 font-mono tracking-wider uppercase"
                                    />
                                    <BadgeIndianRupee className="absolute left-3 top-3.5 text-slate-400" size={18} />
                                </div>
                            </div>

                            {error && (
                                <div className="flex items-center gap-2 text-red-500 text-xs bg-red-50 p-2 rounded-lg">
                                    <AlertCircle size={14} /> {error}
                                </div>
                            )}

                            <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 flex gap-3 items-start">
                                <ShieldCheck size={16} className="text-emerald-500 mt-0.5 shrink-0" />
                                <p className="text-xs text-slate-500 leading-relaxed">
                                    We will deposit <strong className="text-slate-700">₹1.00</strong> to your account to verify the beneficiary name matches your registered profile.
                                </p>
                            </div>

                            <button
                                onClick={handleVerify}
                                className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-lg shadow-blue-600/20 active:scale-[0.98] transition-all"
                            >
                                Verify & Link
                            </button>
                        </div>
                    )}

                    {step === 'VERIFYING' && (
                        <div className="flex flex-col items-center justify-center py-8 space-y-6 animate-in fade-in zoom-in duration-300">
                            <div className="relative">
                                <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center animate-pulse">
                                    <Building2 size={32} className="text-blue-500" />
                                </div>
                                <div className="absolute -bottom-2 -right-2 bg-white p-1.5 rounded-full shadow-md border border-slate-100">
                                    <Loader2 size={20} className="text-blue-600 animate-spin" />
                                </div>
                            </div>
                            <div className="text-center space-y-1">
                                <h3 className="text-lg font-bold text-slate-800">Verifying Details...</h3>
                                <p className="text-sm text-slate-400">Initiating Penny Drop Transaction</p>
                            </div>

                            {/* Fake Progress */}
                            <div className="w-full max-w-[200px] bg-slate-100 h-1.5 rounded-full overflow-hidden">
                                <div className="h-full bg-blue-500 w-2/3 animate-[pulse_1s_ease-in-out_infinite]"></div>
                            </div>
                        </div>
                    )}

                    {step === 'SUCCESS' && (
                        <div className="flex flex-col items-center justify-center py-6 space-y-6 animate-in fade-in zoom-in duration-300">
                            <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center">
                                <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center shadow-lg shadow-green-500/30">
                                    <CheckCircle size={32} className="text-white" />
                                </div>
                            </div>
                            <div className="text-center space-y-2">
                                <h3 className="text-xl font-bold text-slate-800">Verification Successful!</h3>
                                <div className="bg-emerald-50 px-4 py-2 rounded-lg border border-emerald-100 inline-block">
                                    <p className="text-emerald-700 font-mono text-sm font-semibold">
                                        Beneficiary: {customerName.toUpperCase()}
                                    </p>
                                </div>
                                <p className="text-sm text-slate-400">Account Linked Successfully</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default BankVerificationModal;
