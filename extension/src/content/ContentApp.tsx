import React, { useEffect, useState, useRef } from 'react';
import Overlay from '../components/Overlay';
import { useSettings } from '../hooks/useSettings';
import { getMeetingId, loadSpeakerNames, saveSpeakerNames, clearOldMeetings } from '../utils/meetingStorage';

interface ScriptProcessorNodeWithMonitor extends ScriptProcessorNode {
    _monitorInterval?: NodeJS.Timeout;
}

const ContentApp: React.FC = () => {
    const { settings, updateSettings } = useSettings();
    const [transcript, setTranscript] = useState('');
    const [translation, setTranslation] = useState('');
    const [replies, setReplies] = useState<string[]>([]);
    const [isListening, setIsListening] = useState(false);
    const [isTranslating, setIsTranslating] = useState(false);

    const [summary, setSummary] = useState('');
    const [isSummaryOpen, setIsSummaryOpen] = useState(false);

    // Speaker diarization state
    const [detectedSpeakers, setDetectedSpeakers] = useState<number[]>([]);
    const [speakerNames, setSpeakerNames] = useState<Record<string, string>>({});
    const [isSpeakerModalOpen, setIsSpeakerModalOpen] = useState(false);

    const wsRef = useRef<WebSocket | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const processorRef = useRef<ScriptProcessorNodeWithMonitor | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);

    // Inject WebRTC interceptor script
    useEffect(() => {
        console.log('🚀 BananaBridge: Injecting WebRTC interceptor...');
        const script = document.createElement('script');
        script.src = chrome.runtime.getURL('inject.js');
        script.onload = () => {
            console.log('✅ BananaBridge: Interceptor script loaded');
            script.remove();
        };
        script.onerror = (error) => {
            console.error('❌ BananaBridge: Failed to load interceptor', error);
        };
        (document.head || document.documentElement).appendChild(script);
    }, []);

    // Listen for WebRTC stream messages
    useEffect(() => {
        const handleMessage = (event: MessageEvent) => {
            if (event.data.type === 'BANANABRIDGE_LOCAL_STREAM') {
                console.log('📥 BananaBridge: Received local stream notification', event.data.streamId);
            } else if (event.data.type === 'BANANABRIDGE_REMOTE_STREAM') {
                console.log('📥 BananaBridge: Received remote stream notification', event.data.streamId);
            }
        };

        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, []);

    useEffect(() => {
        const userId = localStorage.getItem('lb_user_id') || `user_${Math.random().toString(36).substr(2, 9)}`;
        localStorage.setItem('lb_user_id', userId);

        // Auto-load speaker names for this meeting
        const meetingId = getMeetingId();
        if (meetingId) {
            const savedNames = loadSpeakerNames(meetingId);
            if (savedNames && Object.keys(savedNames).length > 0) {
                setSpeakerNames(savedNames);
                console.log('✅ Auto-loaded speaker names for meeting:', meetingId);
            }
        }

        // Clean up old meetings (30+ days)
        clearOldMeetings(30);

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
            const wsUrl = `${settings.backendUrl}/ws/audio?user_id=${userId}`;
            wsRef.current = new WebSocket(wsUrl);

            wsRef.current.onopen = () => {
                console.log('✅ WebSocket OPEN - Ready to send audio');
                // Send current settings to backend
                if (wsRef.current) {
                    wsRef.current.send(JSON.stringify({
                        type: 'settings_update',
                        englishLevel: settings.englishLevel,
                        tone: settings.tone
                    }));
                }
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

                    // Update detected speakers
                    if (data.speaker !== null && data.speaker !== undefined) {
                        setDetectedSpeakers(prev => {
                            if (!prev.includes(data.speaker)) {
                                console.log(`🎤 New speaker detected: ${data.speaker}`);
                                return [...prev, data.speaker].sort((a, b) => a - b);
                            }
                            return prev;
                        });
                    }

                    if (data.is_final) {
                        setIsTranslating(true);
                    }
                } else if (data.type === 'translation') {
                    setTranslation(data.translation);
                    setReplies(data.replies || []);
                    setIsTranslating(false);
                } else if (data.type === 'translation_only') {
                    // Check if it's a quota error
                    if (data.translation && typeof data.translation === 'object' && data.translation.error === 'QUOTA_EXCEEDED') {
                        setTranslation(`⚠️ ${data.translation.message}`);
                    } else {
                        setTranslation(data.translation);
                    }
                    setIsTranslating(false);
                } else if (data.type === 'replies_only') {
                    console.log("Received replies:", data.replies);
                    if (data.replies && data.replies.error === 'QUOTA_EXCEEDED') {
                        return;
                    }
                    setReplies(data.replies || []);
                } else if (data.type === 'summary') {
                    setSummary(data.summary);
                    setIsSummaryOpen(true);
                    stopListening(); // Stop listening when summary is received/requested
                }
            };

            wsRef.current.onerror = (err) => {
                console.error('WebSocket Error:', err);
                reject(err);
            };

            wsRef.current.onclose = (event) => {
                console.log("WebSocket Closed:", event.code, event.reason);
                // Only show error for abnormal closures (not 1000 normal, not 1005 no status)
                if (event.code !== 1000 && event.code !== 1005) {
                    setTranscript(`❌ Disconnected: Code ${event.code} - ${event.reason || "Unknown error"}`);
                }
                setIsListening(false);
            };

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
            console.log("🔌 Connecting WebSocket...");
            await setupWebSocket();
            console.log("🎤 WebSocket ready, starting WebRTC audio capture...");

            // Wait a bit for WebRTC streams to be captured by interceptor
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Access captured streams from injected script
            const streams = (window as any).getBananaBridgeStreams?.();

            if (!streams) {
                console.error('❌ WebRTC interceptor not ready');
                setIsListening(false);
                return;
            }

            console.log('📊 Captured streams:', {
                local: streams.local?.id,
                remote: streams.remote.map((s: MediaStream) => s.id)
            });

            // Create audio context
            audioContextRef.current = new AudioContext({ sampleRate: 16000 });

            if (audioContextRef.current.state === 'suspended') {
                await audioContextRef.current.resume();
            }

            // Collect all audio streams (local + remote)
            const allStreams: MediaStream[] = [];
            if (streams.local) {
                allStreams.push(streams.local);
                console.log('✅ Using local stream (microphone)');
            }
            if (streams.remote && streams.remote.length > 0) {
                allStreams.push(...streams.remote);
                console.log(`✅ Using ${streams.remote.length} remote stream(s)`);
            }

            if (allStreams.length === 0) {
                console.error('❌ No audio streams available');
                setIsListening(false);
                return;
            }

            // Mix all streams
            const destination = audioContextRef.current.createMediaStreamDestination();

            allStreams.forEach((stream, index) => {
                const source = audioContextRef.current!.createMediaStreamSource(stream);
                source.connect(destination);
                console.log(`🔗 Connected stream ${index + 1}/${allStreams.length}`);
            });

            const finalStream = destination.stream;
            streamRef.current = finalStream;
            console.log('✅ All streams mixed successfully');

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

                // Send keepalive ping to prevent WebSocket timeout
                if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
                    try {
                        wsRef.current.send(JSON.stringify({ type: 'ping' }));
                    } catch (e) {
                        console.error("Ping failed:", e);
                    }
                }
            }, 1000);

            // Use the final stream (mixed or mic-only)
            const source = audioContextRef.current.createMediaStreamSource(finalStream);
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
            // Do NOT close here if we want to receive the summary, but user requested stop.
            // Actually, for now, we close it, but if requesting summary we might need it open.
            // Let's rely on handleRequestSummary to handle the flow.
            wsRef.current.close();
            wsRef.current = null;
        }

        sourceRef.current = null;
        streamRef.current = null;
        processorRef.current = null;
        audioContextRef.current = null;
    };

    const handleSaveSpeakerNames = (names: Record<number, string>) => {
        // Convert number keys to string keys for storage
        const stringKeyNames: Record<string, string> = {};
        Object.keys(names).forEach(key => {
            stringKeyNames[key] = names[Number(key)];
        });

        setSpeakerNames(stringKeyNames);

        // Save to localStorage
        const meetingId = getMeetingId();
        if (meetingId) {
            saveSpeakerNames(meetingId, stringKeyNames);
            console.log('💾 Saved speaker names:', stringKeyNames);
        }
    };

    const toggleListening = () => {
        if (isListening) stopListening();
        else startListening();
    };

    const handleReplyClick = (reply: string) => {
        navigator.clipboard.writeText(reply);
        // alert(`Copied: "${reply}"`); // Removed alert for smoother UX
    };

    const handleRequestSummary = () => {
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({ type: 'request_summary' }));
            // We don't stop listening immediately here, we wait for the summary response to close connection
            // But we can pause audio capture? For simplicity, let's keep it running until response.
        }
    };

    return (
        <Overlay
            transcript={transcript}
            translation={translation}
            replies={replies}
            isListening={isListening}
            isTranslating={isTranslating}
            settings={settings}
            onUpdateSettings={updateSettings}
            onToggleListening={toggleListening}
            onReplyClick={handleReplyClick}
            summary={summary}
            isSummaryOpen={isSummaryOpen}
            onRequestSummary={handleRequestSummary}
            onCloseSummary={() => setIsSummaryOpen(false)}
            detectedSpeakers={detectedSpeakers}
            speakerNames={speakerNames}
            isSpeakerModalOpen={isSpeakerModalOpen}
            onOpenSpeakerModal={() => setIsSpeakerModalOpen(true)}
            onCloseSpeakerModal={() => setIsSpeakerModalOpen(false)}
            onSaveSpeakerNames={handleSaveSpeakerNames}
        />
    );
};

export default ContentApp;
