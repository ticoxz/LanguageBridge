import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mic, MicOff, Settings as SettingsIcon, Square, Lock, Unlock, Users } from 'lucide-react';
import SettingsPanel from './SettingsPanel';
import SummaryModal from './SummaryModal';
import SpeakerAssignmentModal from './SpeakerAssignmentModal';
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
    // Speaker props (optional for now)
    detectedSpeakers?: number[];
    speakerNames?: Record<string, string>;
    isSpeakerModalOpen?: boolean;
    onOpenSpeakerModal?: () => void;
    onCloseSpeakerModal?: () => void;
    onSaveSpeakerNames?: (names: Record<number, string>) => void;
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
    onCloseSummary,
    detectedSpeakers,
    speakerNames,
    isSpeakerModalOpen,
    onOpenSpeakerModal,
    onCloseSpeakerModal,
    onSaveSpeakerNames
}) => {
    const [minimized, setMinimized] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [isLocked, setIsLocked] = useState(false);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const dragRef = useRef<HTMLDivElement>(null);

    // Get initial position based on settings
    const getInitialPosition = () => {
        if (minimized) {
            return { x: window.innerWidth - 200, y: window.innerHeight - 100 };
        }

        const width = 500;
        const height = 600;

        switch (settings.position) {
            case 'top-left':
                return { x: 20, y: 20 };
            case 'top-right':
                return { x: window.innerWidth - width - 20, y: 20 };
            case 'bottom-left':
                return { x: 20, y: window.innerHeight - height - 20 };
            case 'bottom-right':
                return { x: window.innerWidth - width - 20, y: window.innerHeight - height - 20 };
            case 'center':
                return { x: (window.innerWidth - width) / 2, y: (window.innerHeight - height) / 2 };
            default:
                return { x: window.innerWidth - width - 20, y: window.innerHeight - height - 20 };
        }
    };

    // Initialize position on mount or settings change
    React.useEffect(() => {
        setPosition(getInitialPosition());
    }, [settings.position, minimized]);

    // Minimized floating button
    if (minimized) {
        return (
            <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                style={{
                    position: 'fixed',
                    bottom: '20px',
                    right: '20px',
                    zIndex: 999999,
                    background: 'linear-gradient(135deg, rgba(253, 224, 71, 0.95) 0%, rgba(250, 204, 21, 0.95) 100%)',
                    backdropFilter: 'blur(12px)',
                    borderRadius: '50px',
                    padding: '12px 20px',
                    cursor: 'pointer',
                    boxShadow: '0 8px 32px rgba(253, 224, 71, 0.4)',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontFamily: 'system-ui, -apple-system, sans-serif',
                }}
                onClick={() => setMinimized(false)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
            >
                <span style={{ fontSize: '18px' }}>🍌</span>
                <span style={{ fontWeight: 700, color: '#000', fontSize: '14px' }}>B-Bridge</span>
                {isListening && (
                    <motion.div
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ repeat: Infinity, duration: 1.5 }}
                        style={{ display: 'flex' }}
                    >
                        <Mic size={16} color="#000" />
                    </motion.div>
                )}
            </motion.div>
        );
    }

    // Main overlay
    return (
        <>
            <motion.div
                ref={dragRef}
                drag={!isLocked}
                dragMomentum={false}
                dragElastic={0}
                dragConstraints={{
                    left: -position.x,
                    right: window.innerWidth - 500 - position.x,
                    top: -position.y,
                    bottom: window.innerHeight - 550 - position.y
                }}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                onDrag={(_e, info) => {
                    setPosition({ x: info.point.x, y: info.point.y });
                }}
                transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                style={{
                    position: 'fixed',
                    top: position.y,
                    left: position.x,
                    zIndex: 999999,
                    width: '500px',
                    maxWidth: '90vw',
                    background: 'rgba(20, 20, 20, 0.85)',
                    backdropFilter: 'blur(12px)',
                    borderRadius: '16px',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.05)',
                    overflow: 'hidden',
                    fontFamily: 'system-ui, -apple-system, sans-serif',
                    cursor: isLocked ? 'default' : 'move',
                }}
            >
                {/* Header */}
                <div style={{
                    padding: '16px 20px',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: 'rgba(0, 0, 0, 0.3)',
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{ fontSize: '20px' }}>🍌</span>
                        <span style={{ fontWeight: 700, fontSize: '16px', color: '#FDE047' }}>BananaBridge</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {/* Lock/Unlock */}
                        <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => setIsLocked(!isLocked)}
                            style={{
                                background: isLocked ? '#FDE047' : 'rgba(255, 255, 255, 0.1)',
                                border: 'none',
                                borderRadius: '8px',
                                padding: '8px',
                                cursor: 'pointer',
                                display: 'flex',
                            }}
                        >
                            {isLocked ? <Lock size={16} color="#000" /> : <Unlock size={16} color="#fff" />}
                        </motion.button>

                        {/* Mic toggle */}
                        <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={onToggleListening}
                            style={{
                                background: isListening ? '#FDE047' : 'rgba(255, 255, 255, 0.1)',
                                border: 'none',
                                borderRadius: '8px',
                                padding: '8px',
                                cursor: 'pointer',
                                display: 'flex',
                            }}
                        >
                            {isListening ? <Mic size={16} color="#000" /> : <MicOff size={16} color="#fff" />}
                        </motion.button>

                        {/* Settings */}
                        <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => setShowSettings(true)}
                            style={{
                                background: 'rgba(255, 255, 255, 0.1)',
                                border: 'none',
                                borderRadius: '8px',
                                padding: '8px',
                                cursor: 'pointer',
                                display: 'flex',
                            }}
                            title="Settings"
                        >
                            <SettingsIcon size={16} color="#fff" />
                        </motion.button>

                        {/* Assign Speakers */}
                        {onOpenSpeakerModal && (
                            <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={onOpenSpeakerModal}
                                style={{
                                    background: 'rgba(255, 255, 255, 0.1)',
                                    border: 'none',
                                    borderRadius: '8px',
                                    padding: '8px',
                                    cursor: 'pointer',
                                    display: 'flex',
                                }}
                                title="Assign Speakers"
                            >
                                <Users size={16} color="#fff" />
                            </motion.button>
                        )}

                        {/* Stop & Summarize */}
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={onRequestSummary}
                            style={{
                                background: 'linear-gradient(135deg, #FDE047 0%, #FACC15 100%)',
                                border: 'none',
                                borderRadius: '8px',
                                padding: '8px 14px',
                                cursor: 'pointer',
                                fontWeight: 700,
                                fontSize: '11px',
                                color: '#000',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                boxShadow: '0 4px 12px rgba(253, 224, 71, 0.3)',
                            }}
                        >
                            <Square size={12} />
                            Stop
                        </motion.button>

                        {/* Minimize */}
                        <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => setMinimized(true)}
                            style={{
                                background: 'rgba(255, 255, 255, 0.1)',
                                border: 'none',
                                borderRadius: '8px',
                                padding: '8px',
                                cursor: 'pointer',
                                display: 'flex',
                            }}
                        >
                            <X size={16} color="#fff" />
                        </motion.button>
                    </div>
                </div>

                {/* Auto-Load Indicator */}
                {speakerNames && Object.keys(speakerNames).length > 0 && (
                    <div style={{
                        fontSize: '11px',
                        color: '#FDE047',
                        padding: '8px 16px',
                        background: 'rgba(253, 224, 71, 0.1)',
                        borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                    }}>
                        ✅ Speaker names auto-loaded
                    </div>
                )}

                {/* Content */}
                <div style={{ padding: '20px', maxHeight: '400px', overflowY: 'auto' }}>
                    {/* Transcription Section */}
                    <div style={{ marginBottom: '24px' }}>
                        <h3 style={{
                            margin: '0 0 16px 0',
                            fontSize: '12px',
                            fontWeight: 700,
                            color: '#FDE047',
                            textTransform: 'uppercase',
                            letterSpacing: '1px'
                        }}>
                            Transcripción y Traducción
                        </h3>

                        {transcript ? (
                            <>
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    style={{
                                        background: 'rgba(255, 255, 255, 0.05)',
                                        borderRadius: '12px',
                                        padding: '14px 16px',
                                        marginBottom: '12px',
                                        border: '1px solid rgba(255, 255, 255, 0.1)',
                                    }}
                                >
                                    <div style={{ color: '#f3f4f6', fontSize: '13px', lineHeight: '1.7' }}>
                                        <span style={{ fontWeight: 700, color: '#FDE047', marginRight: '6px' }}>You (EN):</span>
                                        <span>{transcript}</span>
                                    </div>
                                </motion.div>

                                {translation && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        style={{
                                            background: 'rgba(253, 224, 71, 0.08)',
                                            borderRadius: '12px',
                                            padding: '14px 16px',
                                            border: '1px solid rgba(253, 224, 71, 0.2)',
                                        }}
                                    >
                                        <div style={{ marginBottom: isTranslating ? '8px' : '0' }}>
                                            <span style={{ fontWeight: 700, color: '#FDE047', fontSize: '13px', marginRight: '6px' }}>→ Translation:</span>
                                            <span style={{ color: '#f3f4f6', fontSize: '13px', lineHeight: '1.7' }}>{translation}</span>
                                        </div>
                                        {isTranslating && (
                                            <div style={{ color: '#9ca3af', fontSize: '11px', fontStyle: 'italic', marginTop: '6px' }}>
                                                Listening...
                                            </div>
                                        )}
                                    </motion.div>
                                )}
                            </>
                        ) : (
                            <div style={{
                                color: '#6b7280',
                                fontSize: '13px',
                                textAlign: 'center',
                                padding: '20px',
                                fontStyle: 'italic'
                            }}>
                                Click the microphone to start listening...
                            </div>
                        )}
                    </div>

                    {/* Smart Replies */}
                    {replies.length > 0 && (
                        <div>
                            <h3 style={{
                                margin: '0 0 14px 0',
                                fontSize: '12px',
                                fontWeight: 700,
                                color: '#FDE047',
                                textTransform: 'uppercase',
                                letterSpacing: '1px'
                            }}>
                                Smart Replies
                            </h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                {replies.slice(0, 3).map((reply, idx) => (
                                    <motion.button
                                        key={idx}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: idx * 0.1 }}
                                        whileHover={{ scale: 1.02, boxShadow: '0 6px 20px rgba(253, 224, 71, 0.4)' }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={() => onReplyClick(reply)}
                                        style={{
                                            background: 'linear-gradient(135deg, #FDE047 0%, #FACC15 100%)',
                                            border: 'none',
                                            borderRadius: '10px',
                                            padding: '13px 16px',
                                            cursor: 'pointer',
                                            fontWeight: 600,
                                            fontSize: '13px',
                                            color: '#000',
                                            textAlign: 'left',
                                            boxShadow: '0 4px 12px rgba(253, 224, 71, 0.2)',
                                            transition: 'all 0.2s',
                                        }}
                                    >
                                        {reply}
                                    </motion.button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div style={{
                    padding: '14px 20px',
                    borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: 'rgba(0, 0, 0, 0.3)',
                }}>
                    <div style={{ fontSize: '11px', color: '#9ca3af', lineHeight: '1.4' }}>
                        <span style={{ fontWeight: 600, color: '#d1d5db' }}>Tone:</span> {settings.tone.charAt(0).toUpperCase() + settings.tone.slice(1)}
                        {' • '}
                        <span style={{ fontWeight: 600, color: '#d1d5db' }}>Level:</span> {settings.englishLevel.charAt(0).toUpperCase() + settings.englishLevel.slice(1)}
                    </div>
                </div>
            </motion.div>

            {/* Settings Panel */}
            <AnimatePresence>
                {showSettings && (
                    <SettingsPanel
                        settings={settings}
                        onUpdate={onUpdateSettings}
                        onClose={() => setShowSettings(false)}
                    />
                )}
            </AnimatePresence>

            {/* Summary Modal */}
            <AnimatePresence>
                {isSummaryOpen && (
                    <SummaryModal
                        summary={summary}
                        onClose={onCloseSummary}
                    />
                )}
            </AnimatePresence>

            {/* Speaker Assignment Modal */}
            {onSaveSpeakerNames && onCloseSpeakerModal && (
                <AnimatePresence>
                    {isSpeakerModalOpen && (
                        <SpeakerAssignmentModal
                            isOpen={isSpeakerModalOpen}
                            onClose={onCloseSpeakerModal}
                            detectedSpeakers={detectedSpeakers || []}
                            speakerNames={
                                speakerNames
                                    ? Object.fromEntries(
                                        Object.entries(speakerNames).map(([k, v]) => [Number(k), v])
                                    )
                                    : {}
                            }
                            onSave={onSaveSpeakerNames}
                        />
                    )}
                </AnimatePresence>
            )}
        </>
    );
};

export default Overlay;
