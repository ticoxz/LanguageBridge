import React from 'react';
import { X, Copy, Check } from 'lucide-react';

interface SummaryModalProps {
    onClose: () => void;
    summary: string;
}

const SummaryModal: React.FC<SummaryModalProps> = ({ onClose, summary }) => {
    const [copied, setCopied] = React.useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(summary);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    // Parse summary lines (assuming "- " format) for cleaner display
    const lines = summary.split('\n').filter(line => line.trim().length > 0);

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
            <div className="bg-[#1A1A1A] border border-[#FFD93D]/30 w-full max-w-md rounded-2xl shadow-2xl flex flex-col max-h-[80vh] animate-in fade-in zoom-in duration-200">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-white/10">
                    <div className="flex items-center gap-3">
                        <span className="text-2xl">📝</span>
                        <h2 className="text-xl font-bold text-white">Meeting Summary</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/10 rounded-full transition-colors text-white/60 hover:text-white"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto space-y-4">
                    {lines.length > 0 ? (
                        <ul className="space-y-3">
                            {lines.map((line, i) => (
                                <li key={i} className="flex gap-3 text-[#e8eaed] leading-relaxed">
                                    <span className="text-[#FFD93D] mt-1.5">•</span>
                                    <span>{line.replace(/^- /, '').replace(/^\* /, '')}</span>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-white/50 text-center italic">Generating summary...</p>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-white/10 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-white/70 hover:text-white transition-colors"
                    >
                        Close
                    </button>
                    <button
                        onClick={handleCopy}
                        className="px-4 py-2 rounded-lg bg-[#FFD93D] text-black font-bold text-sm flex items-center gap-2 hover:bg-[#ffe169] transition-colors shadow-lg shadow-[#FFD93D]/20"
                    >
                        {copied ? <Check size={16} /> : <Copy size={16} />}
                        {copied ? 'Copied!' : 'Copy Summary'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SummaryModal;
