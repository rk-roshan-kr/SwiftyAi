import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import LoanCard from './widgets/LoanCard';
import KYCUploader from './widgets/KYCUploader';
import KYCWidget from './widgets/KYCWidget';
import SanctionLetter from './widgets/SanctionLetter';
import ProductListWidget from './widgets/ProductListWidget';
import { X, Sparkles, ScanLine, Rocket } from 'lucide-react';

const AgentWorkspace = ({ activeWidget, widgetData, onAction, onClose, className }) => {

    if (!activeWidget) {
        return (
            <div className={`${className} bg-slate-50 border-l border-slate-200 flex items-center justify-center p-8 text-center`}>
                <div className="flex flex-col items-center gap-4 opacity-50">
                    <div className="p-4 bg-white rounded-full shadow-sm">
                        <Sparkles size={32} className="text-slate-400" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-slate-900">Agent Workspace</h3>
                        <p className="text-sm text-slate-500 max-w-xs">
                            Context-aware tools and widgets will appear here as the agents work on your request.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={`${className} bg-slate-50 border-l border-slate-200 flex flex-col`}>
            <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-white/50 backdrop-blur-sm">
                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                    {activeWidget === 'LOAN_CARD' && <><Sparkles size={16} className="text-blue-600" /> Loan Configuration</>}
                    {activeWidget === 'KYC_WIDGET' && <><ScanLine size={16} className="text-blue-600" /> Identity Verification</>}
                    {activeWidget === 'KYC_UPLOAD' && <><ScanLine size={16} className="text-blue-600" /> Document Upload</>}
                    {activeWidget === 'SANCTION_LETTER' && <><Sparkles size={16} className="text-blue-600" /> Approval</>}
                    {activeWidget === 'PRODUCT_LIST' && <><Rocket size={16} className="text-blue-600" /> Products</>}
                </h3>
                {onClose && (
                    <button onClick={onClose} className="p-1 hover:bg-slate-200 rounded-lg text-slate-500 hover:text-slate-800 transition-colors">
                        <X size={20} />
                    </button>
                )}
            </div>

            <div className="flex-1 p-4 md:p-8 overflow-y-auto flex items-center justify-center">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeWidget}
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -20, scale: 0.95 }}
                        transition={{ duration: 0.3 }}
                        className="w-full max-w-md"
                    >
                        {activeWidget === 'LOAN_CARD' && (
                            <LoanCard
                                onConfirm={(data) => onAction('LOAN_CONFIRMED', data)}
                                initialData={widgetData}
                            />
                        )}
                        {activeWidget === 'KYC_WIDGET' && (
                            <KYCWidget onComplete={(data) => onAction('KYC_COMPLETED', data)} />
                        )}
                        {activeWidget === 'KYC_UPLOAD' && (
                            <KYCUploader onUpload={(file) => onAction('KYC_UPLOADED', file)} />
                        )}
                        {activeWidget === 'SANCTION_LETTER' && (
                            <SanctionLetter
                                customerName={widgetData?.sanctionDetails?.name || widgetData?.name || "Customer"}
                                amount={widgetData?.sanctionDetails?.amount || widgetData?.amount}
                                rate={widgetData?.sanctionDetails?.rate || widgetData?.rate}
                                date={widgetData?.sanctionDetails?.date}
                                onAccept={() => onAction('ACCEPT_OFFER')}
                            />
                        )}
                        {activeWidget === 'PRODUCT_LIST' && (
                            <ProductListWidget onSelect={(name) => onAction('PRODUCT_SELECTED', { name })} />
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
};

export default AgentWorkspace;
