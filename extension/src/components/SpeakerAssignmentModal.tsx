import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, Users } from 'lucide-react';

interface SpeakerAssignmentModalProps {
    isOpen: boolean;
    onClose: () => void;
    detectedSpeakers: number[];
    speakerNames: Record<number, string>;
    onSave: (names: Record<number, string>) => void;
}

const SPEAKER_COLORS = [
    '#3B82F6', // Blue
    '#10B981', // Green  
    '#F59E0B', // Yellow
    '#EF4444', // Red
    '#8B5CF6', // Purple
    '#EC4899', // Pink
];

const SpeakerAssignmentModal: React.FC<SpeakerAssignmentModalProps> = ({
    isOpen,
    onClose,
    detectedSpeakers,
    speakerNames,
    onSave
}) => {
    const [localNames, setLocalNames] = useState<Record<number, string>>(speakerNames);

    useEffect(() => {
        setLocalNames(speakerNames);
    }, [speakerNames]);

    const handleSave = () => {
        onSave(localNames);
        onClose();
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        style={{
                            position: 'fixed',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            background: 'rgba(0, 0, 0, 0.6)',
                            backdropFilter: 'blur(4px)',
                            zIndex: 999999,
                        }}
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        style={{
                            position: 'fixed',
                            top: '50%',
                            left: '50%',
                            transform: 'translate(-50%, -50%)',
                            zIndex: 1000000,
                            width: '400px',
                            maxHeight: '80vh',
                            background: 'rgba(32, 33, 36, 0.95)',
                            backdropFilter: 'blur(20px)',
                            borderRadius: '16px',
                            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.1)',
                            overflow: 'hidden',
                            fontFamily: 'Roboto, sans-serif',
                        }}
                    >
                        {/* Header */}
                        <div style={{
                            padding: '20px',
                            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <Users size={24} color="#FFE135" />
                                <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#e8eaed' }}>
                                    Assign Speaker Names
                                </h2>
                            </div>
                            <button
                                onClick={onClose}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    color: '#9aa0a6',
                                    padding: '4px',
                                    display: 'flex',
                                    alignItems: 'center',
                                }}
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Speaker List */}
                        <div style={{ padding: '20px', maxHeight: '400px', overflowY: 'auto' }}>
                            {detectedSpeakers.length === 0 ? (
                                <p style={{ color: '#9aa0a6', textAlign: 'center', margin: '20px 0' }}>
                                    No speakers detected yet. Start speaking to detect participants.
                                </p>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                    {detectedSpeakers.map((speakerTag, index) => (
                                        <motion.div
                                            key={speakerTag}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: index * 0.1 }}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '12px',
                                            }}
                                        >
                                            {/* Speaker Badge */}
                                            <motion.div
                                                whileHover={{ scale: 1.1 }}
                                                style={{
                                                    width: '40px',
                                                    height: '40px',
                                                    borderRadius: '50%',
                                                    background: SPEAKER_COLORS[index % SPEAKER_COLORS.length],
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    fontWeight: 700,
                                                    color: '#fff',
                                                    fontSize: '16px',
                                                    flexShrink: 0,
                                                }}
                                            >
                                                {speakerTag}
                                            </motion.div>

                                            {/* Name Input */}
                                            <motion.input
                                                whileFocus={{ scale: 1.02 }}
                                                type="text"
                                                placeholder={`Speaker ${speakerTag}`}
                                                value={localNames[speakerTag] || ''}
                                                onChange={(e) => setLocalNames({
                                                    ...localNames,
                                                    [speakerTag]: e.target.value
                                                })}
                                                style={{
                                                    flex: 1,
                                                    padding: '12px 16px',
                                                    background: 'rgba(255, 255, 255, 0.05)',
                                                    border: '1px solid rgba(255, 255, 255, 0.1)',
                                                    borderRadius: '8px',
                                                    color: '#e8eaed',
                                                    fontSize: '14px',
                                                    outline: 'none',
                                                    transition: 'all 0.2s',
                                                }}
                                                onFocus={(e) => {
                                                    e.target.style.borderColor = '#FFE135';
                                                    e.target.style.background = 'rgba(255, 225, 53, 0.1)';
                                                }}
                                                onBlur={(e) => {
                                                    e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                                                    e.target.style.background = 'rgba(255, 255, 255, 0.05)';
                                                }}
                                            />
                                        </motion.div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div style={{
                            padding: '20px',
                            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                            display: 'flex',
                            justifyContent: 'flex-end',
                        }}>
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={handleSave}
                                style={{
                                    background: 'linear-gradient(135deg, #FFE135 0%, #FFC700 100%)',
                                    color: '#000',
                                    border: 'none',
                                    borderRadius: '8px',
                                    padding: '12px 24px',
                                    fontSize: '14px',
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    boxShadow: '0 4px 12px rgba(255, 225, 53, 0.3)',
                                }}
                            >
                                <Check size={16} />
                                Save Names
                            </motion.button>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default SpeakerAssignmentModal;
