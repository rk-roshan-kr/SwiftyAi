import React, { useState } from 'react';
import { Sparkles, ArrowRight, Loader2, Smartphone, ShieldCheck } from 'lucide-react';

const AppLoginPage = ({ onLogin }) => {
    const [step, setStep] = useState('MOBILE'); // MOBILE, OTP
    const [mobile, setMobile] = useState('');
    const [otp, setOtp] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSendOtp = (e) => {
        e.preventDefault();
        setLoading(true);
        // Simulate API call
        setTimeout(() => {
            setLoading(false);
            setStep('OTP');
        }, 1500);
    };

    const handleVerifyOtp = (e) => {
        e.preventDefault();
        setLoading(true);
        // Simulate Verify
        setTimeout(() => {
            setLoading(false);

            // Client-Side User Database (Matches server/data/customers.json)
            const USER_DB = {
                "1010101010": { name: "Neha Chopra", email: "neha@example.com" },
                "6666666666": { name: "Sneha Gupta", email: "sneha@example.com" },
                "3333333333": { name: "Rohan Mehta", email: "rohan@example.com" },
                "9999999999": { name: "Arjun Kumar", email: "arjun@example.com" },
                "1111111111": { name: "Amit Patel", email: "amit@example.com" },
                "5555555555": { name: "Vikram Singh", email: "vikram@example.com" },
                "4444444444": { name: "Anjali Desai", email: "anjali@example.com" },
                "8888888888": { name: "Priya Sharma", email: "priya@example.com" },
                "2222222222": { name: "Kavita Reddy", email: "kavita@example.com" },
                "7777777777": { name: "Rahul Verma", email: "rahul@example.com" },
                "9876543210": { name: "Mahesh Kumar", email: "mahesh.kumar@example.com" }
            };

            const user = USER_DB[mobile] || { name: "Guest User", email: "guest@swifty.ai" };

            localStorage.setItem('user_mobile', mobile);
            localStorage.setItem('user_name', user.name);
            localStorage.setItem('user_email', user.email);

            onLogin(); // Trigger success in App.jsx
        }, 1500);
    };

    return (
        <div className="h-screen w-full bg-[#0a0a0a] flex items-center justify-center relative overflow-hidden font-sans">

            {/* Background Effects */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-blue-900/20 via-[#0a0a0a] to-[#0a0a0a]"></div>
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-[100px] animate-pulse"></div>
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-[100px] animate-pulse delay-1000"></div>

            {/* Login Card */}
            <div className="w-full max-w-md p-8 relative z-10 animate-in fade-in slide-in-from-bottom-8 duration-700">

                {/* Brand */}
                <div className="text-center mb-10">
                    <div className="w-16 h-16 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-2xl mx-auto flex items-center justify-center mb-6 shadow-xl shadow-blue-500/20">
                        <Sparkles size={32} className="text-white" />
                    </div>
                    <h1 className="text-4xl font-extrabold text-white tracking-tight mb-2">Swifty AI</h1>
                    <p className="text-slate-400 font-medium">Your Intelligent Financial Assistant</p>
                </div>

                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl">
                    {step === 'MOBILE' ? (
                        <form onSubmit={handleSendOtp} className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">Mobile Number</label>
                                <div className="relative">
                                    <input
                                        type="tel"
                                        value={mobile}
                                        onChange={(e) => setMobile(e.target.value)}
                                        placeholder="98765 43210"
                                        maxLength={10}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 pl-11 text-white placeholder-slate-600 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-mono text-lg tracking-wide"
                                        required
                                    />
                                    <Smartphone className="absolute left-3.5 top-3.5 text-slate-500" size={20} />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={mobile.length < 10 || loading}
                                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-blue-600/20 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {loading ? <Loader2 className="animate-spin" /> : <>Get OTP <ArrowRight size={18} /></>}
                            </button>
                        </form>
                    ) : (
                        <form onSubmit={handleVerifyOtp} className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                            <div className="text-center mb-2">
                                <p className="text-slate-400 text-sm">Enter the OTP sent to <span className="text-blue-400 font-mono">{mobile}</span></p>
                            </div>

                            <div className="space-y-2">
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={otp}
                                        onChange={(e) => setOtp(e.target.value)}
                                        placeholder="• • • • • •"
                                        maxLength={6}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-center text-white placeholder-slate-600 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-mono text-2xl tracking-[0.5em]"
                                        required
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={otp.length < 4 || loading}
                                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-indigo-600/20 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {loading ? <Loader2 className="animate-spin" /> : "Verify & Login"}
                            </button>

                            <button
                                type="button"
                                onClick={() => { setStep('MOBILE'); setOtp(''); }}
                                className="w-full text-sm text-slate-500 hover:text-slate-300 transition-colors"
                            >
                                Edit Mobile Number
                            </button>
                        </form>
                    )}
                </div>

                <div className="mt-8 text-center flex items-center justify-center gap-2 text-slate-600 text-xs font-medium">
                    <ShieldCheck size={14} />
                    <span>Secure Bank-Grade Login</span>
                </div>
            </div>
        </div>
    );
};

export default AppLoginPage;
