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
        'hero.title': 'ELIMINATE LANGUAGE ANXIETY. ZERO ERRORS. 100% PRODUCTIVITY.',
        'hero.subtitle': 'Your Invisible Copilot Turning Conversation into Action.',
        'hero.cta': 'REQUEST FREE BETA ACCESS',
        'hero.cta_sub': 'Includes 15 Minutes of Instant Translation per Month',
        'hero.github': 'Star on GitHub',

        'features.title': 'Why L-Bridge?',
        'features.subtitles': 'Real-time Subtitles',
        'features.subtitles.desc': 'Instant transcription for every meeting.',
        'features.smart': 'Smart Replies',
        'features.smart.desc': 'AI suggestions to keep the conversation flowing.',
        'features.summaries': 'Instant Summaries',
        'features.summaries.desc': 'Get meeting recaps automatically.',

        'pain.title': 'Why is the Language Barrier Costing You Money?',
        'pain.error': 'Risk of Errors',
        'pain.error.desc': 'A misunderstanding can translate into costly errors in code or strategy.',
        'pain.silent': 'Silent Talent',
        'pain.silent.desc': 'Talented members stay silent out of fear, losing valuable ideas.',

        'trust.title': 'LanguageBridge is different: A Trust Tool, Not a Bot.',
        'trust.privacy': 'Total Privacy',
        'trust.privacy.desc': 'Only you receive help. No one knows you use assistance.',
        'trust.disruption': 'Zero Disruption',
        'trust.disruption.desc': 'The assistant whispers info without you interacting with the app.',

        'pricing.title': 'Try Us Free. Eliminate Risk Today.',
        'pricing.free': 'FREE TIER',
        'pricing.free.desc': '15 Minutes Free/Month. (Enough for your daily meetings).',
        'pricing.pro': 'PRO PLAN',
        'pricing.pro.desc': 'Unlimited Use, Advanced Smart Replies & Full History.',
        'pricing.pro.price': '$19 USD/mo',

        'form.join': 'Join Waitlist',
        'form.placeholder': 'Enter your email',
        'form.name': 'Your Name',

        'footer.made': 'Made with ❤️ by tico',
        'how.title': 'How it Works',
        'how.step1': 'Install Extension',
        'how.step1.desc': 'Add to Chrome in one click.',
        'how.step2': 'Join Meeting',
        'how.step2.desc': 'Works automatically with Google Meet.',
        'how.step3': 'See Magic',
        'how.step3.desc': 'Subtitles appear instantly.',
    },
    es: {
        'hero.title': 'ELIMINA LA ANSIEDAD DEL IDIOMA. CERO ERRORES. 100% PRODUCTIVIDAD.',
        'hero.subtitle': 'Tu Copiloto Invisible que Convierte la Conversación en Acción.',
        'hero.cta': 'SOLICITA ACCESO GRATUITO A LA BETA',
        'hero.cta_sub': 'Incluye 15 Minutos de Traducción Instantánea al Mes',
        'hero.github': 'Estrella en GitHub',

        'features.title': '¿Por qué L-Bridge?',
        'features.subtitles': 'Subtítulos en Tiempo Real',
        'features.subtitles.desc': 'Transcripción instantánea para cada reunión.',
        'features.smart': 'Smart Replies',
        'features.smart.desc': 'Sugerencias de IA para mantener la fluidez.',
        'features.summaries': 'Resúmenes Instantáneos',
        'features.summaries.desc': 'Obtén recaps de la reunión automáticamente.',

        'pain.title': '¿Por qué la Barrera del Idioma te está costando Dinero?',
        'pain.error': 'Riesgo de Errores',
        'pain.error.desc': 'Un malentendido puede traducirse en errores costosos en el código o la estrategia.',
        'pain.silent': 'Talento Silencioso',
        'pain.silent.desc': 'Los miembros talentosos se quedan callados por miedo a hablar, perdiendo ideas valiosas.',

        'trust.title': 'LanguageBridge es diferente: Es una Herramienta de Confianza, No un Bot.',
        'trust.privacy': 'Privacidad Total',
        'trust.privacy.desc': 'La ayuda solo la recibes tú. Nadie sabe que usas la asistencia.',
        'trust.disruption': 'Cero Disrupción',
        'trust.disruption.desc': 'El asistente te susurra la información sin que tengas que interactuar con la app.',

        'pricing.title': 'Pruébanos Gratis. Elimina el Riesgo Hoy Mismo.',
        'pricing.free': 'FREE TIER',
        'pricing.free.desc': '15 Minutos Gratis al Mes. (Suficiente para todas tus reuniones daily).',
        'pricing.pro': 'PLAN PRO',
        'pricing.pro.desc': 'Uso Ilimitado, Smart Replies Avanzadas e Historial Completo.',
        'pricing.pro.price': '$19 USD/mes',

        'form.join': 'Unirse a la Espera',
        'form.placeholder': 'Ingresa tu email',
        'form.name': 'Tu Nombre',

        'footer.made': 'Hecho con ❤️ por tico',
        'how.title': 'Cómo Funciona',
        'how.step1': 'Instala la Extensión',
        'how.step1.desc': 'Agrega a Chrome en un click.',
        'how.step2': 'Entra a la Reunión',
        'how.step2.desc': 'Funciona automático en Google Meet.',
        'how.step3': 'Mira la Magia',
        'how.step3.desc': 'Los subtítulos aparecen al instante.',
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
