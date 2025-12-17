import React from 'react';
import { X, Moon, Bell, Globe, Shield } from 'lucide-react';

const SettingsModal = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-6 m-4 animate-in zoom-in-95 duration-200">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-slate-900">Settings</h2>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                        <X size={20} className="text-slate-500" />
                    </button>
                </div>

                <div className="space-y-2">
                    {/* Dark Mode */}
                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl hover:bg-slate-100 transition-colors">
                        <div className="flex items-center gap-3">
                            <div className="bg-indigo-100 p-2 rounded-xl text-indigo-600"><Moon size={20} /></div>
                            <div>
                                <p className="font-semibold text-slate-700">Dark Mode</p>
                                <p className="text-xs text-slate-500">Easier on the eyes</p>
                            </div>
                        </div>
                        <div className="w-10 h-6 bg-slate-300 rounded-full relative cursor-pointer">
                            <div className="w-4 h-4 bg-white rounded-full absolute top-1 left-1 shadow-sm"></div>
                        </div>
                    </div>

                    {/* Notifications */}
                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl hover:bg-slate-100 transition-colors">
                        <div className="flex items-center gap-3">
                            <div className="bg-amber-100 p-2 rounded-xl text-amber-600"><Bell size={20} /></div>
                            <div>
                                <p className="font-semibold text-slate-700">Notifications</p>
                                <p className="text-xs text-slate-500">Updates & alerts</p>
                            </div>
                        </div>
                        <div className="w-10 h-6 bg-blue-600 rounded-full relative cursor-pointer">
                            <div className="w-4 h-4 bg-white rounded-full absolute top-1 right-1 shadow-sm"></div>
                        </div>
                    </div>

                    {/* Language */}
                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl hover:bg-slate-100 transition-colors">
                        <div className="flex items-center gap-3">
                            <div className="bg-emerald-100 p-2 rounded-xl text-emerald-600"><Globe size={20} /></div>
                            <div>
                                <p className="font-semibold text-slate-700">Language</p>
                                <p className="text-xs text-slate-500">English (India)</p>
                            </div>
                        </div>
                        <span className="text-xs font-bold text-slate-400">EDIT</span>
                    </div>

                    {/* Privacy */}
                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl hover:bg-slate-100 transition-colors">
                        <div className="flex items-center gap-3">
                            <div className="bg-rose-100 p-2 rounded-xl text-rose-600"><Shield size={20} /></div>
                            <div>
                                <p className="font-semibold text-slate-700">Data & Privacy</p>
                                <p className="text-xs text-slate-500">Manage permissions</p>
                            </div>
                        </div>
                        <span className="text-xs font-bold text-slate-400">VIEW</span>
                    </div>
                </div>

                <div className="mt-8 text-center text-xs text-slate-400">
                    Swifty AI Banking Assistant • v1.0.2
                </div>
            </div>
        </div>
    );
};

export default SettingsModal;
