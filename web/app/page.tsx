'use client';

import { motion, useScroll, useTransform } from 'framer-motion';
import { Mic, Globe, MessageSquare, Shield, Zap, Code, Github, ArrowRight, Play, Moon, Sun, Languages } from 'lucide-react';
import Link from 'next/link';
import { useLanguage } from './providers';
import { useTheme } from 'next-themes';
import { useEffect, useState, useRef } from 'react';

export default function Home() {
  const { t, language, setLanguage } = useLanguage();
  const { theme, setTheme } = useTheme();
  const targetRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: targetRef,
    offset: ["start start", "end start"],
  });

  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.5], [1, 0.8]);
  const y = useTransform(scrollYProgress, [0, 0.5], [0, 100]);

  return (
    <div className="min-h-screen flex flex-col overflow-x-hidden bg-background text-foreground transition-colors duration-300">
      {/* Navbar */}
      <nav className="fixed w-full z-50 bg-background/80 backdrop-blur-md border-b border-white/10">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2 text-2xl font-bold"
          >
            <motion.span
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
              className="text-3xl"
            >
              🍌
            </motion.span>
            <span className="text-gradient">L-Bridge</span>
          </motion.div>

          <div className="flex gap-4 items-center">
            {/* Theme Toggle */}
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-2 rounded-full hover:bg-white/10 transition-colors"
            >
              {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </button>

            {/* Language Toggle */}
            <button
              onClick={() => setLanguage(language === 'en' ? 'es' : 'en')}
              className="px-3 py-1 rounded-full border border-white/10 hover:bg-white/10 transition-colors text-sm font-medium flex items-center gap-2"
            >
              <Languages size={16} />
              {language === 'en' ? 'ES' : 'EN'}
            </button>

            <Link href="https://github.com/ticoxz/LanguageBridge" className="hover:text-[#FFD93D] transition-colors flex items-center gap-2 ml-2">
              <Github size={20} />
              <span className="hidden sm:inline">GitHub</span>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main ref={targetRef} className="relative pt-32 pb-20 md:pt-48 md:pb-32 px-6 overflow-hidden">
        {/* Dynamic Background */}
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-[#FFD93D] rounded-full mix-blend-screen blur-[120px] opacity-10 animate-pulse-slow" />
          <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-[#6BCB77] rounded-full mix-blend-screen blur-[120px] opacity-10 animate-pulse-slow delay-1000" />
        </div>

        <div className="container mx-auto relative z-10 text-center max-w-5xl">
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tight leading-tight mb-8"
          >
            {language === 'en' ? 'ELIMINATE LANGUAGE ' : 'ELIMINA LA ANSIEDAD '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FFD93D] to-[#6BCB77]">
              {language === 'en' ? 'ANXIETY.' : 'DEL IDIOMA.'}
            </span>
            <br className="hidden md:block" />
            <span className="text-white/80 text-4xl md:text-6xl block mt-4">
              {language === 'en' ? 'ZERO ERRORS. 100% PRODUCTIVITY.' : 'CERO ERRORES. 100% PRODUCTIVIDAD.'}
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.8 }}
            className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto mb-12 font-light"
          >
            {t('hero.subtitle')}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex flex-col items-center gap-4"
          >
            <button className="px-12 py-6 bg-white text-black text-xl font-bold rounded-full hover:scale-105 transition-transform shadow-[0_0_50px_rgba(255,255,255,0.3)]">
              {t('hero.cta')}
            </button>
            <span className="text-sm text-muted-foreground opacity-70">
              {t('hero.cta_sub')}
            </span>
          </motion.div>
        </div>
      </main>

      {/* 3 Key Features Icons */}
      <section className="py-20 bg-white/5 border-y border-white/5">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
            <FeatureIcon icon={<MessageSquare size={40} />} title={t('features.subtitles')} desc={t('features.subtitles.desc')} color="#FFD93D" />
            <FeatureIcon icon={<Zap size={40} />} title={t('features.smart')} desc={t('features.smart.desc')} color="#6BCB77" />
            <FeatureIcon icon={<Code size={40} />} title={t('features.summaries')} desc={t('features.summaries.desc')} color="#4D96FF" />
          </div>
        </div>
      </section>

      {/* Pain Section */}
      <section className="py-32">
        <div className="container mx-auto px-6 max-w-6xl">
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-20">{t('pain.title')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <PainCard title={t('pain.error')} desc={t('pain.error.desc')} icon={<Shield size={40} className="text-red-400" />} />
            <PainCard title={t('pain.silent')} desc={t('pain.silent.desc')} icon={<Mic size={40} className="text-orange-400" />} />
          </div>
        </div>
      </section>

      {/* Sticky Scroll Section - How It Works */}
      <section className="relative py-32 bg-background z-20">
        <div className="container mx-auto px-6">
          <motion.h2
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            className="text-4xl md:text-6xl font-bold text-center mb-32 tracking-tight"
          >
            {t('how.title')}
          </motion.h2>

          <div className="space-y-40">
            <Step
              number="01"
              title={t('how.step1')}
              desc={t('how.step1.desc')}
              align="left"
              color="#FFD93D"
            />
            <Step
              number="02"
              title={t('how.step2')}
              desc={t('how.step2.desc')}
              align="right"
              color="#6BCB77"
            />
            <Step
              number="03"
              title={t('how.step3')}
              desc={t('how.step3.desc')}
              align="left"
              color="#4D96FF"
            />
          </div>
        </div>
      </section>

      {/* Trust / Different Section */}
      <section className="py-32 bg-gradient-to-b from-transparent to-white/5">
        <div className="container mx-auto px-6 max-w-4xl text-center">
          <h2 className="text-3xl md:text-5xl font-bold mb-16 leading-tight">{t('trust.title')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="p-8 rounded-3xl bg-black/40 border border-white/10">
              <Shield size={48} className="mx-auto mb-6 text-[#6BCB77]" />
              <h3 className="text-2xl font-bold mb-4">{t('trust.privacy')}</h3>
              <p className="text-muted-foreground">{t('trust.privacy.desc')}</p>
            </div>
            <div className="p-8 rounded-3xl bg-black/40 border border-white/10">
              <Zap size={48} className="mx-auto mb-6 text-[#4D96FF]" />
              <h3 className="text-2xl font-bold mb-4">{t('trust.disruption')}</h3>
              <p className="text-muted-foreground">{t('trust.disruption.desc')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-32">
        <div className="container mx-auto px-6 max-w-5xl">
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-20">{t('pricing.title')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="p-10 rounded-3xl border border-white/10 bg-white/5 flex flex-col items-center text-center hover:border-white/20 transition-colors">
              <h3 className="text-2xl font-bold mb-2 uppercase tracking-widest text-[#FFD93D]">{t('pricing.free')}</h3>
              <div className="text-5xl font-black mb-6">$0</div>
              <p className="text-xl text-muted-foreground mb-8">{t('pricing.free.desc')}</p>
              <button className="mt-auto px-8 py-3 rounded-full border border-white/20 hover:bg-white/10 transition-colors font-medium">
                {t('hero.cta')}
              </button>
            </div>
            <div className="p-10 rounded-3xl border border-[#6BCB77]/30 bg-gradient-to-b from-[#6BCB77]/10 to-transparent flex flex-col items-center text-center relative overflow-hidden">
              <div className="absolute top-0 inset-x-0 h-1 bg-[#6BCB77] shadow-[0_0_20px_#6BCB77]" />
              <h3 className="text-2xl font-bold mb-2 uppercase tracking-widest text-[#6BCB77]">{t('pricing.pro')}</h3>
              <div className="text-5xl font-black mb-6">{t('pricing.pro.price')}</div>
              <p className="text-xl text-muted-foreground mb-8">{t('pricing.pro.desc')}</p>
              <button className="mt-auto px-8 py-3 rounded-full bg-[#6BCB77] text-black hover:bg-[#5db368] transition-colors font-bold shadow-lg shadow-[#6BCB77]/20">
                {t('hero.cta')}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Email Capture */}
      <section className="py-32 border-t border-white/10 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-[#FFD93D]/10 via-transparent to-[#4D96FF]/10 opacity-30" />
        <div className="container mx-auto px-6 max-w-xl relative z-10 text-center">
          <h2 className="text-3xl font-bold mb-8">{t('form.join')}</h2>
          <form className="flex flex-col gap-4">
            <input type="text" placeholder={t('form.name')} className="p-4 rounded-xl bg-white/5 border border-white/10 focus:border-white/30 outline-none transition-colors" />
            <input type="email" placeholder={t('form.placeholder')} className="p-4 rounded-xl bg-white/5 border border-white/10 focus:border-white/30 outline-none transition-colors" />
            <button type="submit" className="p-4 rounded-xl bg-white text-black font-bold text-lg hover:scale-[1.02] transition-transform">
              {t('hero.cta')}
            </button>
          </form>
        </div>
      </section>

      <footer className="py-20 border-t border-white/10 text-center text-muted-foreground bg-black/50 backdrop-blur-xl">
        <p className="flex items-center justify-center gap-2 text-lg mb-4">
          {t('footer.made')} <span className="text-2xl animate-bounce">🍌</span>
        </p>
        <p className="text-sm opacity-50 uppercase tracking-widest">
          {t('hero.title')}
        </p>
      </footer>
    </div>
  );
}

function FeatureIcon({ icon, title, desc, color }: { icon: React.ReactNode, title: string, desc: string, color: string }) {
  return (
    <div className="flex flex-col items-center">
      <div className="w-20 h-20 rounded-2xl bg-white/5 flex items-center justify-center mb-6 text-white shadow-xl shadow-black/50 overflow-hidden relative group">
        <div className="absolute inset-0 opacity-20 group-hover:opacity-40 transition-opacity" style={{ backgroundColor: color }} />
        <div className="relative z-10" style={{ color: color }}>{icon}</div>
      </div>
      <h3 className="text-xl font-bold mb-2">{title}</h3>
      <p className="text-muted-foreground text-sm max-w-[200px] mx-auto opacity-70">{desc}</p>
    </div>
  )
}

function PainCard({ title, desc, icon }: { title: string, desc: string, icon: React.ReactNode }) {
  return (
    <div className="p-8 rounded-3xl bg-[#1A1A2E] border border-white/5 hover:border-white/10 transition-colors flex gap-6 items-start group">
      <div className="shrink-0 p-4 rounded-xl bg-white/5 group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <div>
        <h3 className="text-2xl font-bold mb-3 group-hover:text-white transition-colors">{title}</h3>
        <p className="text-lg text-muted-foreground leading-relaxed">{desc}</p>
      </div>
    </div>
  )
}
