import React from 'react';
import ReactDOM from 'react-dom/client';
import ContentApp from './ContentApp';

// Unique ID for our container
const CONTAINER_ID = 'language-bridge-copilot-root';

function init() {
    if (document.getElementById(CONTAINER_ID)) return;

    const container = document.createElement('div');
    container.id = CONTAINER_ID;
    document.body.appendChild(container);

    const shadowRoot = container.attachShadow({ mode: 'open' });

    // Create a style element for basic resets inside shadow dom if needed
    // For now, Overlay.tsx uses inline styles.

    const root = ReactDOM.createRoot(shadowRoot);
    root.render(
        <React.StrictMode>
            <ContentApp />
        </React.StrictMode>
    );
}

// Initialize on load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
