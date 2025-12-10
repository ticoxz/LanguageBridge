import React, { useState } from 'react';
import { MessageSquare, X, Mic, MicOff } from 'lucide-react';

interface OverlayProps {
    transcript: string;
    translation: string;
    replies: string[];
    isListening: boolean;
    onToggleListening: () => void;
    onReplyClick: (reply: string) => void;
}

const Overlay: React.FC<OverlayProps> = ({
    transcript,
    translation,
    replies,
    isListening,
    onToggleListening,
    onReplyClick
}) => {
    const [minimized, setMinimized] = useState(false);

    if (minimized) {
        return (
            <div style={{
                position: 'fixed',
                bottom: '20px',
                right: '20px',
                zIndex: 99999,
                background: '#202124',
                color: '#fff',
                padding: '10px',
                borderRadius: '50%',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(0,0,0,0.5)'
            }} onClick={() => setMinimized(false)}>
                <MessageSquare size={24} />
            </div>
        );
    }

    return (
        <div style={{
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            width: '320px',
            zIndex: 99999,
            fontFamily: 'Roboto, sans-serif',
            fontSize: '14px',
            background: '#202124', // Dark mode specific
            color: '#e8eaed',
            borderRadius: '12px',
            boxShadow: '0 4px 24px rgba(0,0,0,0.5)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            border: '1px solid #3c4043'
        }}>
            {/* Header */}
            <div style={{
                padding: '12px 16px',
                background: '#303134',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderBottom: '1px solid #3c4043'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontWeight: 700, fontSize: '15px', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>L-Bridge</span>
                    <div style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        background: isListening ? '#34a853' : '#ea4335',
                        boxShadow: isListening ? '0 0 8px #34a853' : 'none'
                    }} />
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                        onClick={onToggleListening}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9aa0a6' }}
                    >
                        {isListening ? <Mic size={16} /> : <MicOff size={16} />}
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
                    {translation || "..."}
                </div>

                {/* Smart Replies */}
                {replies.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
                        <span style={{ fontSize: '10px', textTransform: 'uppercase', color: '#5f6368', fontWeight: 700 }}>Smart Replies</span>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                            {replies.map((reply, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => onReplyClick(reply)}
                                    style={{
                                        background: 'rgba(138, 180, 248, 0.24)',
                                        color: '#8ab4f8',
                                        border: 'none',
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
    );
};

export default Overlay;
