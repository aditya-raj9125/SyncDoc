'use client';

import { useRef, useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import {
  ArrowRight,
  Users,
  Zap,
  FileText,
  Shield,
  Globe,
  Sparkles,
  Layers,
  PenTool,
  CheckCircle2,
  Menu,
  X,
  Twitter,
  Linkedin,
  Github,
  ChevronRight,
  Sun,
  Moon,
  MousePointer2,
} from 'lucide-react';
import { ThemeToggle } from '@/components/ui/ThemeToggle';

/* ─── Logo ──────────────────────────────────────────────── */
function SyncDocLogo({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <div className={`relative flex items-center justify-center rounded-xl bg-[var(--text-primary)] transition-colors ${className}`}>
      <FileText size={16} className="text-[var(--bg-canvas)] fill-[var(--bg-canvas)]" />
      <div className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-[#00d4bc] border-2 border-[var(--bg-canvas)]" />
    </div>
  );
}

/* ─── Helpers ────────────────────────────────────────────── */
function FadeIn({
  children,
  className = '',
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 28 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.55, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-[#00b49c]">
      {children}
    </p>
  );
}

/* ─── Editor Demo Mock ──────────────────────────────────── */
function EditorDemo() {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-[var(--bg-border)] bg-[var(--bg-surface)] shadow-[0_8px_48px_rgba(0,0,0,0.1)]">
      {/* top bar */}
      <div className="flex items-center justify-between border-b border-[var(--bg-border)] px-4 py-2.5">
        <div className="flex gap-1.5">
          <div className="h-3 w-3 rounded-full bg-red-400/70" />
          <div className="h-3 w-3 rounded-full bg-yellow-400/70" />
          <div className="h-3 w-3 rounded-full bg-green-400/70" />
        </div>
        <span className="text-[11px] text-[var(--text-tertiary)] italic">Q4 Strategy — SyncDoc</span>
        <div className="flex -space-x-2">
          {['bg-indigo-500', 'bg-emerald-500', 'bg-amber-400'].map((c, i) => (
            <div key={i} className={`h-6 w-6 rounded-full ${c} ring-2 ring-[var(--bg-surface)] flex items-center justify-center text-[9px] font-bold text-white`}>
              {['A', 'S', 'J'][i]}
            </div>
          ))}
        </div>
      </div>
      {/* toolbar */}
      <div className="flex items-center gap-1 border-b border-[var(--bg-border)] px-4 py-1.5">
        {['B', 'I', 'U'].map(k => (
          <div key={k} className="flex h-6 w-6 items-center justify-center rounded text-[11px] font-bold text-[var(--text-tertiary)] hover:bg-[var(--bg-elevated)]">{k}</div>
        ))}
        <div className="mx-1 h-4 w-px bg-[var(--bg-border)]" />
        <div className="rounded px-2 py-0.5 text-[10px] text-[var(--text-tertiary)]">Heading 1</div>
      </div>
      {/* content */}
      <div className="px-6 py-5">
        <h3 className="font-display text-xl italic text-[var(--text-primary)]">Q4 Product Strategy</h3>
        <p className="mt-3 text-[13px] leading-relaxed text-[var(--text-secondary)]">
          Our focus this quarter is expanding real-time collaboration. Key initiatives include{' '}
          <span className="border-b-2 border-indigo-400 text-[var(--text-primary)]">AI-powered suggestions</span>
          {' '}that help teams write 3× faster.
        </p>
        <div className="relative mt-5">
          <div className="absolute -left-0 top-0 h-[18px] w-0.5 rounded-full bg-emerald-400" />
          <div className="absolute -left-0 -top-5 rounded bg-emerald-400 px-1.5 py-0.5 text-[9px] font-semibold text-white whitespace-nowrap">Sarah K.</div>
        </div>
        <p className="mt-2 text-[13px] leading-relaxed text-[var(--text-secondary)]">
          We&apos;ll prioritize mobile-first design patterns and deploy the DOCX export pipeline
          by end of <span className="border-b-2 border-amber-400 text-[var(--text-primary)]">October</span>.
        </p>
        <div className="mt-3 flex items-center justify-between border-t border-[var(--bg-border)] pt-3">
          <span className="text-[10px] text-[var(--text-tertiary)]">3 collaborators editing · synced</span>
          <div className="flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5">
            <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-medium text-emerald-600">Live</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Problem mock ──────────────────────────────────────── */
function ProblemMock() {
  return (
    <div className="mx-auto max-w-sm overflow-hidden rounded-2xl border border-[var(--bg-border)] bg-[var(--bg-surface)] shadow-[0_24px_48px_rgba(0,0,0,0.08)]">
      <div className="border-b border-[var(--bg-border)] px-5 py-3 bg-[var(--bg-elevated)]/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-[var(--bg-surface)] border border-[var(--bg-border)] flex items-center justify-center shadow-sm">
              <FileText size={14} className="text-[var(--text-tertiary)]" />
            </div>
            <div>
              <div className="text-[12px] font-semibold text-[var(--text-primary)]">Q4_Launch_Draft.docx</div>
              <div className="text-[10px] text-[var(--text-tertiary)]">Last edit: Oct 12, 2026</div>
            </div>
          </div>
          <div className="rounded-full bg-red-500/10 px-2 py-0.5 text-[9px] font-bold text-red-600">CONFLICT</div>
        </div>
      </div>
      <div className="p-5 space-y-4">
        {/* simulated conflict view */}
        <div className="space-y-2 opacity-40">
          <div className="h-2 w-full rounded bg-[var(--bg-border)]" />
          <div className="h-2 w-3/4 rounded bg-[var(--bg-border)]" />
        </div>

        <div className="rounded-xl border border-red-200 bg-red-50/50 p-3 dark:bg-red-900/10 dark:border-red-900/30">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-[10px] font-bold text-red-600 uppercase tracking-wider">Unsaved Changes</span>
            <span className="text-[9px] text-red-400 italic font-medium">Overwritten by Sarah K.</span>
          </div>
          <p className="text-[11px] leading-relaxed text-red-800 dark:text-red-300">
            "We should aim for a <span className="bg-red-200/50 px-1 rounded line-through">15% increase</span> in Q4 conversion rates..."
          </p>
        </div>

        <div className="flex items-center gap-2 rounded-full border border-[var(--bg-border)] bg-[var(--bg-canvas)] px-3 py-2 text-[11px] text-[var(--text-secondary)] shadow-inner">
          <Globe size={12} className="text-amber-500" />
          <span>Sync failed: Reconnect to resolve</span>
          <div className="ml-auto flex items-center gap-1">
            <div className="h-1.5 w-1.5 rounded-full bg-red-400" />
            <div className="h-1.5 w-1.5 rounded-full bg-red-400 opacity-50" />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Solution mock tabs ─────────────────────────────────── */
function SolutionDemo() {
  const [tab, setTab] = useState<'realtime' | 'offline'>('realtime');
  return (
    <div>
      {/* tab row */}
      <div className="mb-6 flex gap-3">
        {(['realtime', 'offline'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-full px-5 py-2 text-sm font-medium transition-all ${tab === t
                ? 'bg-[var(--text-primary)] text-[var(--bg-canvas)] shadow-sm'
                : 'border border-[var(--bg-border)] bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:border-[var(--text-primary)]'
              }`}
          >
            {t === 'realtime' ? 'Real-time Sync' : 'Offline Mode'}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.25 }}
          className="overflow-hidden rounded-2xl border border-[var(--bg-border)] bg-[var(--bg-surface)] shadow-[0_4px_24px_rgba(0,0,0,0.06)]"
        >
          {tab === 'realtime' ? (
            <div className="p-6">
              <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs font-semibold text-emerald-600">Active Session</span>
                </div>
                <div className="flex -space-x-1.5">
                  {['S', 'J', 'M'].map((l, i) => (
                    <div key={i} className="h-6 w-6 rounded-full bg-emerald-500 text-[10px] font-bold text-white ring-2 ring-white flex items-center justify-center uppercase">{l}</div>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <div className="relative">
                  <div className="h-2.5 w-[85%] rounded bg-[var(--bg-elevated)]" />
                  <motion.div
                    animate={{ left: ['10%', '60%', '30%'] }}
                    transition={{ duration: 4, repeat: Infinity }}
                    className="absolute -top-3 left-0"
                  >
                    <MousePointer2 size={12} className="text-indigo-500 fill-indigo-500" />
                    <div className="ml-2 rounded-sm bg-indigo-500 px-1 py-0.5 text-[8px] font-bold text-white">Sarah</div>
                  </motion.div>
                </div>
                <div className="h-2.5 w-[60%] rounded bg-[var(--bg-elevated)]" />
                <div className="relative">
                  <div className="h-2.5 w-[92%] rounded bg-[var(--bg-elevated)]" />
                  <motion.div
                    animate={{ left: ['80%', '40%', '70%'] }}
                    transition={{ duration: 5, repeat: Infinity, delay: 1 }}
                    className="absolute -top-3 left-0"
                  >
                    <MousePointer2 size={12} className="text-emerald-500 fill-emerald-500" />
                    <div className="ml-2 rounded-sm bg-emerald-500 px-1 py-0.5 text-[8px] font-bold text-white">James</div>
                  </motion.div>
                </div>
              </div>

              <div className="mt-8 flex items-center gap-3 rounded-2xl bg-[#00b49c]/10 p-4 border border-[#00b49c]/20">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#00b49c]">
                  <Zap size={16} className="text-white" />
                </div>
                <div>
                  <div className="text-[12px] font-bold text-[#00b49c]">Sub-100ms Sync</div>
                  <div className="text-[10px] text-[#00b49c]/70 font-medium">Global low-latency WebSocket edge</div>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-6">
              <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-amber-500" />
                  <span className="text-xs font-semibold text-amber-600">Local Journal</span>
                </div>
                <div className="rounded-full bg-amber-100 px-2 py-0.5 text-[9px] font-bold text-amber-700 uppercase tracking-tighter">4 Pending</div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={12} className="text-amber-500" />
                  <div className="h-2 w-[70%] rounded bg-amber-500/10" />
                </div>
                <div className="flex items-center gap-2 italic text-[10px] text-amber-600/60 ml-5 font-medium">
                  Optimistic UI commitment: done
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 rounded border-2 border-dashed border-amber-300 animate-spin" />
                  <div className="h-2 w-[40%] rounded bg-amber-500/10" />
                </div>
              </div>

              <div className="mt-8 flex items-center gap-3 rounded-2xl bg-amber-500/10 p-4 border border-amber-500/20">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500">
                  <Globe size={16} className="text-white" />
                </div>
                <div>
                  <div className="text-[12px] font-bold text-amber-600">Persistent Storage</div>
                  <div className="text-[10px] text-amber-600/70 font-medium">Reliable IndexedDB backup</div>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

/* ─── Brand Logos strip ─────────────────────────────────── */
function LogoStrip() {
  const logos = ['Notion', 'Vercel', 'Linear', 'Supabase', 'Anthropic', 'Figma', 'GitHub', 'Stripe'];
  return (
    <div className="relative overflow-hidden py-2">
      <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-20 z-10 bg-gradient-to-r from-[var(--bg-canvas)] to-transparent" />
      <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-20 z-10 bg-gradient-to-l from-[var(--bg-canvas)] to-transparent" />
      <motion.div
        animate={{ x: ['0%', '-50%'] }}
        transition={{ duration: 18, ease: 'linear', repeat: Infinity }}
        className="flex items-center gap-12 whitespace-nowrap"
      >
        {[...logos, ...logos].map((name, i) => (
          <span key={i} className="text-[13px] font-semibold text-[var(--text-tertiary)]">{name}</span>
        ))}
      </motion.div>
    </div>
  );
}

/* ─── MAIN ───────────────────────────────────────────────── */
export default function LandingPage() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const navLinks = [
    { label: 'Features', href: '#features' },
    { label: 'How it works', href: '#how-it-works' },
    { label: 'Security', href: '#security' },
    { label: 'Docs', href: '#docs' },
  ];

  const contentClass = "mx-auto max-w-5xl px-6";

  return (
    <div className="min-h-screen bg-[var(--bg-canvas)] text-[var(--text-primary)] antialiased overflow-x-hidden transition-colors duration-300">

      {/* ── Announcement bar ──────────────────────────────── */}
      <div className="flex items-center justify-center gap-2 bg-neutral-950 px-4 py-2 text-center text-[12px] text-neutral-300">
        <span className="hidden sm:inline">SyncDoc v2.0 is live — real-time collaboration, AI-native editing, and sub-100ms sync.</span>
        <span className="sm:hidden">SyncDoc v2.0 is live.</span>
        <Link href="/signup" className="font-semibold text-[#00d4bc] hover:underline">
          Get started free →
        </Link>
      </div>

      {/* ── Navbar ───────────────────────────────────────── */}
      <header className="sticky top-6 z-50 px-6">
        <nav
          className={`mx-auto transition-all duration-500 border backdrop-blur-xl shadow-sm ${scrolled
              ? 'max-w-4xl rounded-full border-white/20 bg-white/70 dark:border-neutral-800/50 dark:bg-neutral-900/70 shadow-[0_8px_32px_rgba(0,0,0,0.12)]'
              : 'max-w-5xl rounded-2xl border-[var(--bg-border)] bg-[var(--bg-surface)]/80'
            }`}
        >
          <div className="flex h-16 items-center justify-between px-6">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2.5 group">
              <SyncDocLogo className="h-9 w-9" />
              <span className={`text-[17px] font-semibold tracking-tight transition-colors ${scrolled ? 'text-neutral-900 dark:text-white' : 'text-[var(--text-primary)]'}`}>
                SyncDoc
              </span>
            </Link>

            {/* Desktop links - Removed per user request */}
            <div className="hidden md:flex flex-1" />

            {/* CTA + ThemeToggle */}
            <div className="hidden items-center gap-4 md:flex">
              <ThemeToggle />
              <div className={`h-4 w-px ${scrolled ? 'bg-neutral-300 dark:bg-neutral-700' : 'bg-[var(--bg-border)]'}`} />
              <Link
                href="/login"
                className={`text-[13px] font-semibold transition-colors ${scrolled ? 'text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
              >
                Sign in
              </Link>
              <Link
                href="/signup"
                className={`rounded-full px-5 py-2.5 text-[13px] font-bold transition-all hover:shadow-lg active:scale-95 ${scrolled
                    ? 'bg-neutral-900 text-white hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-100'
                    : 'bg-[var(--text-primary)] text-[var(--bg-canvas)] hover:opacity-90'
                  }`}
              >
                Get started free
              </Link>
            </div>

            {/* Mobile hamburger */}
            <div className="flex items-center gap-4 md:hidden">
              <ThemeToggle />
              <button
                className={scrolled ? 'text-neutral-600 dark:text-neutral-400' : 'text-[var(--text-secondary)]'}
                onClick={() => setMobileOpen(!mobileOpen)}
                aria-label="Toggle menu"
              >
                {mobileOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
          </div>
        </nav>

        {/* Mobile menu */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18 }}
              className={`border-b border-[var(--bg-border)] bg-[var(--bg-canvas)] pb-5 md:hidden ${contentClass}`}
            >
              <div className="flex flex-col gap-1 pt-3">
                {/* Mobile links removed per user request */}
                <p className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
                  Account
                </p>
              </div>
              <div className="mt-3 flex flex-col gap-2 border-t border-[var(--bg-border)] pt-4">
                <Link
                  href="/login"
                  className="rounded-xl border border-[var(--bg-border)] px-4 py-3 text-center text-sm font-medium text-[var(--text-primary)]"
                >
                  Sign in
                </Link>
                <Link
                  href="/signup"
                  className="rounded-xl bg-[var(--text-primary)] px-4 py-3 text-center text-sm font-semibold text-[var(--bg-canvas)]"
                >
                  Get started free
                </Link>
                </div>
            </motion.div>
          )}
      </AnimatePresence>
    </header>

      {/* ── Hero ─────────────────────────────────────────── */ }
  <section className="relative overflow-hidden bg-[var(--bg-canvas)] px-6 pb-0 pt-10 md:pt-14">
    {/* soft teal glow */}
    <div className="pointer-events-none absolute right-0 top-0 h-[600px] w-[600px] rounded-full bg-[#00d4bc]/[0.1] blur-[120px]" />

    <div className={contentClass}>
      <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
        {/* Left */}
        <div>
          {/* Badge */}
          <FadeIn>
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[var(--bg-border)] bg-[var(--bg-surface)] px-3 py-1 text-[11px] font-medium text-[var(--text-secondary)] shadow-sm">
              <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              Now with AI writing assistant · sub-100ms sync
            </div>
          </FadeIn>

          {/* Headline */}
          <FadeIn delay={0.06}>
            <h1 className="text-[clamp(2.4rem,5.5vw,4.5rem)] font-bold leading-[1.08] tracking-tight text-[var(--text-primary)]">
              The collaborative editor{' '}
              <span className="font-display italic text-[var(--text-secondary)]">your team actually wants</span>
            </h1>
          </FadeIn>

          {/* Body */}
          <FadeIn delay={0.12}>
            <p className="mt-6 max-w-lg text-[15px] leading-relaxed text-[var(--text-secondary)]">
              SyncDoc enables your team to write, collaborate, and ship documents with
              real-time sync, offline-first reliability, and AI that learns your voice.
            </p>
          </FadeIn>

          {/* CTAs */}
          <FadeIn delay={0.18}>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                href="/signup"
                className="inline-flex items-center gap-1.5 rounded-xl bg-[var(--text-primary)] px-6 py-3 text-[13px] font-semibold text-[var(--bg-canvas)] transition-opacity hover:opacity-90"
              >
                Start writing for free
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--bg-border)] bg-[var(--bg-surface)] px-6 py-3 text-[13px] font-medium text-[var(--text-secondary)] transition-colors hover:border-[var(--text-primary)] hover:text-[var(--text-primary)]"
              >
                Sign in
              </Link>
            </div>
          </FadeIn>

          {/* Social proof logos */}
          <FadeIn delay={0.24}>
            <div className="mt-10 border-t border-[var(--bg-border)] pt-8">
              <p className="mb-4 text-[11px] font-medium uppercase tracking-widest text-[var(--text-tertiary)]">
                Trusted by teams at
              </p>
              <LogoStrip />
            </div>
          </FadeIn>
        </div>

        {/* Right — editor demo */}
        <FadeIn delay={0.1} className="relative">
          <EditorDemo />
          {/* decorative floating badge */}
          <motion.div
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute -bottom-4 -left-4 hidden sm:flex items-center gap-2 rounded-xl border border-[var(--bg-border)] bg-[var(--bg-surface)] px-4 py-2.5 shadow-lg"
          >
            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[12px] font-semibold text-[var(--text-secondary)]">3 users editing now</span>
          </motion.div>
          <motion.div
            animate={{ y: [0, 5, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
            className="absolute -right-4 top-12 hidden sm:flex items-center gap-2 rounded-xl border border-[var(--bg-border)] bg-[var(--bg-surface)] px-4 py-2.5 shadow-lg"
          >
            <Zap size={13} className="text-[#00b49c]" />
            <span className="text-[12px] font-semibold text-[var(--text-secondary)]">Synced in 87ms</span>
          </motion.div>
        </FadeIn>
      </div>
    </div>
  </section>

  {/* ── THE PROBLEM ──────────────────────────────────── */ }
  <section id="how-it-works" className="bg-[var(--bg-canvas)] px-6 py-6 md:py-8">
    <div className={contentClass}>
      <FadeIn className="mb-14 text-center">
        <SectionLabel>The Problem</SectionLabel>
        <h2 className="mx-auto max-w-2xl text-[clamp(1.9rem,4vw,3rem)] font-bold leading-[1.15] tracking-tight text-[var(--text-primary)]">
          Legacy editors are stuck in the past
        </h2>
      </FadeIn>

      <div className="grid items-center gap-12 lg:grid-cols-2">
        <FadeIn>
          <ProblemMock />
        </FadeIn>
        <FadeIn delay={0.1}>
          <div className="space-y-6">
            {[
              {
                title: 'Version conflicts everywhere',
                desc: 'Download, edit, re-upload — the cycle that kills productivity and loses work.',
              },
              {
                title: 'No real collaboration',
                desc: "Commenting isn't collaborating. Teams need live cursors, live edits, and live presence.",
              },
              {
                title: 'Breaks when you need it most',
                desc: "Go offline on a flight and your editor becomes read-only. That's unacceptable in 2026.",
              },
            ].map((item, i) => (
              <div key={i} className="flex gap-4">
                <div className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-[var(--bg-border)] bg-[var(--bg-elevated)]">
                  <div className="h-2 w-2 rounded-full bg-[#00b49c]" />
                </div>
                <div>
                  <div className="text-[14px] font-semibold text-[var(--text-primary)]">{item.title}</div>
                  <div className="mt-1 text-[13px] leading-relaxed text-[var(--text-secondary)]">{item.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </FadeIn>
      </div>
    </div>
  </section>

  {/* ── SYNCDOC SOLVES IT ────────────────────────────── */ }
  <section className="bg-[var(--bg-elevated)]/50 px-6 py-6 md:py-8">
    <div className={contentClass}>
      <FadeIn className="mb-14 text-center">
        <SectionLabel>SyncDoc Solves It</SectionLabel>
        <h2 className="mx-auto max-w-2xl text-[clamp(1.9rem,4vw,3rem)] font-bold leading-[1.15] tracking-tight text-[var(--text-primary)]">
          One editor for every workflow,
          <br />
          online or offline
        </h2>
      </FadeIn>

      <div className="grid items-start gap-12 lg:grid-cols-2">
        <FadeIn delay={0.08}>
          <SolutionDemo />
        </FadeIn>
        <FadeIn delay={0.14}>
          <div>
            <p className="mb-6 text-[14px] leading-relaxed text-[var(--text-secondary)]">
              <span className="font-semibold text-[var(--text-primary)]">CRDT-powered collaboration</span>
              {' '}means every change, from every user, merges conflict-free — even when working offline.
            </p>
            <ul className="space-y-4">
              {[
                'Sub-100ms sync latency via Hocuspocus WebSocket',
                'Offline-first with IndexedDB — never lose a keystroke',
                'Multiplayer cursors and live presence indicators',
                'Upload .docx / .txt, export PDF or Word',
                'AI writing assistant powered by Claude',
              ].map(item => (
                <li key={item} className="flex items-start gap-3 text-[13px] text-[var(--text-secondary)]">
                  <div className="mt-0.5 h-4 w-4 shrink-0 rounded-full bg-[#00b49c]/10 flex items-center justify-center">
                    <div className="h-1.5 w-1.5 rounded-full bg-[#00b49c]" />
                  </div>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </FadeIn>
      </div>
    </div>
  </section>

  {/* ── FEATURES grid ────────────────────────────────── */ }
  <section id="features" className="bg-[var(--bg-canvas)] px-6 py-6 md:py-8">
    <div className={contentClass}>
      <FadeIn className="mb-14 text-center">
        <SectionLabel>Features</SectionLabel>
        <h2 className="mx-auto max-w-xl text-[clamp(1.9rem,4vw,3rem)] font-bold leading-[1.15] tracking-tight text-[var(--text-primary)]">
          Everything your team needs to write brilliantly
        </h2>
      </FadeIn>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[
          { icon: Zap, title: 'Sub-100ms Sync', desc: 'Every keystroke delivered instantly. Powered by Yjs CRDT and Hocuspocus WebSocket.' },
          { icon: Users, title: 'Multiplayer Cursors', desc: 'See collaborators in real time — live cursors, selections, and presence indicators.' },
          { icon: Sparkles, title: 'AI Writing Assistant', desc: 'Grammar, tone, summarize, translate — powered by Claude, right inside the editor.' },
          { icon: Globe, title: 'Offline-First', desc: 'Changes persist in IndexedDB and sync automatically the moment you reconnect.' },
          { icon: Shield, title: 'Enterprise Security', desc: 'Row-level security on every table. Granular permission controls. JWT auth.' },
          { icon: PenTool, title: 'Rich Block Editor', desc: '20+ block types: tables, code, images, callouts, task lists, and mentions.' },
          { icon: FileText, title: 'Import & Export', desc: 'Upload .docx, .txt, .md — and export to PDF or Word with a click.' },
          { icon: Layers, title: 'Version History', desc: 'Every edit is snapshotted. Browse the timeline and restore any previous state.' },
          { icon: CheckCircle2, title: 'Sharing & Permissions', desc: 'Share via secure links. Recipients get the same full editor experience.' },
        ].map(({ icon: Icon, title, desc }, i) => (
          <FadeIn key={title} delay={i * 0.04}>
            <div className="group rounded-2xl border border-[var(--bg-border)] bg-[var(--bg-surface)] p-6 shadow-sm transition-all duration-300 hover:border-[var(--text-tertiary)] hover:shadow-md">
              <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--bg-elevated)] text-[var(--text-tertiary)] transition-colors group-hover:bg-[#00b49c]/10 group-hover:text-[#00b49c]">
                <Icon size={20} />
              </div>
              <h3 className="mb-2 text-[14px] font-semibold text-[var(--text-primary)]">{title}</h3>
              <p className="text-[13px] leading-relaxed text-[var(--text-secondary)]">{desc}</p>
            </div>
          </FadeIn>
        ))}
      </div>
    </div>
  </section>

  {/* ── SECURITY ─────────────────────────────────────── */ }
  <section id="security" className="bg-[var(--bg-elevated)]/30 px-6 py-6 md:py-8">
    <div className={contentClass}>
      <div className="grid items-center gap-14 lg:grid-cols-2">
        <FadeIn>
          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: Shield, title: 'Row-Level Security', desc: 'Per-user data isolation enforced at the database layer' },
              { icon: Globe, title: 'Share Controls', desc: 'Granular public & private sharing settings' },
              { icon: Users, title: 'Team Permissions', desc: 'Owner, Editor, Commenter, Viewer roles' },
              { icon: Layers, title: 'Version History', desc: 'Full revision timeline with instant restore' },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="rounded-2xl border border-[var(--bg-border)] bg-[var(--bg-surface)] p-5 shadow-sm transition-all hover:shadow-md">
                <Icon size={16} className="mb-3 text-[#00b49c]" />
                <div className="text-[13px] font-semibold text-[var(--text-primary)]">{title}</div>
                <div className="mt-1 text-[11px] leading-relaxed text-[var(--text-secondary)]">{desc}</div>
              </div>
            ))}
          </div>
        </FadeIn>
        <FadeIn delay={0.1}>
          <div>
            <SectionLabel>Security</SectionLabel>
            <h2 className="text-[clamp(1.9rem,4vw,3rem)] font-bold leading-[1.15] tracking-tight text-[var(--text-primary)]">
              Enterprise-grade security, built in from day one
            </h2>
            <p className="mt-5 text-[14px] leading-relaxed text-[var(--text-secondary)]">
              Every document is protected by row-level security policies,
              with controllable access and Supabase-powered JWT authentication.
              Your data never leaves your control.
            </p>
          </div>
        </FadeIn>
      </div>
    </div>
  </section>

  {/* ── CTA BANNER ───────────────────────────────────── */ }
  <section className="bg-[var(--bg-canvas)] px-6 py-5 md:py-6">
    <div className="mx-auto max-w-5xl">
      <FadeIn>
        <div className="relative overflow-hidden rounded-[2.5rem] border border-[var(--bg-border)] bg-neutral-950 p-10 md:p-16 shadow-2xl">
          {/* soft glow */}
          <div className="pointer-events-none absolute -top-32 right-0 h-96 w-96 rounded-full bg-[#00d4bc]/20 blur-[80px]" />
          <div className="relative z-10 flex flex-col items-start gap-8 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="mb-2 text-[12px] font-semibold uppercase tracking-widest text-[#00d4bc]">When teams collaborate,</p>
              <h2 className="text-[clamp(1.8rem,4vw,3.2rem)] font-bold leading-tight text-white tracking-tight">
                SyncDoc keeps them in sync.
              </h2>
              <p className="mt-4 max-w-sm text-[16px] text-neutral-400">
                Join 12,000+ teams writing faster and collaborating better.
              </p>
            </div>
            <div className="flex shrink-0 flex-col gap-4 sm:flex-row">
              <Link
                href="/signup"
                className="inline-flex items-center gap-2 rounded-2xl bg-white px-8 py-4 text-[14px] font-bold text-neutral-900 transition-all hover:bg-neutral-100 hover:scale-105"
              >
                Start for free
                <ArrowRight size={16} />
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 rounded-2xl border border-neutral-700 px-8 py-4 text-[14px] font-medium text-neutral-300 transition-all hover:border-neutral-50"
              >
                Sign in
              </Link>
            </div>
          </div>
        </div>
      </FadeIn>
    </div>
  </section>

  {/* ── FOOTER ───────────────────────────────────────── */ }
  <footer className="bg-[var(--bg-canvas)] px-6 pb-16 pt-12">
    <div className="mx-auto max-w-5xl">
      <div className="relative overflow-hidden rounded-[2.5rem] border border-[var(--bg-border)] bg-[var(--bg-surface)] px-8 pb-4 pt-16 shadow-sm">
        <div className="relative z-10 flex flex-col gap-16 md:flex-row md:justify-between">
          {/* Left col */}
          <div className="max-w-md">
            <h2 className="text-[clamp(1.8rem,4vw,2.6rem)] font-semibold leading-[1.1] tracking-tight text-[var(--text-primary)]">
              When Syncing Fails,
              <br />
              <span className="text-[#00b49c]">SyncDoc Checks In!</span>
            </h2>
            <Link
              href="/docs"
              className="mt-8 inline-flex items-center gap-2 text-[15px] font-medium text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors"
            >
              Book a Demo <ArrowRight size={16} />
            </Link>
          </div>

          {/* Right cols */}
          <div className="grid grid-cols-2 gap-x-12 gap-y-10 text-[13px] sm:grid-cols-3">
            <div>
              <p className="mb-5 font-semibold text-[var(--text-primary)]">Resource</p>
              {['Documentation', 'Integrations', 'Pricing', 'API Docs'].map(l => (
                <a key={l} href="#" className="mb-3 block text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">{l}</a>
              ))}
            </div>
            <div>
              <p className="mb-5 font-semibold text-[var(--text-primary)]">Legal / Security</p>
              {['Privacy Policy', 'Terms of Service', 'Security', 'GDPR'].map(l => (
                <a key={l} href="#" className="mb-3 block text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">{l}</a>
              ))}
            </div>
            <div>
              <p className="mb-5 font-semibold text-[var(--text-primary)]">Company</p>
              {['About', 'Support', 'Blog', 'Contact'].map(l => (
                <a key={l} href="#" className="mb-3 block text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">{l}</a>
              ))}
            </div>
          </div>
        </div>

        {/* Social icons row */}
        <div className="relative z-10 mt-12 flex justify-end gap-5">
          {[
            { icon: Twitter, href: '#' },
            { icon: Linkedin, href: '#' },
            { icon: Github, href: '#' },
          ].map(({ icon: Icon, href }, i) => (
            <a
              key={i}
              href={href}
              className="text-[var(--text-primary)] transition-transform hover:scale-110"
            >
              <Icon size={22} />
            </a>
          ))}
        </div>

        {/* Massive Watermark Section - Placed in background */}
        <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden select-none">
          {/* Massive Text */}
          <div
            className="absolute -bottom-12 -right-12 text-[clamp(6rem,22vw,20rem)] font-black leading-none tracking-tighter text-neutral-100 dark:text-neutral-800/20"
          >
            SyncDoc
          </div>
        </div>
      </div>

      {/* Centered Copyright outside card */}
      <div className="mt-8 text-center text-[12px] font-medium text-[var(--text-tertiary)]">
        Copyright © 2026 SyncDoc Inc. All rights reserved
      </div>
    </div>
  </footer>
    </div>
  );
}
