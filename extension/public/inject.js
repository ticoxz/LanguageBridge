// BananaBridge WebRTC Audio Interceptor
// This script runs in the page context (same world as Google Meet)
(function () {
    console.log('🎯 BananaBridge: WebRTC interceptor loaded');

    // Store original APIs
    const originalGetUserMedia = navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);
    const originalRTCPeerConnection = window.RTCPeerConnection;

    // Store captured streams
    const capturedStreams = {
        local: null,
        remote: []
    };

    // Intercept getUserMedia (microphone)
    navigator.mediaDevices.getUserMedia = async function (constraints) {
        console.log('🎤 BananaBridge: Intercepted getUserMedia:', constraints);
        const stream = await originalGetUserMedia(constraints);

        if (constraints.audio) {
            capturedStreams.local = stream;
            console.log('✅ BananaBridge: Captured local audio stream', stream.id);

            // Notify content script
            window.postMessage({
                type: 'BANANABRIDGE_LOCAL_STREAM',
                streamId: stream.id
            }, '*');
        }

        return stream;
    };

    // Intercept RTCPeerConnection (remote participants)
    window.RTCPeerConnection = function (config) {
        const pc = new originalRTCPeerConnection(config);
        console.log('🔗 BananaBridge: Intercepted RTCPeerConnection');

        // Listen for remote audio tracks
        pc.addEventListener('track', (event) => {
            if (event.track.kind === 'audio') {
                console.log('🔊 BananaBridge: Captured remote audio track', event.streams[0]?.id);

                if (event.streams[0]) {
                    capturedStreams.remote.push(event.streams[0]);

                    // Notify content script
                    window.postMessage({
                        type: 'BANANABRIDGE_REMOTE_STREAM',
                        streamId: event.streams[0].id
                    }, '*');
                }
            }
        });

        return pc;
    };

    // Copy static properties
    window.RTCPeerConnection.prototype = originalRTCPeerConnection.prototype;

    // Expose function to get all streams
    window.getBananaBridgeStreams = () => {
        console.log('📊 BananaBridge: Returning streams', {
            local: capturedStreams.local?.id,
            remote: capturedStreams.remote.map(s => s.id)
        });
        return capturedStreams;
    };

    console.log('✅ BananaBridge: WebRTC interceptor ready');
})();
