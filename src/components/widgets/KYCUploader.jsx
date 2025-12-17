import React, { useState } from 'react';
import { UploadCloud, FileText, CheckCircle2, X } from 'lucide-react';
import clsx from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';

const KYCUploader = ({ onUpload }) => {
    const [isDragging, setIsDragging] = useState(false);
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);

    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setIsDragging(true);
        } else if (e.type === "dragleave") {
            setIsDragging(false);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            setFile(e.dataTransfer.files[0]);
        }
    };

    const handleChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const handleUpload = () => {
        if (!file) return;
        setUploading(true);
        // Simulate upload delay
        setTimeout(() => {
            setUploading(false);
            onUpload(file);
        }, 2000);
    };

    return (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 w-full max-w-sm mx-auto">
            <div className="flex flex-col gap-2 mb-6 text-center">
                <h3 className="text-lg font-bold text-slate-900">Upload Documents</h3>
                <p className="text-sm text-slate-500">Please upload your latest Salary Slip for verification.</p>
            </div>

            <AnimatePresence mode="wait">
                {!file ? (
                    <motion.div
                        key="dropzone"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className={clsx(
                            "relative border-2 border-dashed rounded-xl h-48 flex flex-col items-center justify-center transition-all cursor-pointer",
                            isDragging ? "border-blue-500 bg-blue-50" : "border-slate-200 hover:border-slate-300 bg-slate-50/50"
                        )}
                        onDragEnter={handleDrag}
                        onDragLeave={handleDrag}
                        onDragOver={handleDrag}
                        onDrop={handleDrop}
                        onClick={() => document.getElementById('file-upload').click()}
                    >
                        <input
                            id="file-upload"
                            type="file"
                            className="hidden"
                            accept=".pdf,.jpg,.png"
                            onChange={handleChange}
                        />
                        <div className="p-4 bg-white rounded-full shadow-sm mb-3">
                            <UploadCloud size={24} className="text-blue-600" />
                        </div>
                        <p className="text-sm font-medium text-slate-700">Click or drag file here</p>
                        <p className="text-xs text-slate-400 mt-1">PDF, JPG up to 5MB</p>
                    </motion.div>
                ) : (
                    <motion.div
                        key="file-preview"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="flex flex-col gap-4"
                    >
                        <div className="relative p-4 bg-blue-50 border border-blue-100 rounded-xl flex items-center gap-3">
                            <div className="p-2.5 bg-white rounded-lg text-blue-600 shadow-sm">
                                <FileText size={20} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-slate-900 truncate">{file.name}</p>
                                <p className="text-xs text-slate-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                            </div>
                            <button
                                onClick={() => setFile(null)}
                                className="p-1.5 hover:bg-white rounded-full text-slate-400 hover:text-red-500 transition-colors"
                                disabled={uploading}
                            >
                                <X size={16} />
                            </button>

                            {uploading && (
                                <div className="absolute inset-x-0 bottom-0 h-1 bg-blue-200 rounded-b-xl overflow-hidden">
                                    <motion.div
                                        className="h-full bg-blue-600"
                                        initial={{ width: "0%" }}
                                        animate={{ width: "100%" }}
                                        transition={{ duration: 2 }}
                                    />
                                </div>
                            )}
                        </div>

                        <button
                            onClick={handleUpload}
                            disabled={uploading}
                            className="w-full py-3 bg-slate-900 hover:bg-black text-white font-semibold rounded-xl shadow-lg shadow-slate-900/20 transition-all flex items-center justify-center gap-2 group"
                        >
                            {uploading ? (
                                <>Checking Validity...</>
                            ) : (
                                <>Upload & Verify <CheckCircle2 size={18} className="text-emerald-400 group-hover:scale-110 transition-transform" /></>
                            )}
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default KYCUploader;
