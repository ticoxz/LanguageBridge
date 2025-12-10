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
  // const [mounted, setMounted] = useState(false); // Removed to fix ref hydration
  const targetRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: targetRef,
    offset: ["start start", "end start"],
  });

  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.5], [1, 0.8]);
  const y = useTransform(scrollYProgress, [0, 0.5], [0, 100]);

  // useEffect(() => setMounted(true), []); // Removed

  // if (!mounted) return null; // Removed

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
      <main ref={targetRef} className="relative min-h-screen flex items-center justify-center pt-20 overflow-hidden">
        {/* Dynamic Background */}
        <div className="absolute inset-0 z-0 overflow-hidden">
          <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-[#FFD93D] rounded-full mix-blend-screen blur-[120px] opacity-20 animate-pulse-slow" />
          <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-[#6BCB77] rounded-full mix-blend-screen blur-[120px] opacity-20 animate-pulse-slow delay-1000" />
          <div className="absolute top-[40%] left-[30%] w-[400px] h-[400px] bg-[#4D96FF] rounded-full mix-blend-screen blur-[100px] opacity-20 animate-pulse-slow delay-2000" />
        </div>

        <motion.div
          style={{ opacity, scale, y }}
          className="container mx-auto px-6 text-center relative z-10"
        >
          <motion.h1
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
            className="text-7xl md:text-9xl font-black mb-8 tracking-tighter leading-tight"
          >
            {language === 'en' ? 'Break ' : 'Rompe '} <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#FFD93D] via-[#6BCB77] to-[#4D96FF] drop-shadow-[0_0_30px_rgba(255,217,61,0.5)]">
              {language === 'en' ? 'Barriers' : 'Barreras'}
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 1 }}
            className="text-2xl md:text-3xl text-muted-foreground max-w-3xl mx-auto mb-12 font-light leading-relaxed"
          >
            {t('hero.subtitle')}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex flex-col sm:flex-row gap-6 justify-center items-center"
          >
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-10 py-5 bg-gradient-to-r from-[#FFD93D] via-[#F4D03F] to-[#6BCB77] text-[#1A1A2E] text-xl font-bold rounded-full shadow-[0_0_40px_rgba(255,217,61,0.6)] hover:shadow-[0_0_60px_rgba(255,217,61,0.8)] transition-all flex items-center gap-3 border border-white/20"
            >
              {t('hero.cta')} <ArrowRight size={24} />
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-10 py-5 bg-white/5 hover:bg-white/20 text-foreground text-xl font-semibold rounded-full border border-white/20 backdrop-blur-md shadow-[0_0_20px_rgba(255,255,255,0.1)] transition-all flex items-center gap-3"
              onClick={() => window.open('https://github.com/ticoxz/LanguageBridge', '_blank')}
            >
              <Github size={24} /> {t('hero.github')}
            </motion.button>
          </motion.div>
        </motion.div>
      </main>

      {/* Sticky Scroll Section - How It Works */}
      <section className="relative py-32 bg-background z-20">
        <div className="container mx-auto px-6">
          <motion.h2
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            className="text-5xl md:text-7xl font-bold text-center mb-32 tracking-tight"
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

      {/* Use Cases Section */}
      <section className="py-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#FFD93D]/5 to-transparent" />
        <div className="container mx-auto px-6 relative z-10">
          <h2 className="text-4xl md:text-6xl font-bold text-center mb-24">
            {t('usecases.title')}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <UseCaseCard
              title={t('usecases.remote')}
              desc={t('usecases.remote.desc')}
              icon={<Globe size={32} className="text-[#FFD93D]" />}
              delay={0}
            />
            <UseCaseCard
              title={t('usecases.students')}
              desc={t('usecases.students.desc')}
              icon={<Code size={32} className="text-[#6BCB77]" />}
              delay={0.2}
            />
            <UseCaseCard
              title={t('usecases.creators')}
              desc={t('usecases.creators.desc')}
              icon={<Play size={32} className="text-[#4D96FF]" />}
              delay={0.4}
            />
          </div>
        </div>
      </section>

      {/* Bento Grid Features (Staggered V2) */}
      <section id="features" className="py-32 bg-muted/50">
        <div className="container mx-auto px-6">
          <h2 className="text-4xl md:text-6xl font-bold text-center mb-24">
            {t('features.title')}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-6 gap-6 max-w-7xl mx-auto auto-rows-[300px]">
            {/* Large Card */}
            <BentoCard
              title={t('features.transcription')}
              desc={t('features.transcription.desc')}
              icon={<Mic size={48} className="text-[#FFD93D]" />}
              className="md:col-span-4 bg-gradient-to-br from-[#FFD93D]/10 to-transparent border-[#FFD93D]/20 hover:border-[#FFD93D]/50"
            />
            {/* Tall Card */}
            <BentoCard
              title={t('features.privacy')}
              desc={t('features.privacy.desc')}
              icon={<Shield size={48} className="text-[#6BCB77]" />}
              className="md:col-span-2 md:row-span-2 bg-gradient-to-b from-[#6BCB77]/10 to-transparent border-[#6BCB77]/20 hover:border-[#6BCB77]/50"
            />
            {/* Medium Card */}
            <BentoCard
              title={t('features.translation')}
              desc={t('features.translation.desc')}
              icon={<Globe size={48} className="text-[#4D96FF]" />}
              className="md:col-span-2 bg-gradient-to-tr from-[#4D96FF]/10 to-transparent border-[#4D96FF]/20 hover:border-[#4D96FF]/50"
            />
            {/* Medium Card */}
            <BentoCard
              title="Github"
              desc={t('hero.github')}
              icon={<Github size={48} className="text-white" />}
              className="md:col-span-2 cursor-pointer bg-white/5 hover:bg-white/10"
              onClick={() => window.open('https://github.com/ticoxz/LanguageBridge', '_blank')}
            />
          </div>
        </div>
      </section>

      {/* Specs Section */}
      <section className="py-24 border-t border-white/5">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-16 text-gray-500 uppercase tracking-widest">{t('specs.title')}</h2>
          <div className="flex flex-wrap justify-center gap-12 md:gap-24 text-center">
            <div>
              <div className="text-4xl md:text-5xl font-black text-[#FFD93D] mb-2 font-mono">&lt;500ms</div>
              <div className="text-sm font-medium text-gray-400 uppercase tracking-widest">{t('specs.latency')}</div>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-black text-[#6BCB77] mb-2 font-mono">99.9%</div>
              <div className="text-sm font-medium text-gray-400 uppercase tracking-widest">{t('specs.accuracy')}</div>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-black text-[#4D96FF] mb-2 font-mono">E2E</div>
              <div className="text-sm font-medium text-gray-400 uppercase tracking-widest">{t('specs.security')}</div>
            </div>
          </div>
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

// ... Step component ...

function Step({ number, title, desc, align, color }: { number: string, title: string, desc: string, align: 'left' | 'right', color: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: align === 'left' ? -50 : 50 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, margin: "-20%" }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className={`flex flex-col md:flex-row items-center gap-12 ${align === 'right' ? 'md:flex-row-reverse' : ''}`}
    >
      <div className="flex-1 text-center md:text-left">
        <div
          className="text-8xl md:text-9xl font-black opacity-30 mb-4 tracking-tighter"
          style={{ color: color, textShadow: `0 0 30px ${color}40` }}
        >
          {number}
        </div>
        <h3 className="text-4xl md:text-5xl font-bold mb-6" style={{ color: color }}>{title}</h3>
        <p className="text-2xl text-muted-foreground leading-relaxed">{desc}</p>
      </div>
      <div className="flex-1 h-64 md:h-96 w-full glass-card rounded-[2rem] flex items-center justify-center bg-black/20 border border-white/10 relative overflow-hidden group shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-br from-transparent to-black/80" />
        <div className="w-48 h-48 rounded-full blur-[80px] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 transition-all duration-700 group-hover:scale-150 group-hover:opacity-100 opacity-60" style={{ background: color }} />
        <div className="relative z-10 text-white drop-shadow-[0_4px_4px_rgba(0,0,0,0.5)] transition-transform duration-500 group-hover:scale-110">
          {number === '01' && <Zap size={100} strokeWidth={1.5} />}
          {number === '02' && <Code size={100} strokeWidth={1.5} />}
          {number === '03' && <MessageSquare size={100} strokeWidth={1.5} />}
        </div>
      </div>
    </motion.div>
  )
}

function BentoCard({ title, desc, icon, className, onClick }: { title: string, desc: string, icon: React.ReactNode, className?: string, onClick?: () => void }) {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className={`p-10 rounded-3xl border backdrop-blur-xl transition-all duration-500 flex flex-col justify-between group overflow-hidden relative ${className}`}
      onClick={onClick}
    >
      {/* Removed decorative icon as requested */}
      <div className="relative z-10">
        <div className="mb-6 opacity-80 group-hover:opacity-100 transition-opacity">{icon}</div>
        <h3 className="text-3xl font-bold mb-4">{title}</h3>
        <p className="text-xl text-muted-foreground/80 group-hover:text-muted-foreground transition-colors">{desc}</p>
      </div>
    </motion.div>
  )
}

function UseCaseCard({ title, desc, icon, delay }: { title: string, desc: string, icon: React.ReactNode, delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay, duration: 0.5 }}
      className="bg-white/5 border border-white/10 p-8 rounded-2xl hover:bg-white/10 transition-colors"
    >
      <div className="bg-white/5 w-14 h-14 rounded-full flex items-center justify-center mb-6">
        {icon}
      </div>
      <h3 className="text-xl font-bold mb-3">{title}</h3>
      <p className="text-gray-400">{desc}</p>
    </motion.div>
  )
}
