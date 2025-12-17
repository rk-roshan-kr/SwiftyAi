import React, { useState, useEffect, useCallback } from 'react';
import {
    Shield, CheckCircle, Loader2, ArrowRight, Building2, User, Wallet,
    Plus, Copy, ShieldCheck, RefreshCw, Smartphone, Mail, AlertCircle,
    ExternalLink, LogOut, Lock, History, Fingerprint, ChevronRight, Save, X
} from 'lucide-react';
import BankVerificationModal from './BankVerificationModal';

// --- 1. ASSETS & ICONS ---
const DigiLockerLogo = ({ className }) => (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M19.5 3h-15A1.5 1.5 0 003 4.5v15A1.5 1.5 0 004.5 21h15a1.5 1.5 0 001.5-1.5v-15A1.5 1.5 0 0019.5 3zm-3.75 12.75h-7.5a.75.75 0 010-1.5h7.5a.75.75 0 010 1.5zm0-3.75h-7.5a.75.75 0 010-1.5h7.5a.75.75 0 010 1.5z" />
        <path d="M12 7.5a2.25 2.25 0 100 4.5 2.25 2.25 0 000-4.5z" />
    </svg>
);

const IndianEmblem = ({ className }) => (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M12 2L4 5v6c0 5.55 3.84 10.74 8 12 4.16-1.26 8-6.45 8-12V5l-8-3z" />
        <path d="M12 6a2 2 0 100 4 2 2 0 000-4zm-2 9h4v2h-4v-2z" />
    </svg>
);

// --- 2. LOGIC HOOKS ---
const useDigiLocker = (onSuccess, onError) => {
    const [isConnecting, setIsConnecting] = useState(false);

    useEffect(() => {
        const handleMessage = (event) => {
            // In prod: if (event.origin !== "https://api.digilocker.gov.in") return;
            if (event.data?.type === 'DIGILOCKER_LOGIN_SUCCESS' && event.data.token) {
                onSuccess(event.data.token);
            }
        };
        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, [onSuccess]);

    const connect = useCallback(() => {
        setIsConnecting(true);
        // Open the popup
        const width = 500;
        const height = 700;
        const left = (window.screen.width - width) / 2;
        const top = (window.screen.height - height) / 2;
        const popup = window.open('/digilocker-signin', 'DigiLocker', `width=${width},height=${height},top=${top},left=${left}`);

        // Optional: Poll to see if popup is closed (to reset loading state if user cancels)
        const timer = setInterval(() => {
            if (popup.closed) {
                clearInterval(timer);
                setIsConnecting(false);
            }
        }, 1000);

    }, []);

    return { connect, isConnecting, setIsConnecting };
};

// --- 3. UI COMPONENTS ---

const IDCard = ({ type, data, theme }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(data.idNumber);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className={`relative w-full aspect-[1.586/1] rounded-2xl overflow-hidden shadow-lg transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 group ${theme}`}>
            {/* Decorative Background Elements */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-8 -mt-8 pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-black/5 rounded-full blur-xl -ml-4 -mb-4 pointer-events-none"></div>

            {/* Content Layer */}
            <div className="relative h-full p-6 flex flex-col justify-between z-10">
                <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-white/20 backdrop-blur-md rounded-lg shadow-inner">
                            <IndianEmblem className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h4 className="text-xs font-bold text-white/90 uppercase tracking-widest">{type}</h4>
                            <p className="text-[10px] text-white/70 font-medium">Govt. of India</p>
                        </div>
                    </div>
                    {data.isVerified && <div className="bg-emerald-400/20 backdrop-blur-md text-emerald-100 text-[10px] font-bold px-2 py-1 rounded-full border border-emerald-400/30 flex items-center gap-1"><CheckCircle size={10} /> Verified</div>}
                </div>

                <div className="mt-4">
                    <p className="text-[10px] text-white/60 font-medium uppercase tracking-wider mb-1">Identity Number</p>
                    <div className="flex items-center gap-3 cursor-pointer group/copy" onClick={handleCopy}>
                        <span className="text-xl sm:text-2xl font-mono font-bold text-white tracking-widest drop-shadow-sm">
                            {data.idNumber}
                        </span>
                        {copied ? <CheckCircle size={16} className="text-emerald-400" /> : <Copy size={16} className="text-white/50 opacity-0 group-hover/copy:opacity-100 transition-opacity" />}
                    </div>
                </div>

                <div className="flex justify-between items-end mt-auto pt-4 border-t border-white/10">
                    <div>
                        <p className="text-[9px] text-white/60 font-medium uppercase">Name</p>
                        <p className="text-sm font-bold text-white tracking-wide">{data.name}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-[9px] text-white/60 font-medium uppercase">DOB</p>
                        <p className="text-sm font-bold text-white tracking-wide">{data.dob}</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

const TrustScore = ({ score }) => {
    // Calculate progress circle
    const radius = 24;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (score / 100) * circumference;

    return (
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-center justify-between">
            <div>
                <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Trust Score</p>
                <h3 className="text-2xl font-bold text-slate-900">{score}/100</h3>
                <p className="text-xs text-emerald-600 font-medium mt-1">Excellent Standing</p>
            </div>
            <div className="relative w-16 h-16 flex items-center justify-center">
                <svg className="w-full h-full rotate-[-90deg]">
                    <circle cx="32" cy="32" r={radius} className="fill-none stroke-slate-100" strokeWidth="6" />
                    <circle
                        cx="32" cy="32" r={radius}
                        className="fill-none stroke-emerald-500 transition-all duration-1000 ease-out"
                        strokeWidth="6"
                        strokeDasharray={circumference}
                        strokeDashoffset={offset}
                        strokeLinecap="round"
                    />
                </svg>
                <ShieldCheck className="absolute text-emerald-500 w-6 h-6" />
            </div>
        </div>
    );
};

// --- 4. MAIN PAGE ---

const ProfilePage = () => {
    // --- STATE ---
    const [user, setUser] = useState({
        name: localStorage.getItem('user_name') || "Swifty User",
        email: localStorage.getItem('user_email') || "user@swifty.ai",
        phone: localStorage.getItem('user_mobile') || "+91 98765 43210",
        role: "Power User",
        joinDate: "Aug 2023",
        avatar: "https://api.dicebear.com/9.x/bottts/svg?seed=Felix"
    });

    const [isEditing, setIsEditing] = useState(false);
    const [isConnected, setIsConnected] = useState(() => localStorage.getItem('digilocker_connected') === 'true');
    const [docs, setDocs] = useState(() => {
        const saved = localStorage.getItem('digilocker_docs');
        return saved ? JSON.parse(saved) : null;
    });

    const [showBankModal, setShowBankModal] = useState(false);
    const [bankAccounts, setBankAccounts] = useState(() => {
        const saved = localStorage.getItem('bank_accounts');
        return saved ? JSON.parse(saved) : [];
    });

    // --- HANDLERS ---
    const handleDigiLockerSuccess = (token) => {
        setTimeout(() => {
            const fetchedDocs = {
                pan: { idNumber: "ABCDE1234F", name: user.name.toUpperCase(), dob: "15-08-1995", isVerified: true },
                aadhaar: { idNumber: "4589 1256 9012", name: user.name, dob: "15-08-1995", isVerified: true }
            };
            setDocs(fetchedDocs);
            setIsConnected(true);
            digiLocker.setIsConnecting(false);

            localStorage.setItem('digilocker_connected', 'true');
            localStorage.setItem('digilocker_docs', JSON.stringify(fetchedDocs));
        }, 1500);
    };

    const handleUnlink = () => {
        setIsConnected(false);
        setDocs(null);
        localStorage.removeItem('digilocker_connected');
        localStorage.removeItem('digilocker_docs');
    };

    const [security, setSecurity] = useState(() => {
        const saved = localStorage.getItem('security_settings');
        return saved ? JSON.parse(saved) : { twoFactor: true, biometric: false };
    });

    const syncToBackend = async (data) => {
        try {
            await fetch('http://localhost:5000/api/user/update', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    mobile: user.phone, // Identity
                    ...data
                })
            });
            console.log("Synced to backend:", data);
        } catch (error) {
            console.error("Sync failed:", error);
        }
    };

    const handleBankVerified = (newAccount) => {
        const updated = [...bankAccounts, newAccount];
        setBankAccounts(updated);
        localStorage.setItem('bank_accounts', JSON.stringify(updated));
        syncToBackend({ linkedAccounts: updated });
    };

    const toggleSecurity = (key) => {
        const newSettings = { ...security, [key]: !security[key] };
        setSecurity(newSettings);
        localStorage.setItem('security_settings', JSON.stringify(newSettings));
        syncToBackend({ securitySettings: newSettings });
    };

    const handleSaveProfile = async () => {
        setIsEditing(false);
        // Persist local
        localStorage.setItem('user_name', user.name);
        localStorage.setItem('user_email', user.email);
        localStorage.setItem('user_mobile', user.phone);

        // Sync to Backend
        try {
            await fetch('http://localhost:5000/api/user/update', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: user.name,
                    email: user.email,
                    mobile: user.phone
                })
            });
            console.log("Profile updated on backend.");
        } catch (error) {
            console.error("Failed to sync profile change:", error);
        }
    };

    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

    const handleLogout = () => {
        setShowLogoutConfirm(true);
    };

    const confirmLogout = () => {
        console.log("Logout Confirmed");
        localStorage.clear();
        localStorage.removeItem('app_authenticated');
        // Close modal first (though reload will kill it anyway)
        setShowLogoutConfirm(false);
        window.location.reload();
    };

    const digiLocker = useDigiLocker(handleDigiLockerSuccess, alert);

    return (
        <div className="min-h-screen bg-[#F8FAFC] font-sans text-slate-900 pb-20 overflow-y-auto relative">
            {/* LOGOUT CONFIRMATION MODAL */}
            {showLogoutConfirm && (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-[2px] p-4 sm:p-0 animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl shadow-2xl p-6 w-full max-w-sm scale-100 animate-in zoom-in-95 slide-in-from-bottom-10 sm:slide-in-from-bottom-0 duration-200 border border-slate-100 ring-1 ring-slate-900/5">
                        <div className="w-14 h-14 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mb-5 mx-auto shadow-sm ring-1 ring-red-100">
                            <LogOut size={26} strokeWidth={2.5} />
                        </div>
                        <h3 className="text-xl font-bold text-center text-slate-900 mb-2">Sign Out?</h3>
                        <p className="text-sm text-slate-500 text-center mb-8 px-2 leading-relaxed font-medium">
                            You will need to sign in again to access your dashboard and secured documents.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowLogoutConfirm(false)}
                                className="flex-1 py-3 rounded-xl font-bold text-slate-600 bg-slate-50 hover:bg-slate-100 transition-colors border border-slate-200/50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmLogout}
                                className="flex-1 py-3 rounded-xl font-bold text-white bg-slate-900 hover:bg-slate-800 transition-colors shadow-lg shadow-slate-900/20"
                            >
                                Sign Out
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* --- HERO HEADER --- */}
            <div className="bg-white border-b border-slate-200 sticky top-0 z-30">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col md:flex-row md:items-center justify-between py-6 gap-6">

                        {/* User Info */}
                        <div className="flex items-center gap-6">
                            <div className="relative">
                                <div className="w-20 h-20 rounded-full p-1 bg-gradient-to-tr from-indigo-500 to-purple-500 shadow-lg">
                                    <div className="w-full h-full bg-white rounded-full p-0.5 overflow-hidden">
                                        <img src={user.avatar} alt="Avatar" className="w-full h-full object-cover" />
                                    </div>
                                </div>
                                <div className="absolute bottom-0 right-0 w-6 h-6 bg-emerald-500 border-4 border-white rounded-full flex items-center justify-center text-white text-[10px]">
                                    <CheckCircle size={10} fill="currentColor" className="text-white" />
                                </div>
                            </div>

                            <div className="flex-1 min-w-0">
                                {isEditing ? (
                                    <div className="space-y-2">
                                        <input
                                            type="text"
                                            value={user.name}
                                            onChange={(e) => setUser({ ...user, name: e.target.value })}
                                            className="block w-full px-3 py-1 text-sm font-bold text-slate-900 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                            placeholder="Your Name"
                                        />
                                        <div className="flex gap-2">
                                            <input
                                                type="email"
                                                value={user.email}
                                                onChange={(e) => setUser({ ...user, email: e.target.value })}
                                                className="block w-full px-3 py-1 text-xs text-slate-600 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                                placeholder="Email"
                                            />
                                            <input
                                                type="text"
                                                value={user.phone}
                                                onChange={(e) => setUser({ ...user, phone: e.target.value })}
                                                className="block w-full px-3 py-1 text-xs text-slate-600 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                                placeholder="Phone"
                                            />
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <div className="flex items-center gap-3 mb-1">
                                            <h1 className="text-2xl font-bold text-slate-900">{user.name}</h1>
                                            <span className="bg-indigo-50 text-indigo-700 border border-indigo-100 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide">
                                                {user.role}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-4 text-sm text-slate-500 font-medium">
                                            <span className="flex items-center gap-1.5"><Mail size={14} /> {user.email}</span>
                                            <span className="flex items-center gap-1.5"><Smartphone size={14} /> {user.phone}</span>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-3">
                            <button
                                onClick={handleLogout}
                                className="px-4 py-2 border border-slate-200 text-slate-700 font-semibold rounded-xl text-sm hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors flex items-center gap-2"
                            >
                                <LogOut size={16} /> Sign Out
                            </button>
                            <button
                                onClick={isEditing ? handleSaveProfile : () => setIsEditing(true)}
                                className={`px-4 py-2 border font-semibold rounded-xl text-sm transition-colors flex items-center gap-2 ${isEditing ? 'bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-500' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'}`}
                            >
                                {isEditing ? <><Save size={16} /> Save Profile</> : "Edit Profile"}
                            </button>
                            <button
                                onClick={() => window.location.reload()}
                                className="px-4 py-2 bg-slate-900 text-white font-semibold rounded-xl text-sm shadow-lg shadow-slate-900/20 hover:bg-slate-800 transition-all flex items-center gap-2"
                            >
                                <Building2 size={16} /> Dashboard
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* --- MAIN CONTENT GRID --- */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                    {/* LEFT COLUMN (Content) - Span 8 */}
                    <div className="lg:col-span-8 flex flex-col gap-8">

                        {/* 1. IDENTITY VAULT */}
                        <section>
                            <div className="flex justify-between items-end mb-5">
                                <div>
                                    <h2 className="text-xl font-bold text-slate-900">Identity Vault</h2>
                                    <p className="text-sm text-slate-500 mt-1">Manage your government verified documents.</p>
                                </div>
                                {isConnected && (
                                    <button onClick={handleUnlink} className="text-xs font-bold text-red-500 bg-red-50 hover:bg-red-100 px-4 py-2 rounded-xl border border-red-100 transition-colors">
                                        Unlink
                                    </button>
                                )}
                            </div>

                            <div className="bg-white rounded-[2rem] border border-slate-200 p-2 shadow-sm min-h-[300px] relative overflow-hidden">
                                {!isConnected ? (
                                    // LOCKED STATE
                                    <div className="h-[300px] rounded-[1.5rem] bg-slate-900 relative overflow-hidden flex flex-col items-center justify-center text-center p-8 group">
                                        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20"></div>
                                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent"></div>

                                        <div className="relative z-10 max-w-md">
                                            <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl ring-1 ring-white/20 group-hover:scale-110 transition-transform duration-500">
                                                <DigiLockerLogo className="w-10 h-10 text-white" />
                                            </div>
                                            <h3 className="text-2xl font-bold text-white mb-3">Sync Your Digital Identity</h3>
                                            <p className="text-slate-400 text-sm mb-8 leading-relaxed">
                                                Connect DigiLocker to instantly fetch your verified <strong>PAN</strong> and <strong>Aadhaar</strong>.
                                                Secure, Government Approved, and Paperless.
                                            </p>
                                            <button
                                                onClick={digiLocker.connect}
                                                disabled={digiLocker.isConnecting}
                                                className="w-full sm:w-auto bg-blue-600 hover:bg-blue-500 text-white px-8 py-3.5 rounded-xl font-bold text-sm shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center gap-2"
                                            >
                                                {digiLocker.isConnecting ? <Loader2 className="animate-spin" /> : "Connect DigiLocker"}
                                                {!digiLocker.isConnecting && <ArrowRight size={16} />}
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    // UNLOCKED STATE (Cards)
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 animate-in fade-in zoom-in duration-500">
                                        <IDCard
                                            type="Permanent Account Number"
                                            data={docs.pan}
                                            theme="bg-gradient-to-br from-[#1e3a8a] to-[#3b82f6]" // Deep Blue
                                        />
                                        <IDCard
                                            type="Aadhaar Card"
                                            data={docs.aadhaar}
                                            theme="bg-gradient-to-br from-slate-700 to-slate-900" // Dark Slate
                                        />
                                    </div>
                                )}
                            </div>
                        </section>

                        {/* 2. ACTIVITY HISTORY (New addition) */}
                        <section>
                            <h2 className="text-lg font-bold text-slate-900 mb-4">Recent Activity</h2>
                            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                                {[1, 2, 3].map((i) => (
                                    <div key={i} className="flex items-center justify-between p-4 border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                                                {i === 1 ? <ShieldCheck size={18} /> : i === 2 ? <Building2 size={18} /> : <User size={18} />}
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-slate-900">{i === 1 ? "Identity Verified" : i === 2 ? "Bank Account Added" : "Profile Updated"}</p>
                                                <p className="text-xs text-slate-500">2 days ago • via Web</p>
                                            </div>
                                        </div>
                                        <span className="text-xs font-semibold text-slate-400 bg-slate-50 px-2 py-1 rounded">Completed</span>
                                    </div>
                                ))}
                                <div className="p-3 bg-slate-50 text-center border-t border-slate-100">
                                    <button className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center justify-center gap-1">
                                        View Full History <ChevronRight size={12} />
                                    </button>
                                </div>
                            </div>
                        </section>

                    </div>

                    {/* RIGHT COLUMN (Sidebar) - Span 4 */}
                    <div className="lg:col-span-4 flex flex-col gap-6">

                        {/* 1. TRUST SCORE CARD */}
                        <TrustScore score={isConnected ? 92 : 45} />

                        {/* 2. FINANCIAL HUB */}
                        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                                <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                    <Wallet size={18} className="text-indigo-600" /> Linked Accounts
                                </h3>
                                <button
                                    onClick={() => setShowBankModal(true)}
                                    className="p-1.5 hover:bg-indigo-50 text-indigo-600 rounded-lg transition-colors"
                                >
                                    <Plus size={18} />
                                </button>
                            </div>

                            <div className="p-2">
                                {bankAccounts.length === 0 ? (
                                    /* Empty State */
                                    <div className="p-4 rounded-xl border border-dashed border-slate-200 flex flex-col items-center text-center gap-3 bg-slate-50/50 m-2">
                                        <div className="w-10 h-10 bg-white rounded-full shadow-sm flex items-center justify-center">
                                            <Building2 size={18} className="text-slate-300" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-slate-600">No Banks Linked</p>
                                            <p className="text-[10px] text-slate-400 mt-0.5">Link a primary account for payouts.</p>
                                        </div>
                                        <button
                                            onClick={() => setShowBankModal(true)}
                                            className="text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 px-4 py-2 rounded-lg w-full transition-colors"
                                        >
                                            Add Account
                                        </button>
                                    </div>
                                ) : (
                                    /* List of Accounts */
                                    <div className="flex flex-col gap-2 m-2">
                                        {bankAccounts.map((ac, idx) => (
                                            <div key={idx} className="group p-3 bg-white rounded-xl border border-slate-200 shadow-sm hover:border-indigo-200 hover:shadow-md transition-all flex items-center gap-3">
                                                <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center text-xl shadow-inner shrink-0">
                                                    🏦
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="font-bold text-slate-900 text-xs truncate" title={ac.bankName}>{ac.bankName}</h4>
                                                    <p className="text-[10px] text-slate-400 font-mono mt-0.5 tracking-wide uppercase">•••• {ac.accountNo.slice(-4)}</p>
                                                </div>
                                                <div className="w-2 h-2 bg-green-500 rounded-full shadow-sm"></div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* 3. SECURITY SETTINGS */}
                        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                            <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                                <Lock size={18} className="text-slate-400" /> Security
                            </h3>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg"><Smartphone size={16} /></div>
                                        <div>
                                            <p className="text-sm font-bold text-slate-700">2-Factor Auth</p>
                                            <p className="text-[10px] text-slate-400">Enabled via SMS</p>
                                        </div>
                                    </div>
                                    <div
                                        onClick={() => toggleSecurity('twoFactor')}
                                        className={`w-8 h-4 rounded-full relative cursor-pointer transition-colors ${security.twoFactor ? 'bg-green-500' : 'bg-slate-200'}`}
                                    >
                                        <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full shadow-sm transition-transform ${security.twoFactor ? 'right-0.5' : 'left-0.5'}`}></div>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-slate-50 text-slate-500 rounded-lg"><Fingerprint size={16} /></div>
                                        <div>
                                            <p className="text-sm font-bold text-slate-700">Biometric Login</p>
                                            <p className="text-[10px] text-slate-400">Fingerprint / Face ID</p>
                                        </div>
                                    </div>
                                    <div
                                        onClick={() => toggleSecurity('biometric')}
                                        className={`w-8 h-4 rounded-full relative cursor-pointer transition-colors ${security.biometric ? 'bg-green-500' : 'bg-slate-200'}`}
                                    >
                                        <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full shadow-sm transition-transform ${security.biometric ? 'right-0.5' : 'left-0.5'}`}></div>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                                    <button className="text-xs font-bold text-slate-500 hover:text-slate-900 w-full text-left py-1">Change Password</button>
                                    <ChevronRight size={14} className="text-slate-400" />
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </div>

            <BankVerificationModal
                isOpen={showBankModal}
                onClose={() => setShowBankModal(false)}
                onVerified={handleBankVerified}
                customerName={user.name}
            />
        </div>
    );
};


export default ProfilePage;