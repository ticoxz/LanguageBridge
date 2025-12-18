import { useState, useEffect } from 'react';

export interface Settings {
    language: 'es-ES' | 'en-US' | 'auto';
    position: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
    backendUrl: string;
    englishLevel: 'beginner' | 'intermediate' | 'advanced' | 'native';
    tone: 'formal' | 'casual' | 'friendly';
}

const DEFAULT_SETTINGS: Settings = {
    language: 'auto',
    position: 'bottom-right',
    backendUrl: 'ws://localhost:8000',
    englishLevel: 'intermediate',
    tone: 'casual'
};

export const useSettings = () => {
    const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);

    useEffect(() => {
        // Load settings from localStorage
        const stored = localStorage.getItem('b-bridge-settings');
        if (stored) {
            try {
                const parsed = JSON.parse(stored);
                setSettings({ ...DEFAULT_SETTINGS, ...parsed });
            } catch (e) {
                console.error('Failed to parse settings:', e);
            }
        }
    }, []);

    const updateSettings = (newSettings: Partial<Settings>) => {
        const updated = { ...settings, ...newSettings };
        setSettings(updated);
        localStorage.setItem('b-bridge-settings', JSON.stringify(updated));
    };

    return { settings, updateSettings };
};
