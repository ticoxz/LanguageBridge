'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { ThemeProvider as NextThemesProvider } from 'next-themes';

type Language = 'en' | 'es';

interface LanguageContextType {
    language: Language;
    setLanguage: (lang: Language) => void;
    t: (key: string) => string;
}

const translations = {
    en: {
        'hero.title': 'Break Language Barriers',
        'hero.subtitle': 'Real-time transcription and translation for your meetings.',
        'hero.cta': 'Get Started Free',
        'hero.github': 'Star on GitHub',
        'features.title': 'Why L-Bridge?',
        'features.transcription': 'Real-time Transcription',
        'features.transcription.desc': 'Powered by Google Cloud Speech-to-Text. <500ms latency.',
        'features.translation': 'Bidirectional Translation',
        'features.translation.desc': 'Spanish ↔ English automatic detection.',
        'features.privacy': 'Privacy First',
        'features.privacy.desc': 'Audio processed locally and never stored.',
        'how.title': 'How it Works',
        'how.step1': 'Install Extension',
        'how.step1.desc': 'Add to Chrome in one click.',
        'how.step2': 'Join Meeting',
        'how.step2.desc': 'Works automatically with Google Meet.',
        'how.step3': 'See Magic',
        'how.step3.desc': 'Subtitles appear instantly.',
        'usecases.title': 'Perfect For...',
        'usecases.remote': 'Remote Teams',
        'usecases.remote.desc': 'Sync with your team across timezones and languages.',
        'usecases.students': 'International Students',
        'usecases.students.desc': 'Never miss a detail in lectures. Capture every word.',
        'usecases.creators': 'Content Creators',
        'usecases.creators.desc': 'Reach a global audience with instant captions.',
        'specs.title': 'Technical Specifications',
        'specs.latency': 'Ultra Low Latency',
        'specs.latency.desc': '<500ms processing time',
        'specs.accuracy': 'AI Accuracy',
        'specs.accuracy.desc': '99.9% transcription rate',
        'specs.security': 'End-to-End Encrypted',
        'specs.security.desc': 'Enterprise grade security',
        'footer.made': 'Made with ❤️ by tico',
    },
    es: {
        'hero.title': 'Rompe Barreras de Idioma',
        'hero.subtitle': 'Transcripción y traducción en tiempo real para tus reuniones.',
        'hero.cta': 'Comenzar Gratis',
        'hero.github': 'Estrella en GitHub',
        'features.title': '¿Por qué L-Bridge?',
        'features.transcription': 'Transcripción en Vivo',
        'features.transcription.desc': 'Potenciado por Google Cloud. Latencia <500ms.',
        'features.translation': 'Traducción Bidireccional',
        'features.translation.desc': 'Detección automática Español ↔ Inglés.',
        'features.privacy': 'Privacidad Primero',
        'features.privacy.desc': 'Audio procesado localmente, nunca guardado.',
        'how.title': 'Cómo Funciona',
        'how.step1': 'Instala la Extensión',
        'how.step1.desc': 'Agrega a Chrome en un click.',
        'how.step2': 'Entra a la Reunión',
        'how.step2.desc': 'Funciona automático en Google Meet.',
        'how.step3': 'Mira la Magia',
        'how.step3.desc': 'Los subtítulos aparecen al instante.',
        'usecases.title': 'Perfecto Para...',
        'usecases.remote': 'Equipos Remotos',
        'usecases.remote.desc': 'Sincronízate con tu equipo global.',
        'usecases.students': 'Estudiantes Internacionales',
        'usecases.students.desc': 'No pierdas detalle en tus clases.',
        'usecases.creators': 'Creadores de Contenido',
        'usecases.creators.desc': 'Alcanza una audiencia global.',
        'specs.title': 'Especificaciones Técnicas',
        'specs.latency': 'Latencia Ultra Baja',
        'specs.latency.desc': '<500ms tiempo de proceso',
        'specs.accuracy': 'Precisión IA',
        'specs.accuracy.desc': '99.9% tasa de transcripción',
        'specs.security': 'Encriptación E2E',
        'specs.security.desc': 'Seguridad grado empresarial',
        'footer.made': 'Hecho con ❤️ por tico',
    }
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function Providers({ children }: { children: React.ReactNode }) {
    const [language, setLanguage] = useState<Language>('en');
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const t = (key: string) => {
        // @ts-ignore
        return translations[language][key] || key;
    };

    // Ensure the provider is always rendered to prevent context errors
    return (
        <NextThemesProvider attribute="class" defaultTheme="dark" enableSystem={false}>
            <LanguageContext.Provider value={{ language, setLanguage, t }}>
                {mounted ? children : <div style={{ visibility: 'hidden' }}>{children}</div>}
            </LanguageContext.Provider>
        </NextThemesProvider>
    );
}

export function useLanguage() {
    const context = useContext(LanguageContext);
    if (context === undefined) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
}
