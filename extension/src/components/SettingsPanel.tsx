import React from 'react';
import { motion } from 'framer-motion';
import { X, Settings as SettingsIcon } from 'lucide-react';
import { Settings } from '../hooks/useSettings';

interface SettingsPanelProps {
    settings: Settings;
    onUpdate: (settings: Partial<Settings>) => void;
    onClose: () => void;
}

const SettingsPanel: React.FC<SettingsPanelProps> = ({ settings, onUpdate, onClose }) => {
    return (
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
                backdropFilter: 'blur(8px)',
                zIndex: 1000000,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: 'system-ui, -apple-system, sans-serif',
            }}
        >
            <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                onClick={(e) => e.stopPropagation()}
                style={{
                    background: 'rgba(20, 20, 20, 0.95)',
                    backdropFilter: 'blur(12px)',
                    borderRadius: '16px',
                    padding: '0',
                    width: '450px',
                    maxWidth: '90vw',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.05)',
                    overflow: 'hidden',
                }}
            >
                {/* Header */}
                <div style={{
                    padding: '20px 24px',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    background: 'rgba(0, 0, 0, 0.3)',
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <SettingsIcon size={20} color="#FDE047" />
                        <h2 style={{ margin: 0, color: '#FDE047', fontSize: '18px', fontWeight: 700 }}>Settings</h2>
                    </div>
                    <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={onClose}
                        style={{
                            background: 'rgba(255, 255, 255, 0.1)',
                            border: 'none',
                            borderRadius: '8px',
                            padding: '8px',
                            cursor: 'pointer',
                            display: 'flex',
                            color: '#fff',
                        }}
                    >
                        <X size={18} />
                    </motion.button>
                </div>

                {/* Content */}
                <div style={{ padding: '24px', maxHeight: '70vh', overflowY: 'auto' }}>
                    {/* Language */}
                    <div style={{ marginBottom: '24px' }}>
                        <label style={{
                            display: 'block',
                            color: '#FDE047',
                            fontSize: '11px',
                            fontWeight: 700,
                            marginBottom: '10px',
                            textTransform: 'uppercase',
                            letterSpacing: '1px'
                        }}>
                            Transcription Language
                        </label>
                        <select
                            value={settings.language}
                            onChange={(e) => onUpdate({ language: e.target.value as Settings['language'] })}
                            style={{
                                width: '100%',
                                padding: '12px 14px',
                                background: 'rgba(255, 255, 255, 0.05)',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                borderRadius: '10px',
                                color: '#fff',
                                fontSize: '14px',
                                cursor: 'pointer',
                                outline: 'none',
                            }}
                        >
                            <option value="auto" style={{ background: '#1a1a1a' }}>🌍 Auto-detect</option>
                            <option value="es-ES" style={{ background: '#1a1a1a' }}>🇪🇸 Español</option>
                            <option value="en-US" style={{ background: '#1a1a1a' }}>🇬🇧 English</option>
                        </select>
                    </div>

                    {/* Position */}
                    <div style={{ marginBottom: '24px' }}>
                        <label style={{
                            display: 'block',
                            color: '#FDE047',
                            fontSize: '11px',
                            fontWeight: 700,
                            marginBottom: '10px',
                            textTransform: 'uppercase',
                            letterSpacing: '1px'
                        }}>
                            Overlay Position
                        </label>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                            {(['top-left', 'top-right', 'bottom-left', 'bottom-right'] as const).map((pos) => (
                                <motion.button
                                    key={pos}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => onUpdate({ position: pos })}
                                    style={{
                                        padding: '12px',
                                        background: settings.position === pos
                                            ? 'linear-gradient(135deg, #FDE047 0%, #FACC15 100%)'
                                            : 'rgba(255, 255, 255, 0.05)',
                                        color: settings.position === pos ? '#000' : '#fff',
                                        border: `1px solid ${settings.position === pos ? '#FDE047' : 'rgba(255, 255, 255, 0.1)'}`,
                                        borderRadius: '10px',
                                        cursor: 'pointer',
                                        fontSize: '13px',
                                        fontWeight: 600,
                                        transition: 'all 0.2s',
                                    }}
                                >
                                    {pos.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                                </motion.button>
                            ))}
                        </div>
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => onUpdate({ position: 'center' })}
                            style={{
                                width: '100%',
                                padding: '12px',
                                background: settings.position === 'center'
                                    ? 'linear-gradient(135deg, #FDE047 0%, #FACC15 100%)'
                                    : 'rgba(255, 255, 255, 0.05)',
                                color: settings.position === 'center' ? '#000' : '#fff',
                                border: `1px solid ${settings.position === 'center' ? '#FDE047' : 'rgba(255, 255, 255, 0.1)'}`,
                                borderRadius: '10px',
                                cursor: 'pointer',
                                fontSize: '13px',
                                fontWeight: 600,
                                transition: 'all 0.2s',
                            }}
                        >
                            Center
                        </motion.button>
                        <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '8px', fontStyle: 'italic' }}>
                            Tip: Unlock 🔓 to drag freely
                        </div>
                    </div>

                    {/* English Level */}
                    <div style={{ marginBottom: '24px' }}>
                        <label style={{
                            display: 'block',
                            color: '#FDE047',
                            fontSize: '11px',
                            fontWeight: 700,
                            marginBottom: '10px',
                            textTransform: 'uppercase',
                            letterSpacing: '1px'
                        }}>
                            English Level
                        </label>
                        <select
                            value={settings.englishLevel}
                            onChange={(e) => onUpdate({ englishLevel: e.target.value as Settings['englishLevel'] })}
                            style={{
                                width: '100%',
                                padding: '12px 14px',
                                background: 'rgba(255, 255, 255, 0.05)',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                borderRadius: '10px',
                                color: '#fff',
                                fontSize: '14px',
                                cursor: 'pointer',
                                outline: 'none',
                            }}
                        >
                            <option value="beginner" style={{ background: '#1a1a1a' }}>🌱 Beginner (Simple)</option>
                            <option value="intermediate" style={{ background: '#1a1a1a' }}>📚 Intermediate</option>
                            <option value="advanced" style={{ background: '#1a1a1a' }}>🎓 Advanced</option>
                            <option value="native" style={{ background: '#1a1a1a' }}>🌟 Native-like</option>
                        </select>
                        <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '8px' }}>
                            Adjusts complexity of smart replies
                        </div>
                    </div>

                    {/* Tone */}
                    <div style={{ marginBottom: '24px' }}>
                        <label style={{
                            display: 'block',
                            color: '#FDE047',
                            fontSize: '11px',
                            fontWeight: 700,
                            marginBottom: '10px',
                            textTransform: 'uppercase',
                            letterSpacing: '1px'
                        }}>
                            Reply Tone
                        </label>
                        <select
                            value={settings.tone}
                            onChange={(e) => onUpdate({ tone: e.target.value as Settings['tone'] })}
                            style={{
                                width: '100%',
                                padding: '12px 14px',
                                background: 'rgba(255, 255, 255, 0.05)',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                borderRadius: '10px',
                                color: '#fff',
                                fontSize: '14px',
                                cursor: 'pointer',
                                outline: 'none',
                            }}
                        >
                            <option value="formal" style={{ background: '#1a1a1a' }}>👔 Formal</option>
                            <option value="casual" style={{ background: '#1a1a1a' }}>😊 Casual</option>
                            <option value="friendly" style={{ background: '#1a1a1a' }}>🤝 Friendly</option>
                        </select>
                        <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '8px' }}>
                            Sets the style of responses
                        </div>
                    </div>

                    {/* Backend URL */}
                    <div style={{ marginBottom: '0' }}>
                        <label style={{
                            display: 'block',
                            color: '#FDE047',
                            fontSize: '11px',
                            fontWeight: 700,
                            marginBottom: '10px',
                            textTransform: 'uppercase',
                            letterSpacing: '1px'
                        }}>
                            Backend URL
                        </label>
                        <input
                            type="text"
                            value={settings.backendUrl}
                            onChange={(e) => onUpdate({ backendUrl: e.target.value })}
                            placeholder="ws://localhost:8000"
                            style={{
                                width: '100%',
                                padding: '12px 14px',
                                background: 'rgba(255, 255, 255, 0.05)',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                borderRadius: '10px',
                                color: '#fff',
                                fontSize: '14px',
                                boxSizing: 'border-box',
                                outline: 'none',
                            }}
                        />
                        <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '8px' }}>
                            Default: ws://localhost:8000
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div style={{
                    padding: '16px 24px',
                    borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                    background: 'rgba(0, 0, 0, 0.3)',
                }}>
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={onClose}
                        style={{
                            width: '100%',
                            padding: '14px',
                            background: 'linear-gradient(135deg, #FDE047 0%, #FACC15 100%)',
                            color: '#000',
                            border: 'none',
                            borderRadius: '10px',
                            fontSize: '14px',
                            fontWeight: 700,
                            cursor: 'pointer',
                            boxShadow: '0 4px 12px rgba(253, 224, 71, 0.3)',
                        }}
                    >
                        Save & Close
                    </motion.button>
                </div>
            </motion.div>
        </motion.div>
    );
};

export default SettingsPanel;
