import React, { useState } from 'react';
import { ShieldCheck, ScanLine, Loader2, CheckCircle, XCircle, ExternalLink } from 'lucide-react';

const KYCWidget = ({ onComplete }) => {
    const [pan, setPan] = useState('');
    const [status, setStatus] = useState('IDLE'); // IDLE, VERIFYING, SUCCESS, ERROR
    const [feedback, setFeedback] = useState('');

    // Listen for Popup Success
    React.useEffect(() => {
        const handleMessage = (event) => {
            if (event.data?.type === 'DIGILOCKER_LOGIN_SUCCESS' && event.data.token) {
                console.log("Popup Token Received:", event.data.token);
                handleDigiLockerSuccess(event.data.token);
            }
        };
        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, []);

    const openDigiLockerPopup = () => {
        const width = 450;
        const height = 700;
        const left = (window.screen.width - width) / 2;
        const top = (window.screen.height - height) / 2;

        window.open(
            '/digilocker-signin',
            'DigiLocker Login',
            `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes,status=yes`
        );
    };

    const handleVerify = async () => {
        if (!pan) return;
        setStatus('VERIFYING');

        try {
            const response = await fetch('http://localhost:5000/api/kyc/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: 'PAN', value: pan.toUpperCase() })
            });

            const data = await response.json();

            if (data.success) {
                setStatus('SUCCESS');
                setFeedback(`Verified: ${data.data.name}`);
                setTimeout(() => onComplete(data.data), 1500);
            } else {
                setStatus('ERROR');
                setFeedback(data.message);
            }
        } catch (error) {
            console.error(error);
            setStatus('ERROR');
            setFeedback("Server connection failed. Ensure backend is running.");
        }
    };

    const handleDigiLockerSuccess = async (accessToken) => {
        setShowDigiLocker(false);
        setStatus('VERIFYING');
        setFeedback("Fetching Verified Documents...");

        try {
            const response = await fetch('http://localhost:5000/api/digilocker/documents', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ accessToken })
            });
            const data = await response.json();

            if (data.success) {
                setStatus('SUCCESS');
                setFeedback(`Verified via DigiLocker: ${data.userProfile.name}`);
                // Transform to match expected format
                const kycData = {
                    name: data.userProfile.name,
                    creditScore: 780, // Mock score helper
                    verificationId: "DIGI-" + Date.now(),
                    source: "DigiLocker",
                    documents: data.documents
                };
                setTimeout(() => onComplete(kycData), 1500);
            } else {
                setStatus('ERROR');
                setFeedback("Failed to fetch documents.");
            }
        } catch (e) {
            setStatus('ERROR');
            setFeedback("DigiLocker Connection Error");
        }
    };

    return (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 max-w-sm w-full mx-auto my-2">
            {/* Header */}
            <div className="flex items-center gap-3 mb-4 border-b border-slate-100 pb-3">
                <div className="bg-blue-100 p-2 rounded-xl">
                    <ScanLine className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                    <h3 className="font-bold text-sm text-slate-800">Verification Agent</h3>
                    <p className="text-xs text-slate-500 font-medium">Official Government ID Check</p>
                </div>
            </div>

            {/* Input Zone */}
            <div className="space-y-4">
                {/* DigiLocker Option */}
                <button
                    onClick={openDigiLockerPopup}
                    disabled={status === 'SUCCESS'}
                    className="w-full py-3 bg-[#663399]/5 hover:bg-[#663399]/10 border border-[#663399]/20 text-[#663399] rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2"
                >
                    <img src="https://img1.dighilocker.gov.in/assets/img/digilocker_logo.png" alt="" className="h-5 object-contain opacity-80" onError={(e) => e.target.style.display = 'none'} />
                    {status === 'SUCCESS' ? 'Linked' : 'Connect DigiLocker'} <ExternalLink size={14} />
                </button>

                <div className="relative flex py-1 items-center">
                    <div className="flex-grow border-t border-slate-100"></div>
                    <span className="flex-shrink mx-2 text-slate-300 text-xs font-medium">OR MANUAL</span>
                    <div className="flex-grow border-t border-slate-100"></div>
                </div>

                <div>
                    <label className="text-xs font-semibold text-slate-600 mb-1.5 block uppercase tracking-wider">PAN Number</label>
                    <input
                        type="text"
                        placeholder="ABCDE1234F"
                        maxLength={10}
                        value={pan}
                        onChange={(e) => setPan(e.target.value.toUpperCase())}
                        className="w-full p-3 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none uppercase tracking-widest font-mono transition-all bg-slate-50 focus:bg-white placeholder:text-slate-300"
                        disabled={status === 'SUCCESS'}
                    />
                </div>

                {/* Action Button & Status */}
                <button
                    onClick={handleVerify}
                    disabled={status === 'VERIFYING' || status === 'SUCCESS' || !pan}
                    className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-600/10 active:scale-[0.98]
            ${status === 'SUCCESS' ? 'bg-emerald-500 text-white shadow-emerald-500/20' : 'bg-blue-600 hover:bg-blue-700 text-white'}
            ${(status === 'VERIFYING' || (!pan && status !== 'VERIFYING')) ? 'opacity-70 cursor-not-allowed transform-none' : ''}
            ${status === 'ERROR' ? 'bg-red-500 hover:bg-red-600 shadow-red-500/20' : ''}
          `}
                >
                    {status === 'VERIFYING' && <Loader2 className="w-4 h-4 animate-spin" />}
                    {status === 'SUCCESS' && <CheckCircle className="w-4 h-4" />}
                    {status === 'ERROR' && <XCircle className="w-4 h-4" />}

                    {status === 'IDLE' && "Verify PAN"}
                    {status === 'VERIFYING' && "Checking Database..."}
                    {status === 'SUCCESS' && "Verified"}
                    {status === 'ERROR' && "Retry Verification"}
                </button>

                {/* Feedback Text */}
                {feedback && (
                    <div className={`text-xs text-center font-medium py-1 px-2 rounded-lg ${status === 'SUCCESS' ? 'text-emerald-700 bg-emerald-50' : 'text-blue-600 bg-blue-50'}`}>
                        {feedback}
                    </div>
                )}
            </div>

        </div>
    );
};

export default KYCWidget;
