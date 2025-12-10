import React, { useEffect, useState, useRef } from 'react';
import Overlay from '../components/Overlay';

const WS_URL = 'ws://localhost:8080/ws/audio';

interface ScriptProcessorNodeWithMonitor extends ScriptProcessorNode {
    _monitorInterval?: NodeJS.Timeout;
}

const ContentApp: React.FC = () => {
    const [transcript, setTranscript] = useState('');
    const [translation, setTranslation] = useState('');
    const [replies, setReplies] = useState<string[]>([]);
    const [isListening, setIsListening] = useState(false);

    const wsRef = useRef<WebSocket | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const processorRef = useRef<ScriptProcessorNodeWithMonitor | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);

    useEffect(() => {
        const userId = localStorage.getItem('lb_user_id') || `user_${Math.random().toString(36).substr(2, 9)}`;
        localStorage.setItem('lb_user_id', userId);

        return () => {
            stopListening();
        };
    }, []);

    const setupWebSocket = (): Promise<void> => {
        return new Promise((resolve, reject) => {
            if (wsRef.current) {
                wsRef.current.close();
            }

            const userId = localStorage.getItem('lb_user_id');
            wsRef.current = new WebSocket(`${WS_URL}?user_id=${userId}`);

            wsRef.current.onopen = () => {
                console.log('✅ WebSocket OPEN - Ready to send audio');
                resolve();
            };

            wsRef.current.onmessage = (event) => {
                const data = JSON.parse(event.data);

                if (data.error) {
                    setTranscript(`Error: ${data.message || data.error}`);
                    if (data.error === 'LIMIT_EXCEEDED') {
                        stopListening();
                    }
                    return;
                }

                if (data.type === 'transcript') {
                    setTranscript(data.text);
                } else if (data.type === 'translation') {
                    setTranslation(data.translation);
                    setReplies(data.replies || []);
                }
            };

            wsRef.current.onerror = (err) => {
                console.error('WebSocket Error:', err);
                reject(err);
            };

            wsRef.current.onclose = (event) => {
                console.log("WebSocket Closed:", event.code, event.reason);
            };

            // Timeout after 5 seconds
            setTimeout(() => reject(new Error("WebSocket connection timeout")), 5000);
        });
    };

    const downsampleBuffer = (buffer: Float32Array, sampleRate: number, outSampleRate: number) => {
        if (outSampleRate === sampleRate) {
            return buffer;
        }
        if (outSampleRate > sampleRate) {
            throw "downsampling rate show be smaller than original sample rate";
        }
        const sampleRateRatio = sampleRate / outSampleRate;
        const newLength = Math.round(buffer.length / sampleRateRatio);
        const result = new Float32Array(newLength);
        let offsetResult = 0;
        let offsetBuffer = 0;
        while (offsetResult < result.length) {
            const nextOffsetBuffer = Math.round((offsetResult + 1) * sampleRateRatio);
            let accum = 0, count = 0;
            for (let i = offsetBuffer; i < nextOffsetBuffer && i < buffer.length; i++) {
                accum += buffer[i];
                count++;
            }
            result[offsetResult] = accum / count;
            offsetResult++;
            offsetBuffer = nextOffsetBuffer;
        }
        return result;
    };

    const floatTo16BitPCM = (output: DataView, offset: number, input: Float32Array) => {
        for (let i = 0; i < input.length; i++, offset += 2) {
            const s = Math.max(-1, Math.min(1, input[i]));
            output.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
        }
    };

    const startListening = async () => {
        try {
            setIsListening(true);

            // CRITICAL FIX: Wait for WebSocket to be fully OPEN before audio setup
            console.log("🔌 Connecting WebSocket...");
            await setupWebSocket();
            console.log("🎤 WebSocket ready, starting audio capture...");

            // Now setup audio
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            streamRef.current = stream;

            audioContextRef.current = new AudioContext();

            if (audioContextRef.current.state === 'suspended') {
                await audioContextRef.current.resume();
            }

            const monitorInterval = setInterval(async () => {
                if (!audioContextRef.current) return;

                if (audioContextRef.current.state === 'suspended') {
                    console.log("Monitor: Resuming suspended AudioContext...");
                    try {
                        await audioContextRef.current.resume();
                    } catch (e) {
                        console.error("Monitor: Resume failed", e);
                    }
                }

                if (streamRef.current && !streamRef.current.active) {
                    console.warn("Monitor: Stream inactive!");
                }
            }, 1000);

            const source = audioContextRef.current.createMediaStreamSource(stream);
            sourceRef.current = source;

            processorRef.current = audioContextRef.current.createScriptProcessor(4096, 1, 1);
            processorRef.current._monitorInterval = monitorInterval;

            let chunkCount = 0;
            processorRef.current.onaudioprocess = (e) => {
                try {
                    if (wsRef.current?.readyState !== WebSocket.OPEN) {
                        return;
                    }

                    const inputData = e.inputBuffer.getChannelData(0);
                    const downsampled = downsampleBuffer(inputData, audioContextRef.current!.sampleRate, 16000);

                    const buffer = new ArrayBuffer(downsampled.length * 2);
                    const view = new DataView(buffer);
                    floatTo16BitPCM(view, 0, downsampled);

                    wsRef.current.send(buffer);

                    chunkCount++;
                    if (chunkCount === 1) {
                        console.log("📤 First audio chunk sent!");
                    }
                } catch (procErr) {
                    console.error("Audio Processing Error:", procErr);
                }
            };

            source.connect(processorRef.current);
            processorRef.current.connect(audioContextRef.current.destination);

            console.log("✅ Audio pipeline active!");

        } catch (err) {
            console.error('❌ Error in startListening:', err);
            setIsListening(false);
            if (wsRef.current) wsRef.current.close();
        }
    };

    const stopListening = () => {
        setIsListening(false);

        if (processorRef.current && processorRef.current._monitorInterval) {
            clearInterval(processorRef.current._monitorInterval);
        }

        streamRef.current?.getTracks().forEach(track => track.stop());
        processorRef.current?.disconnect();
        audioContextRef.current?.close();

        if (wsRef.current) {
            wsRef.current.close();
            wsRef.current = null;
        }

        sourceRef.current = null;
        streamRef.current = null;
        processorRef.current = null;
        audioContextRef.current = null;
    };

    const toggleListening = () => {
        if (isListening) stopListening();
        else startListening();
    };

    const handleReplyClick = (reply: string) => {
        navigator.clipboard.writeText(reply);
        alert(`Copied: "${reply}"`);
    };

    return (
        <Overlay
            transcript={transcript}
            translation={translation}
            replies={replies}
            isListening={isListening}
            onToggleListening={toggleListening}
            onReplyClick={handleReplyClick}
        />
    );
};

export default ContentApp;
