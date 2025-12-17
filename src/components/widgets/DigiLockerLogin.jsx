import React, { useState } from 'react';
import { Lock, Smartphone, Key, ShieldCheck, ArrowRight, X, Loader2, RefreshCw, ChevronLeft, ChevronRight, Globe, CheckCircle } from 'lucide-react';

const DigiLockerLogin = ({ onClose, onLoginSuccess, isPopup = false }) => {
    // High-level View State
    const [view, setView] = useState('LOGIN'); // LOGIN, SIGNUP_AADHAAR, SIGNUP_DETAILS, CONSENT

    // Login State Machine
    const [loginMethod, setLoginMethod] = useState('Mobile'); // Mobile, Username, Aadhaar
    const [step, setStep] = useState('ENTER_ID'); // ENTER_ID, ENTER_PIN, ENTER_OTP

    // Form Data
    const [mobile, setMobile] = useState('');
    const [username, setUsername] = useState('');
    const [aadhaar, setAadhaar] = useState('');
    const [pin, setPin] = useState('');
    const [otp, setOtp] = useState('');

    // Status
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [tempToken, setTempToken] = useState(null);

    // --- LOGIC HANDLERS ---

    const handleMethodChange = (method) => {
        setLoginMethod(method);
        setStep('ENTER_ID');
        setError('');
        // We preserve entered data (mobile/user/aadhaar) but reset flow
    };

    const handleNextStep = async () => {
        setLoading(true);
        setError('');

        try {
            // ROUTE 1: MOBILE / USERNAME FLOW (ID -> PIN -> OTP)
            if (loginMethod === 'Mobile' || loginMethod === 'Username') {
                if (step === 'ENTER_ID') {
                    // Just validate existence (Mock)
                    if (loginMethod === 'Mobile' && !mobile) throw new Error("Enter Mobile Number");
                    if (loginMethod === 'Username' && !username) throw new Error("Enter Username");
                    // Move to PIN
                    setStep('ENTER_PIN');
                }
                else if (step === 'ENTER_PIN') {
                    // Verify Credentials -> Trigger OTP
                    const payload = {
                        mobile: mobile || '9876543210',
                        pin,
                        type: loginMethod
                    };
                    const res = await fetch('http://localhost:5000/api/digilocker/login', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(payload)
                    });
                    const data = await res.json();
                    if (!data.success) throw new Error(data.message);

                    setTempToken(data.tempToken);
                    setStep('ENTER_OTP');
                }
                else if (step === 'ENTER_OTP') {
                    // Verify OTP -> Move to Consent
                    const res = await fetch('http://localhost:5000/api/digilocker/otp', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ otp, tempToken })
                    });
                    const data = await res.json();
                    if (!data.success) throw new Error(data.message);

                    // Store final token but don't close yet - show Consent
                    setTempToken(data.accessToken); // Reuse state for final token
                    setView('CONSENT');
                }
            }

            // ROUTE 2: AADHAAR FLOW (ID -> OTP -> PIN)
            else if (loginMethod === 'Aadhaar') {
                if (step === 'ENTER_ID') {
                    if (!aadhaar) throw new Error("Enter Aadhaar Number");
                    // Mock: Trigger Aadhaar OTP immediately
                    // In real world, we'd hit an API here to generate OTP
                    await new Promise(r => setTimeout(r, 800)); // Sim delay
                    setStep('ENTER_OTP');
                }
                else if (step === 'ENTER_OTP') {
                    if (otp.length !== 6) throw new Error("Invalid OTP");
                    // Validated OTP -> Now ask for Security PIN
                    setStep('ENTER_PIN');
                }
                else if (step === 'ENTER_PIN') {
                    // Final Verification
                    const res = await fetch('http://localhost:5000/api/digilocker/login', {
                        method: 'POST', // Reusing mock login for simplicity
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ mobile: '9876543210', pin }) // Mock mapping
                    });
                    const data = await res.json();
                    if (!data.success) throw new Error(data.message);

                    setTempToken(data.tempToken); // Getting temp token to swap for access or just fake it
                    // For Aadhaar mock, let's assume valid PIN = Success
                    setView('CONSENT');
                    // We need a valid token for the consent phase, usually obtained after PIN check
                    // Let's assume the previous `login` gave us a tempToken that acts as our session
                }
            }

        } catch (err) {
            setError(err.message || "Something went wrong");
        }
        setLoading(false);
    };

    const handleConsent = (allowed) => {
        if (allowed) {
            // For Aadhaar flow, we might not have the full Access Token yet if we just did PIN check
            // logic above is simplified for Mock. In real apps, checks return tokens.
            // We'll pass whatever token we have or a mock one.
            onLoginSuccess(tempToken || 'mock-access-token-aadhaar');
        } else {
            // User Denied
            if (isPopup) window.close();
            else onClose();
        }
    };

    const resetToHome = () => {
        setView('LOGIN');
        setStep('ENTER_ID');
        setError('');
        setOtp('');
        setPin('');
    };

    // Helper to determine if button should be enabled
    const isNextEnabled = () => {
        if (loading) return false;
        if (step === 'ENTER_ID') {
            if (loginMethod === 'Mobile') return mobile.length >= 10;
            if (loginMethod === 'Username') return username.length >= 3;
            if (loginMethod === 'Aadhaar') return aadhaar.length >= 12;
        }
        if (step === 'ENTER_PIN') return pin.length === 6;
        if (step === 'ENTER_OTP') return otp.length === 6;
        return true;
    };

    return (
        <div className={`
            ${isPopup ? 'h-screen w-full bg-white' : 'fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-[2px] animate-in fade-in duration-200'}
        `}>
            {/* Main Container */}
            <div className={`
                ${isPopup ? 'w-full h-full' : 'bg-white w-full max-w-lg rounded-xl shadow-2xl overflow-hidden h-[600px] border border-slate-300'}
                flex flex-col relative
            `}>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto bg-white relative flex flex-col items-center">

                    {/* Header (Hidden on SignUp step 1 to match native feel if desired, but keeping consistent for now) */}
                    <div className="w-full p-4 flex justify-center items-center gap-4 mt-4 mb-2 shadow-sm border-b border-slate-100 pb-4">
                        <img
                            src="https://img1.digitallocker.gov.in/assets/img/digilocker_logo.png"
                            alt="DigiLocker"
                            className="h-10 object-contain"
                            onError={(e) => { e.target.src = "https://upload.wikimedia.org/wikipedia/commons/thumb/2/27/DigiLocker_logo.png/640px-DigiLocker_logo.png"; }}
                        />
                    </div>

                    <div className="w-full max-w-sm px-6 pb-8 flex-1 flex flex-col">

                        {/* --- VIEW: LOGIN --- */}
                        {view === 'LOGIN' && (
                            <>
                                <h3 className="text-xl font-bold text-slate-800 text-center mb-6 mt-4">
                                    {step === 'ENTER_OTP' ? 'Verify OTP' :
                                        step === 'ENTER_PIN' ? 'Enter Security PIN' :
                                            'Sign In to your account!'}
                                </h3>

                                {/* Tabs (Only show on Step 1) */}
                                {step === 'ENTER_ID' && (
                                    <div className="flex justify-between items-center mb-6 px-1">
                                        {['Mobile', 'Username', 'Aadhaar'].map((method) => (
                                            <button
                                                key={method}
                                                onClick={() => handleMethodChange(method)}
                                                className={`text-sm font-bold py-2 px-4 rounded transition-colors ${loginMethod === method
                                                        ? 'text-white bg-[#007bff] shadow-sm'
                                                        : 'text-[#007bff] hover:bg-blue-50'
                                                    }`}
                                            >
                                                {method}
                                            </button>
                                        ))}
                                    </div>
                                )}

                                <div className="space-y-5">

                                    {/* INPUT: ID (Mobile/User/Aadhaar) */}
                                    {step === 'ENTER_ID' && (
                                        <div className="space-y-1 animate-in fade-in slide-in-from-right-4 duration-300">
                                            <label className="text-sm font-semibold text-[#007bff]">
                                                {loginMethod === 'Mobile' ? 'Mobile Number' : loginMethod}
                                            </label>
                                            <input
                                                type="text"
                                                value={loginMethod === 'Mobile' ? mobile : (loginMethod === 'Username' ? username : aadhaar)}
                                                onChange={(e) => {
                                                    const val = e.target.value;
                                                    if (loginMethod === 'Mobile') setMobile(val);
                                                    else if (loginMethod === 'Username') setUsername(val);
                                                    else setAadhaar(val);
                                                }}
                                                placeholder={
                                                    loginMethod === 'Mobile' ? 'Mobile Number*' :
                                                        loginMethod === 'Aadhaar' ? 'Enter Aadhaar Number*' :
                                                            'Username*'
                                                }
                                                className="w-full px-3 py-2.5 bg-white border border-[#007bff]/50 rounded text-slate-700 outline-none focus:ring-1 focus:ring-[#007bff] focus:border-[#007bff] placeholder:text-slate-400"
                                            />
                                            <p className="text-[10px] text-slate-500">
                                                {loginMethod === 'Mobile' ? 'Enter your registered Mobile Number' : `Enter your registered ${loginMethod}`}
                                            </p>
                                        </div>
                                    )}

                                    {/* INPUT: PIN */}
                                    {step === 'ENTER_PIN' && (
                                        <div className="space-y-1 animate-in fade-in slide-in-from-right-4 duration-300">
                                            <label className="text-sm font-semibold text-slate-500">Security PIN</label>
                                            <div className="relative">
                                                <input
                                                    type="password"
                                                    value={pin}
                                                    onChange={(e) => setPin(e.target.value)}
                                                    placeholder="6 digit security PIN*"
                                                    className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded text-slate-700 outline-none focus:ring-1 focus:ring-[#007bff] focus:border-[#007bff] placeholder:text-slate-400"
                                                    maxLength={6}
                                                />
                                                <div className="absolute right-3 top-3 text-slate-400">
                                                    <Lock size={18} />
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <button className="text-sm text-[#007bff] hover:underline">Forgot security PIN?</button>
                                            </div>
                                        </div>
                                    )}

                                    {/* INPUT: OTP */}
                                    {step === 'ENTER_OTP' && (
                                        <div className="space-y-1 animate-in fade-in slide-in-from-right-4 duration-300">
                                            <p className="text-sm text-green-600 mb-2 text-center">
                                                DigiLocker has sent you an OTP to your registered mobile
                                            </p>
                                            <input
                                                type="text"
                                                value={otp}
                                                onChange={(e) => setOtp(e.target.value)}
                                                placeholder="Enter OTP"
                                                className="w-full px-4 py-3 border border-[#007bff] rounded text-center text-xl tracking-widest outline-none focus:ring-2 focus:ring-[#007bff]/20"
                                                maxLength={6}
                                            />
                                            <div className="flex justify-between text-xs text-slate-500 px-1">
                                                <span>Wait for OTP...</span>
                                                <button className="text-[#007bff] font-semibold">Resend OTP</button>
                                            </div>
                                        </div>
                                    )}

                                    {error && <div className="text-red-500 text-xs text-center">{error}</div>}

                                    <button
                                        onClick={handleNextStep}
                                        disabled={!isNextEnabled()}
                                        className="w-full py-3 text-white rounded font-bold text-lg shadow-sm transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
                                        style={{ backgroundColor: '#64C480' }}
                                    >
                                        {loading ? <Loader2 className="animate-spin mx-auto" size={24} /> :
                                            (step === 'ENTER_OTP' ? "Submit" : "Sign In")
                                        }
                                    </button>

                                    {/* Footer / Back Links */}
                                    <div className="text-center mt-6">
                                        {step === 'ENTER_ID' ? (
                                            <p className="text-sm text-slate-600">
                                                Do not have an account? <span onClick={() => setView('SIGNUP_AADHAAR')} className="text-[#007bff] cursor-pointer hover:underline">Sign Up</span>
                                            </p>
                                        ) : (
                                            <button onClick={() => setStep('ENTER_ID')} className="text-[#007bff] text-sm hover:underline">
                                                Go Back
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </>
                        )}

                        {/* --- VIEW: SIGNUP (AADHAAR) --- */}
                        {view === 'SIGNUP_AADHAAR' && (
                            <div className="pt-2 animate-in fade-in slide-in-from-right-4 duration-300">
                                <h3 className="text-2xl font-bold text-slate-800 mb-1">Sign up</h3>
                                <p className="text-slate-500 text-sm mb-6">It takes just a minute</p>
                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-base font-medium text-slate-700">Enter your Aadhaar Number</label>
                                        <input
                                            type="text"
                                            placeholder="---- ---- ----"
                                            className="w-full px-4 py-3 border border-slate-300 rounded-lg text-lg tracking-widest outline-none focus:border-[#007bff] focus:ring-1 focus:ring-[#007bff]"
                                        />
                                        <p className="text-xs text-slate-500 mt-2">DigiLocker uses Aadhaar to enable authentic document access</p>
                                    </div>
                                    <button
                                        onClick={() => setView('SIGNUP_DETAILS')}
                                        className="w-full py-3 text-white rounded font-bold text-lg shadow-sm bg-[#28a745]"
                                    >
                                        Next
                                    </button>
                                    <div className="text-center pt-4">
                                        <button onClick={resetToHome} className="text-[#663399] text-sm hover:underline">Try another way</button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* --- VIEW: SIGNUP (DETAILS) --- */}
                        {view === 'SIGNUP_DETAILS' && (
                            <div className="pt-0 animate-in fade-in slide-in-from-right-4 duration-300 flex-1 flex flex-col">
                                <h3 className="text-xl font-bold text-slate-800 mb-4 text-center">Creating account is fast and easy!</h3>
                                {/* Simple form for mock */}
                                <div className="space-y-4 overflow-y-auto pr-1 -mr-1 flex-1">
                                    <div className="space-y-1">
                                        <label className="text-xs text-slate-500 font-semibold">Full Name*</label>
                                        <input type="text" className="w-full px-3 py-2 border border-[#007bff] rounded text-sm outline-none" placeholder="Name as per Aadhaar" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs text-slate-500 font-semibold">Mobile Number*</label>
                                        <input type="text" className="w-full px-3 py-2 border border-slate-300 rounded text-sm outline-none" placeholder="Mobile Number" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs text-slate-500 font-semibold">Set 6 digit security PIN*</label>
                                        <input type="password" className="w-full px-3 py-2 border border-slate-300 rounded text-sm outline-none" placeholder="******" />
                                    </div>
                                </div>
                                <div className="mt-4 pt-2 border-t border-slate-100">
                                    <button
                                        onClick={() => setView('CONSENT')} // Jump to consent for mock
                                        className="w-full py-3 text-white rounded font-bold text-lg shadow-sm bg-[#2F80ED]"
                                    >
                                        Submit
                                    </button>
                                    <p className="text-sm text-slate-600 text-center mt-3">
                                        Already have an account? <span onClick={resetToHome} className="text-[#007bff] cursor-pointer hover:underline">Sign In</span>
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* --- VIEW: CONSENT --- */}
                        {view === 'CONSENT' && (
                            <div className="pt-2 animate-in fade-in slide-in-from-right-4 duration-300 flex-1 flex flex-col items-center text-center">
                                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4 text-green-600">
                                    <ShieldCheck size={32} />
                                </div>
                                <h3 className="text-xl font-bold text-slate-800 mb-2">Consent to Share Data</h3>
                                <p className="text-slate-500 text-sm mb-8 px-4">
                                    You are about to share your Verified Documents (PAN, Aadhaar) with <strong className="text-slate-800">Swifty Bank</strong> for KYC verification.
                                </p>

                                <div className="w-full space-y-3 bg-slate-50 p-4 rounded-lg border border-slate-100 mb-8 text-left">
                                    <div className="flex items-center gap-3">
                                        <CheckCircle size={16} className="text-green-500" />
                                        <span className="text-sm text-slate-600">PAN Card Record</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <CheckCircle size={16} className="text-green-500" />
                                        <span className="text-sm text-slate-600">Aadhaar Profile</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <CheckCircle size={16} className="text-green-500" />
                                        <span className="text-sm text-slate-600">Credit Information</span>
                                    </div>
                                </div>

                                <div className="mt-auto w-full space-y-3">
                                    <button
                                        onClick={() => handleConsent(true)}
                                        className="w-full py-3 bg-[#007bff] hover:bg-blue-600 text-white rounded font-bold text-lg shadow-sm transition-all"
                                    >
                                        Allow
                                    </button>
                                    <button
                                        onClick={() => handleConsent(false)}
                                        className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded font-bold text-lg transition-all"
                                    >
                                        Deny
                                    </button>
                                </div>
                            </div>
                        )}

                    </div>

                    {/* Footer Logos (Only show on Login) */}
                    {view === 'LOGIN' && (
                        <div className="absolute bottom-0 w-full p-4 border-t border-slate-100 bg-slate-50 flex justify-center opacity-50 grayscale hover:grayscale-0 transition-all duration-500">
                            <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/2/27/DigiLocker_logo.png/640px-DigiLocker_logo.png" className="h-4 object-contain" alt="DigiLocker" />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DigiLockerLogin;
