chrome.runtime.onInstalled.addListener(() => {
    console.log('LanguageBridge Extension Installed');
});

// Keep-alive or other logic can go here.
// For now, the heavy lift is in the content script + websocket.
