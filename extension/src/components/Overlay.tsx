import React, { useState } from 'react';
import { X, Mic, MicOff, Loader2, Settings, Square } from 'lucide-react';
import SettingsPanel from './SettingsPanel';
import SummaryModal from './SummaryModal';
import { Settings as SettingsType } from '../hooks/useSettings';

interface OverlayProps {
    transcript: string;
    translation: string;
    replies: string[];
    isListening: boolean;
    isTranslating: boolean;
    settings: SettingsType;
    onUpdateSettings: (settings: Partial<SettingsType>) => void;
    onToggleListening: () => void;
    onReplyClick: (reply: string) => void;
    summary: string;
    isSummaryOpen: boolean;
    onRequestSummary: () => void;
    onCloseSummary: () => void;
}

const Overlay: React.FC<OverlayProps> = ({
    transcript,
    translation,
    replies,
    isListening,
    isTranslating,
    settings,
    onUpdateSettings,
    onToggleListening,
    onReplyClick,
    summary,
    isSummaryOpen,
    onRequestSummary,
    onCloseSummary
}) => {
    const [minimized, setMinimized] = useState(false);
    const [showSettings, setShowSettings] = useState(false);

    // Inline style for rotation animation
    // Inline style for animations
    const animationStyles = `
        @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
        }
        @keyframes bounce {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-15px); }
        }
    `;

    if (minimized) {
        return (
            <>
                <style>{animationStyles}</style>
                <div style={{
                    position: 'fixed',
                    bottom: '20px',
                    right: '20px',
                    zIndex: 99999,
                    background: 'linear-gradient(135deg, #FFE135 0%, #FFC700 100%)',
                    color: '#000',
                    padding: '12px',
                    borderRadius: '50%',
                    cursor: 'pointer',
                    boxShadow: '0 4px 16px rgba(255, 225, 53, 0.4)',
                    fontSize: '32px',
                    width: '56px',
                    height: '56px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    animation: 'bounce 1s ease-in-out infinite',
                    border: '2px solid #FFE135'
                }} onClick={() => setMinimized(false)}>
                    🍌
                </div>
            </>
        );
    }

    // Get position styles based on settings
    const getPositionStyles = () => {
        const base = { position: 'fixed' as const, width: '320px', zIndex: 99999 };
        switch (settings.position) {
            case 'top-left': return { ...base, top: '20px', left: '20px' };
            case 'top-right': return { ...base, top: '20px', right: '20px' };
            case 'bottom-left': return { ...base, bottom: '20px', left: '20px' };
            case 'bottom-right':
            default: return { ...base, bottom: '20px', right: '20px' };
        }
    };

    return (
        <>
            {showSettings && (
                <SettingsPanel
                    settings={settings}
                    onUpdate={onUpdateSettings}
                    onClose={() => setShowSettings(false)}
                />
            )}
            <div style={{
                ...getPositionStyles(),
                fontFamily: 'Roboto, sans-serif',
                fontSize: '14px',
                background: '#202124',
                color: '#e8eaed',
                borderRadius: '12px',
                boxShadow: '0 4px 24px rgba(0,0,0,0.5)',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                border: '1px solid #3c4043'
            }}>
                <style>{animationStyles}</style>

                {/* Header */}
                <div style={{
                    padding: '12px 16px',
                    background: '#1a1a1a', // Darker background
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    borderBottom: '1px solid #333'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ fontSize: '18px' }}>🍌</div>
                        <span style={{ fontWeight: 800, fontSize: '16px', color: '#FFE135', letterSpacing: '0.5px' }}>B-Bridge</span>
                        <div style={{
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            background: isListening ? '#34a853' : '#ea4335',
                            boxShadow: isListening ? '0 0 8px #34a853' : 'none',
                            marginLeft: '8px'
                        }} />
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                            onClick={onRequestSummary}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ea4335', marginRight: '4px' }}
                            title="Stop & Summarize"
                        >
                            <Square size={16} fill="currentColor" />
                        </button>
                        <button
                            onClick={onToggleListening}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9aa0a6' }}
                        >
                            {isListening ? <Mic size={16} /> : <MicOff size={16} />}
                        </button>
                        <button
                            onClick={() => setShowSettings(true)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9aa0a6' }}
                            title="Settings"
                        >
                            <Settings size={16} />
                        </button>
                        <button
                            onClick={() => setMinimized(true)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9aa0a6' }}
                        >
                            <X size={16} />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>

                    {/* Original Text */}
                    <div style={{ color: '#9aa0a6', fontSize: '12px', fontStyle: 'italic' }}>
                        {transcript || "Listening..."}
                    </div>

                    {/* Translation */}
                    <div style={{ fontSize: '16px', fontWeight: 500, minHeight: '40px' }}>
                        {isTranslating ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#FFE135' }}>
                                <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                                <span>Translating...</span>
                            </div>
                        ) : (
                            translation || "..."
                        )}
                    </div>

                    {/* Smart Replies */}
                    {replies.length > 0 && !isTranslating && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
                            <span style={{ fontSize: '10px', textTransform: 'uppercase', color: '#5f6368', fontWeight: 700 }}>Smart Replies</span>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                {replies.map((reply, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => onReplyClick(reply)}
                                        style={{
                                            background: 'rgba(255, 225, 53, 0.15)',
                                            color: '#FFE135',
                                            border: '1px solid rgba(255, 225, 53, 0.3)',
                                            borderRadius: '16px',
                                            padding: '6px 12px',
                                            fontSize: '12px',
                                            cursor: 'pointer',
                                            transition: 'background 0.2s',
                                            textAlign: 'left'
                                        }}
                                    >
                                        {reply}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
            <SummaryModal
                isOpen={isSummaryOpen}
                onClose={onCloseSummary}
                summary={summary}
            />
        </>
    );
};

export default Overlay;
