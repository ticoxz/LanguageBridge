import React from 'react';
import { Settings as SettingsIcon, X } from 'lucide-react';
import { Settings } from '../hooks/useSettings';

interface SettingsPanelProps {
    settings: Settings;
    onUpdate: (settings: Partial<Settings>) => void;
    onClose: () => void;
}

const SettingsPanel: React.FC<SettingsPanelProps> = ({ settings, onUpdate, onClose }) => {
    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.8)',
            zIndex: 100000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
        }}>
            <div style={{
                background: '#1a1a1a',
                borderRadius: '12px',
                padding: '24px',
                width: '400px',
                maxWidth: '90vw',
                border: '2px solid #FFE135',
                boxShadow: '0 8px 32px rgba(255, 225, 53, 0.2)'
            }}>
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <SettingsIcon size={20} color="#FFE135" />
                        <h2 style={{ margin: 0, color: '#FFE135', fontSize: '18px', fontWeight: 700 }}>Settings</h2>
                    </div>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#999' }}>
                        <X size={20} />
                    </button>
                </div>

                {/* Language */}
                <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', color: '#FFE135', fontSize: '12px', fontWeight: 600, marginBottom: '8px', textTransform: 'uppercase' }}>
                        Transcription Language
                    </label>
                    <select
                        value={settings.language}
                        onChange={(e) => onUpdate({ language: e.target.value as Settings['language'] })}
                        style={{
                            width: '100%',
                            padding: '10px',
                            background: '#2a2a2a',
                            border: '1px solid #FFE135',
                            borderRadius: '8px',
                            color: '#fff',
                            fontSize: '14px',
                            cursor: 'pointer'
                        }}
                    >
                        <option value="auto">🌍 Auto-detect</option>
                        <option value="es-ES">🇪🇸 Español</option>
                        <option value="en-US">🇬🇧 English</option>
                    </select>
                </div>

                {/* Position */}
                <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', color: '#FFE135', fontSize: '12px', fontWeight: 600, marginBottom: '8px', textTransform: 'uppercase' }}>
                        Overlay Position
                    </label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                        {(['top-left', 'top-right', 'bottom-left', 'bottom-right'] as const).map((pos) => (
                            <button
                                key={pos}
                                onClick={() => onUpdate({ position: pos })}
                                style={{
                                    padding: '12px',
                                    background: settings.position === pos ? '#FFE135' : '#2a2a2a',
                                    color: settings.position === pos ? '#000' : '#FFE135',
                                    border: '1px solid #FFE135',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    fontSize: '12px',
                                    fontWeight: 600,
                                    transition: 'all 0.2s'
                                }}
                            >
                                {pos.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                            </button>
                        ))}
                    </div>
                </div>

                {/* English Level */}
                <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', color: '#FFE135', fontSize: '12px', fontWeight: 600, marginBottom: '8px', textTransform: 'uppercase' }}>
                        English Level
                    </label>
                    <select
                        value={settings.englishLevel}
                        onChange={(e) => onUpdate({ englishLevel: e.target.value as Settings['englishLevel'] })}
                        style={{
                            width: '100%',
                            padding: '10px',
                            background: '#2a2a2a',
                            border: '1px solid #FFE135',
                            borderRadius: '8px',
                            color: '#fff',
                            fontSize: '14px',
                            cursor: 'pointer'
                        }}
                    >
                        <option value="beginner">🌱 Beginner (Simple)</option>
                        <option value="intermediate">📚 Intermediate</option>
                        <option value="advanced">🎓 Advanced</option>
                        <option value="native">🌟 Native-like</option>
                    </select>
                    <div style={{ fontSize: '11px', color: '#999', marginTop: '4px' }}>
                        Adjusts complexity of smart replies
                    </div>
                </div>

                {/* Tone */}
                <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', color: '#FFE135', fontSize: '12px', fontWeight: 600, marginBottom: '8px', textTransform: 'uppercase' }}>
                        Reply Tone
                    </label>
                    <select
                        value={settings.tone}
                        onChange={(e) => onUpdate({ tone: e.target.value as Settings['tone'] })}
                        style={{
                            width: '100%',
                            padding: '10px',
                            background: '#2a2a2a',
                            border: '1px solid #FFE135',
                            borderRadius: '8px',
                            color: '#fff',
                            fontSize: '14px',
                            cursor: 'pointer'
                        }}
                    >
                        <option value="formal">👔 Formal</option>
                        <option value="casual">😊 Casual</option>
                        <option value="friendly">🤝 Friendly</option>
                    </select>
                    <div style={{ fontSize: '11px', color: '#999', marginTop: '4px' }}>
                        Sets the style of responses
                    </div>
                </div>

                {/* Backend URL */}
                <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', color: '#FFE135', fontSize: '12px', fontWeight: 600, marginBottom: '8px', textTransform: 'uppercase' }}>
                        Backend URL
                    </label>
                    <input
                        type="text"
                        value={settings.backendUrl}
                        onChange={(e) => onUpdate({ backendUrl: e.target.value })}
                        placeholder="ws://localhost:8080"
                        style={{
                            width: '100%',
                            padding: '10px',
                            background: '#2a2a2a',
                            border: '1px solid #FFE135',
                            borderRadius: '8px',
                            color: '#fff',
                            fontSize: '14px',
                            boxSizing: 'border-box'
                        }}
                    />
                    <div style={{ fontSize: '11px', color: '#999', marginTop: '4px' }}>
                        Default: ws://localhost:8080
                    </div>
                </div>

                {/* Close Button */}
                <button
                    onClick={onClose}
                    style={{
                        width: '100%',
                        padding: '12px',
                        background: '#FFE135',
                        color: '#000',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '14px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        transition: 'opacity 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.opacity = '0.8'}
                    onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                >
                    Save & Close
                </button>
            </div>
        </div>
    );
};

export default SettingsPanel;
