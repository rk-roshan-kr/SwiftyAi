import React, { useState, useEffect } from 'react';
import { Terminal, X, RefreshCw, Cpu } from 'lucide-react';

const DevConsole = ({ onClose }) => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(false);

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const res = await fetch('http://localhost:5000/api/dev/logs');
            const data = await res.json();
            setLogs(data);
        } catch (e) {
            console.error("Failed to fetch logs", e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs();
        const interval = setInterval(fetchLogs, 3000); // Auto-refresh
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-[#0d1117] w-full max-w-4xl h-[80vh] rounded-xl shadow-2xl border border-slate-700 flex flex-col font-mono overflow-hidden">

                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-[#161b22]">
                    <div className="flex items-center gap-2 text-emerald-400">
                        <Terminal size={18} />
                        <span className="font-bold tracking-wider">Gemma-3-1b Neural Logs</span>
                    </div>
                    <div className="flex items-center gap-3">
                        {loading && <RefreshCw size={14} className="animate-spin text-slate-500" />}
                        <span className="text-xs text-slate-500">Auto-refresh: ON</span>
                        <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* content */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#0d1117]">
                    {logs.length === 0 && (
                        <div className="flex flex-col items-center justify-center h-full text-slate-600 gap-2">
                            <Cpu size={40} />
                            <p>Waiting for Neural Activity...</p>
                        </div>
                    )}

                    {logs.map((log) => (
                        <div key={log.id} className="border border-slate-800 rounded-lg p-3 bg-[#161b22] text-sm hover:border-slate-700 transition-colors">
                            <div className="flex justify-between items-start mb-2">
                                <span className="text-xs text-slate-500">{new Date(log.timestamp).toLocaleTimeString()}</span>
                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${log.status === 'SUCCESS' ? 'bg-emerald-900/30 text-emerald-400' : 'bg-amber-900/30 text-amber-500'}`}>
                                    {log.status === 'SUCCESS' ? 'ONLINE' : 'OFFLINE'}
                                </span>
                            </div>

                            <div className="mb-2">
                                <span className="text-blue-400 font-bold">USER_INPUT:</span>
                                <p className="text-slate-300 ml-2 mt-1 whitespace-pre-wrap">"{log.userMessage}"</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3 pt-3 border-t border-slate-800">
                                <div>
                                    <span className="text-purple-400 font-bold block mb-1">RAW_LLM_OUTPUT:</span>
                                    <pre className="text-xs text-slate-400 whitespace-pre-wrap bg-black/30 p-2 rounded max-h-40 overflow-y-auto">
                                        {log.rawOutput}
                                    </pre>
                                </div>
                                <div>
                                    <span className="text-emerald-400 font-bold block mb-1">PARSED_ACTION:</span>
                                    <pre className="text-xs text-emerald-300/80 whitespace-pre-wrap bg-emerald-900/10 p-2 rounded font-bold">
                                        {JSON.stringify(log.parsedOutput, null, 2)}
                                    </pre>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

            </div>
        </div>
    );
};

export default DevConsole;
