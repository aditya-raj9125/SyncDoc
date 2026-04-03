'use client';

import { useRef, useEffect, useState } from 'react';
import Link from 'next/link';
import { motion, useScroll, useTransform, useInView } from 'framer-motion';
import {
  ArrowRight, 
  MousePointerClick,
  Users,
  Zap,
  FileText,
  Shield,
  Globe,
  Sparkles,
  Layers,
  PenTool,
  CheckCircle2,
  ChevronRight,
  Github,
  Twitter,
  Linkedin,
  Menu,
  X,
} from 'lucide-react';

/* ─────────────────────────── Animated Particle Grid ─────────────────────── */
function ParticleGrid() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animFrame: number;
    let width = 0;
    let height = 0;

    const particles: {
      x: number; y: number; baseX: number; baseY: number;
      vx: number; vy: number; radius: number; alpha: number;
    }[] = [];

    function resize() {
      width = canvas!.parentElement!.clientWidth;
      height = canvas!.parentElement!.clientHeight;
      canvas!.width = width;
      canvas!.height = height;
      initParticles();
    }

    function initParticles() {
      particles.length = 0;
      const spacing = 40;
      for (let x = 0; x < width; x += spacing) {
        for (let y = 0; y < height; y += spacing) {
          particles.push({
            x, y, baseX: x, baseY: y,
            vx: (Math.random() - 0.5) * 0.3,
            vy: (Math.random() - 0.5) * 0.3,
            radius: Math.random() * 1.2 + 0.4,
            alpha: Math.random() * 0.3 + 0.1,
          });
        }
      }
    }

    function draw() {
      ctx!.clearRect(0, 0, width, height);
      
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;

        // Gentle pull back to base
        const dx = p.baseX - p.x;
        const dy = p.baseY - p.y;
        p.vx += dx * 0.001;
        p.vy += dy * 0.001;
        p.vx *= 0.99;
        p.vy *= 0.99;

        ctx!.beginPath();
        ctx!.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx!.fillStyle = `rgba(99, 102, 241, ${p.alpha})`;
        ctx!.fill();
      }

      // Draw connections
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 60) {
            ctx!.beginPath();
            ctx!.moveTo(particles[i].x, particles[i].y);
            ctx!.lineTo(particles[j].x, particles[j].y);
            ctx!.strokeStyle = `rgba(99, 102, 241, ${0.06 * (1 - dist / 60)})`;
            ctx!.lineWidth = 0.5;
            ctx!.stroke();
          }
        }
      }

      animFrame = requestAnimationFrame(draw);
    }

    resize();
    draw();
    window.addEventListener('resize', resize);

    return () => {
      cancelAnimationFrame(animFrame);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none" />;
}

/* ─────────────────────────── Fade-in Section ─────────────────────────────── */
function FadeInSection({ children, className = '', delay = 0 }: {
  children: React.ReactNode; className?: string; delay?: number;
}) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ─────────────────────────── Feature Card ─────────────────────────────────── */
function FeatureCard({ icon: Icon, title, description, delay = 0 }: {
  icon: React.ElementType; title: string; description: string; delay?: number;
}) {
  return (
    <FadeInSection delay={delay}>
      <div className="group relative rounded-xl border border-white/[0.06] bg-white/[0.02] p-6 backdrop-blur-sm transition-all duration-500 hover:border-indigo-500/30 hover:bg-white/[0.04] hover:shadow-[0_0_40px_rgba(99,102,241,0.06)]">
        <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-400 transition-colors group-hover:bg-indigo-500/20">
          <Icon size={20} />
        </div>
        <h3 className="mb-2 text-base font-semibold text-white">{title}</h3>
        <p className="text-sm leading-relaxed text-neutral-400">{description}</p>
      </div>
    </FadeInSection>
  );
}

/* ─────────────────────────── Stat ──────────────────────────────────────────── */
function StatBlock({ value, label }: { value: string; label: string }) {
  return (
    <div className="text-center">
      <div className="text-3xl font-bold text-white md:text-4xl">{value}</div>
      <div className="mt-1 text-sm text-neutral-400">{label}</div>
    </div>
  );
}

/* ─────────────────────────── MAIN PAGE ─────────────────────────────────────── */
export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const heroRef = useRef(null);
  const { scrollY } = useScroll();
  const heroOpacity = useTransform(scrollY, [0, 500], [1, 0]);
  const heroScale = useTransform(scrollY, [0, 500], [1, 0.95]);

  return (
    <div className="min-h-screen bg-[#09090B] text-white antialiased selection:bg-indigo-500/30">
      {/* ─── Navbar ──────────────────────────────────────────────────────── */}
      <nav className="fixed top-0 z-50 w-full border-b border-white/[0.06] bg-[#09090B]/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500">
              <FileText size={16} className="text-white" />
            </div>
            <span className="text-lg font-semibold tracking-tight">SyncDoc</span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden items-center gap-8 md:flex">
            <a href="#features" className="text-sm text-neutral-400 transition-colors hover:text-white">Features</a>
            <a href="#collaboration" className="text-sm text-neutral-400 transition-colors hover:text-white">Collaboration</a>
            <a href="#security" className="text-sm text-neutral-400 transition-colors hover:text-white">Security</a>
          </div>

          {/* Auth buttons */}
          <div className="hidden items-center gap-3 md:flex">
            <Link
              href="/login"
              className="rounded-lg px-4 py-2 text-sm font-medium text-neutral-300 transition-colors hover:text-white"
            >
              Log in
            </Link>
            <Link
              href="/signup"
              className="rounded-lg bg-indigo-500 px-5 py-2 text-sm font-medium text-white transition-all hover:bg-indigo-400 hover:shadow-[0_0_20px_rgba(99,102,241,0.4)]"
            >
              Get started free
            </Link>
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden text-neutral-400"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="border-t border-white/[0.06] bg-[#09090B] px-6 py-4 md:hidden"
          >
            <div className="flex flex-col gap-3">
              <a href="#features" className="py-2 text-sm text-neutral-300" onClick={() => setMobileMenuOpen(false)}>Features</a>
              <a href="#collaboration" className="py-2 text-sm text-neutral-300" onClick={() => setMobileMenuOpen(false)}>Collaboration</a>
              <a href="#security" className="py-2 text-sm text-neutral-300" onClick={() => setMobileMenuOpen(false)}>Security</a>
              <div className="mt-2 flex flex-col gap-2 border-t border-white/[0.06] pt-4">
                <Link href="/login" className="rounded-lg border border-white/10 px-4 py-2.5 text-center text-sm font-medium text-white">Log in</Link>
                <Link href="/signup" className="rounded-lg bg-indigo-500 px-4 py-2.5 text-center text-sm font-medium text-white">Get started free</Link>
              </div>
            </div>
          </motion.div>
        )}
      </nav>

      {/* ─── Hero ────────────────────────────────────────────────────────── */}
      <section ref={heroRef} className="relative flex min-h-[100vh] items-center justify-center overflow-hidden pt-16">
        <ParticleGrid />

        {/* Radial gradient overlay */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_20%,#09090B_80%)]" />

        {/* Accent glow */}
        <div className="pointer-events-none absolute left-1/2 top-1/3 -translate-x-1/2 -translate-y-1/2">
          <div className="h-[500px] w-[800px] rounded-full bg-indigo-500/[0.07] blur-[120px]" />
        </div>

        <motion.div style={{ opacity: heroOpacity, scale: heroScale }} className="relative z-10 mx-auto max-w-5xl px-6 text-center">
          {/* Badge */}
          <FadeInSection>
            <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.03] px-4 py-1.5 text-xs text-neutral-300 backdrop-blur-sm">
              <Sparkles size={13} className="text-indigo-400" />
              Real-time collaboration, reimagined
            </div>
          </FadeInSection>

          {/* Title */}
          <FadeInSection delay={0.1}>
            <h1 className="mx-auto max-w-4xl font-display text-[clamp(2.5rem,7vw,5.5rem)] leading-[0.95] tracking-tight">
              <span className="text-white">Write together.</span>
              <br />
              <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-indigo-400 bg-clip-text text-transparent">
                Ship faster.
              </span>
            </h1>
          </FadeInSection>

          {/* Subtitle */}
          <FadeInSection delay={0.2}>
            <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-neutral-400 md:text-xl">
              The next-generation document editor with sub-100ms sync,
              AI-native editing, and true offline-first collaboration.
            </p>
          </FadeInSection>

          {/* CTA */}
          <FadeInSection delay={0.3}>
            <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Link
                href="/signup"
                className="group flex items-center gap-2 rounded-xl bg-indigo-500 px-7 py-3.5 text-sm font-semibold text-white shadow-[0_0_30px_rgba(99,102,241,0.3)] transition-all hover:bg-indigo-400 hover:shadow-[0_0_50px_rgba(99,102,241,0.4)]"
              >
                Start writing — it&apos;s free
                <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
              </Link>
              <Link
                href="/login"
                className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-7 py-3.5 text-sm font-medium text-neutral-300 backdrop-blur-sm transition-all hover:border-white/20 hover:text-white"
              >
                Log in
              </Link>
            </div>
          </FadeInSection>

          {/* Scroll indicator */}
          <motion.div
            className="mt-20 flex flex-col items-center gap-2 text-neutral-500"
            animate={{ y: [0, 6, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          >
            <MousePointerClick size={16} />
            <span className="text-[10px] uppercase tracking-[0.2em]">Scroll to explore</span>
          </motion.div>
        </motion.div>
      </section>

      {/* ─── Logo bar ────────────────────────────────────────────────────── */}
      <section className="border-y border-white/[0.04] bg-white/[0.01] py-10">
        <div className="mx-auto max-w-5xl px-6">
          <p className="mb-6 text-center text-xs uppercase tracking-[0.2em] text-neutral-500">Built with technology trusted by</p>
          <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-4 opacity-40">
            {['Next.js', 'Supabase', 'Tiptap', 'Yjs', 'Hocuspocus', 'Tailwind'].map((name) => (
              <span key={name} className="text-sm font-semibold tracking-wide text-neutral-300">{name}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Features ─────────────────────────────────────────────────────── */}
      <section id="features" className="py-24 md:py-32">
        <div className="mx-auto max-w-7xl px-6">
          <FadeInSection>
            <div className="mx-auto max-w-2xl text-center">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1 text-xs text-neutral-400">
                <Layers size={12} className="text-indigo-400" /> Features
              </div>
              <h2 className="font-display text-4xl text-white md:text-5xl">
                Everything you need to write brilliantly
              </h2>
              <p className="mt-4 text-neutral-400">
                A complete word processor built for modern teams — powerful enough
                for enterprise, elegant enough for individuals.
              </p>
            </div>
          </FadeInSection>

          <div className="mt-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <FeatureCard
              icon={Zap}
              title="Sub-100ms Sync"
              description="CRDT-powered real-time editing with conflict-free merging. Every keystroke arrives instantly."
              delay={0}
            />
            <FeatureCard
              icon={Users}
              title="Multiplayer Cursors"
              description="See collaborators' cursors, selections, and edits in real time with beautiful presence indicators."
              delay={0.05}
            />
            <FeatureCard
              icon={Sparkles}
              title="AI-Native Writing"
              description="Grammar correction, tone adjustment, summarization, and translation — all powered by advanced AI."
              delay={0.1}
            />
            <FeatureCard
              icon={PenTool}
              title="Rich Formatting"
              description="Full word processor: fonts, sizes, colors, tables, images, headers/footers, and page breaks."
              delay={0.15}
            />
            <FeatureCard
              icon={Globe}
              title="Offline-First"
              description="Keep writing without internet. Changes sync automatically when you reconnect — no data loss."
              delay={0.2}
            />
            <FeatureCard
              icon={Shield}
              title="Enterprise Security"
              description="Row-level security, end-to-end encryption on shares, and granular permission controls."
              delay={0.25}
            />
          </div>
        </div>
      </section>

      {/* ─── Collaboration Showcase ───────────────────────────────────────── */}
      <section id="collaboration" className="relative overflow-hidden py-24 md:py-32">
        {/* Background accent */}
        <div className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2">
          <div className="h-[600px] w-[600px] rounded-full bg-indigo-500/[0.04] blur-[150px]" />
        </div>

        <div className="mx-auto max-w-7xl px-6">
          <div className="grid items-center gap-16 lg:grid-cols-2">
            {/* Left: text */}
            <FadeInSection>
              <div>
                <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1 text-xs text-neutral-400">
                  <Users size={12} className="text-indigo-400" /> Collaboration
                </div>
                <h2 className="font-display text-4xl text-white md:text-5xl">
                  The best ideas come from working together
                </h2>
                <p className="mt-6 text-lg leading-relaxed text-neutral-400">
                  Share documents with a click. Control who can view, comment, or edit.
                  Watch changes appear in real time with zero latency.
                </p>

                <ul className="mt-8 space-y-4">
                  {[
                    'Real-time multiplayer editing with live cursors',
                    'Granular sharing — owner, editor, commenter, viewer',
                    'Public link sharing with customizable access levels',
                    'Track changes with accept/reject workflow',
                    'Threaded comments with @mentions',
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-3 text-sm text-neutral-300">
                      <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-indigo-400" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </FadeInSection>

            {/* Right: visual */}
            <FadeInSection delay={0.15}>
              <div className="relative">
                {/* Mock editor window */}
                <div className="overflow-hidden rounded-xl border border-white/[0.08] bg-[#111113] shadow-2xl">
                  {/* Title bar */}
                  <div className="flex items-center gap-2 border-b border-white/[0.06] px-4 py-3">
                    <div className="flex gap-1.5">
                      <div className="h-3 w-3 rounded-full bg-red-500/60" />
                      <div className="h-3 w-3 rounded-full bg-yellow-500/60" />
                      <div className="h-3 w-3 rounded-full bg-green-500/60" />
                    </div>
                    <span className="ml-3 text-xs text-neutral-500">Q4 Strategy — SyncDoc</span>
                  </div>

                  {/* Toolbar mock */}
                  <div className="flex items-center gap-1 border-b border-white/[0.06] px-4 py-2">
                    {['B', 'I', 'U', 'S'].map((k) => (
                      <div key={k} className="flex h-6 w-6 items-center justify-center rounded text-[11px] font-bold text-neutral-500 hover:bg-white/5">
                        {k}
                      </div>
                    ))}
                    <div className="mx-1 h-4 w-px bg-white/[0.06]" />
                    <div className="rounded px-2 py-1 text-[10px] text-neutral-500">Heading 1</div>
                    <div className="rounded px-2 py-1 text-[10px] text-neutral-500">Geist</div>
                  </div>

                  {/* Content */}
                  <div className="px-6 py-5">
                    <h3 className="font-display text-xl text-white/90">Q4 Product Strategy</h3>
                    <p className="mt-3 text-sm leading-relaxed text-neutral-400">
                      Our focus this quarter is to expand real-time collaboration
                      capabilities across all document types. Key initiatives include...
                    </p>
                    <p className="mt-3 text-sm leading-relaxed text-neutral-400">
                      <span className="border-b-2 border-indigo-500 text-white">AI-powered suggestions</span>{' '}
                      will help teams write 3× faster with automatic grammar
                      correction and smart content completion.
                    </p>

                    {/* Cursor indicators */}
                    <div className="relative mt-6">
                      <div className="absolute -left-1 top-0 w-0.5 h-5 bg-emerald-400 rounded-full" />
                      <div className="absolute -left-1 -top-4 rounded bg-emerald-400 px-1.5 py-0.5 text-[9px] font-medium text-white whitespace-nowrap">
                        Sarah K.
                      </div>
                    </div>
                    <p className="mt-4 text-sm leading-relaxed text-neutral-400">
                      We&apos;ll prioritize mobile-first design patterns and deploy the
                      DOCX export pipeline by end of <span className="border-b-2 border-amber-400">October</span>.
                    </p>
                    <div className="relative mt-1">
                      <div className="absolute right-20 top-0 w-0.5 h-5 bg-amber-400 rounded-full" />
                      <div className="absolute right-16 -top-4 rounded bg-amber-400 px-1.5 py-0.5 text-[9px] font-medium text-neutral-900 whitespace-nowrap">
                        James R.
                      </div>
                    </div>
                  </div>

                  {/* Presence bar */}
                  <div className="flex items-center justify-between border-t border-white/[0.06] px-4 py-2">
                    <span className="text-[10px] text-neutral-500">3 collaborators editing</span>
                    <div className="flex -space-x-2">
                      {['bg-indigo-500', 'bg-emerald-500', 'bg-amber-500'].map((c, i) => (
                        <div key={i} className={`h-6 w-6 rounded-full ${c} ring-2 ring-[#111113] flex items-center justify-center text-[9px] font-bold text-white`}>
                          {['A', 'S', 'J'][i]}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </FadeInSection>
          </div>
        </div>
      </section>

      {/* ─── Stats ────────────────────────────────────────────────────────── */}
      <section className="border-y border-white/[0.04] bg-white/[0.01] py-16">
        <div className="mx-auto max-w-4xl px-6">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            <FadeInSection delay={0}><StatBlock value="<100ms" label="Sync latency" /></FadeInSection>
            <FadeInSection delay={0.05}><StatBlock value="∞" label="Offline capability" /></FadeInSection>
            <FadeInSection delay={0.1}><StatBlock value="256-bit" label="Encryption" /></FadeInSection>
            <FadeInSection delay={0.15}><StatBlock value="99.9%" label="Uptime SLA" /></FadeInSection>
          </div>
        </div>
      </section>

      {/* ─── Security Section ─────────────────────────────────────────────── */}
      <section id="security" className="py-24 md:py-32">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid items-center gap-16 lg:grid-cols-2">
            {/* Left: visual */}
            <FadeInSection>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { icon: Shield, label: 'Row-Level Security', desc: 'Per-user data isolation at the database layer' },
                  { icon: Globe, label: 'Share Controls', desc: 'Granular public & private sharing settings' },
                  { icon: Users, label: 'Team Permissions', desc: 'Owner, Editor, Commenter, Viewer roles' },
                  { icon: Layers, label: 'Version History', desc: 'Full revision timeline with instant restore' },
                ].map(({ icon: Icon, label, desc }, i) => (
                  <div key={label} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5 transition-colors hover:border-indigo-500/20">
                    <Icon size={18} className="mb-3 text-indigo-400" />
                    <div className="text-sm font-medium text-white">{label}</div>
                    <div className="mt-1 text-xs text-neutral-500">{desc}</div>
                  </div>
                ))}
              </div>
            </FadeInSection>

            {/* Right: text */}
            <FadeInSection delay={0.1}>
              <div>
                <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1 text-xs text-neutral-400">
                  <Shield size={12} className="text-indigo-400" /> Security
                </div>
                <h2 className="font-display text-4xl text-white md:text-5xl">
                  Enterprise-grade security, built in
                </h2>
                <p className="mt-6 text-lg leading-relaxed text-neutral-400">
                  Every document is protected by row-level security policies,
                  with controllable access and Supabase-powered authentication.
                  Your data never leaves your control.
                </p>
              </div>
            </FadeInSection>
          </div>
        </div>
      </section>

      {/* ─── CTA ──────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden py-24 md:py-32">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(99,102,241,0.08),transparent_60%)]" />

        <div className="relative z-10 mx-auto max-w-3xl px-6 text-center">
          <FadeInSection>
            <h2 className="font-display text-4xl text-white md:text-6xl">
              Ready to write the future?
            </h2>
            <p className="mt-6 text-lg text-neutral-400">
              Join teams already using SyncDoc to collaborate without limits.
              Free to start — no credit card required.
            </p>
            <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Link
                href="/signup"
                className="group flex items-center gap-2 rounded-xl bg-indigo-500 px-8 py-4 text-base font-semibold text-white shadow-[0_0_40px_rgba(99,102,241,0.35)] transition-all hover:bg-indigo-400 hover:shadow-[0_0_60px_rgba(99,102,241,0.4)]"
              >
                Get started free
                <ArrowRight size={18} className="transition-transform group-hover:translate-x-0.5" />
              </Link>
              <Link
                href="/login"
                className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-8 py-4 text-base font-medium text-neutral-300 backdrop-blur-sm transition-all hover:border-white/20 hover:text-white"
              >
                Log in to your account
              </Link>
            </div>
          </FadeInSection>
        </div>
      </section>

      {/* ─── Footer ─────────────────────────────────────────────────────── */}
      <footer className="border-t border-white/[0.06] bg-[#09090B] py-16">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid gap-12 md:grid-cols-4">
            {/* Brand */}
            <div className="md:col-span-1">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500">
                  <FileText size={16} className="text-white" />
                </div>
                <span className="text-lg font-semibold">SyncDoc</span>
              </div>
              <p className="mt-4 text-sm leading-relaxed text-neutral-500">
                The next generation of collaborative writing.
                Real-time, offline-first, AI-native.
              </p>
              <div className="mt-6 flex gap-3">
                {[Twitter, Github, Linkedin].map((Icon, i) => (
                  <a key={i} href="#" className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.06] text-neutral-500 transition-colors hover:border-white/10 hover:text-neutral-300">
                    <Icon size={14} />
                  </a>
                ))}
              </div>
            </div>

            {/* Links */}
            {[
              { title: 'Product', links: ['Features', 'Security', 'Pricing', 'Templates'] },
              { title: 'Company', links: ['About', 'Blog', 'Careers', 'Contact'] },
              { title: 'Resources', links: ['Documentation', 'API Reference', 'Community', 'Status'] },
            ].map((col) => (
              <div key={col.title}>
                <div className="mb-4 text-xs font-semibold uppercase tracking-[0.15em] text-neutral-400">
                  {col.title}
                </div>
                <ul className="space-y-3">
                  {col.links.map((link) => (
                    <li key={link}>
                      <a href="#" className="text-sm text-neutral-500 transition-colors hover:text-neutral-300">
                        {link}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="mt-16 flex flex-col items-center justify-between gap-4 border-t border-white/[0.06] pt-8 md:flex-row">
            <p className="text-xs text-neutral-600">© 2026 SyncDoc. All rights reserved.</p>
            <div className="flex gap-6">
              <a href="#" className="text-xs text-neutral-600 hover:text-neutral-400">Privacy Policy</a>
              <a href="#" className="text-xs text-neutral-600 hover:text-neutral-400">Terms of Service</a>
              <a href="#" className="text-xs text-neutral-600 hover:text-neutral-400">Cookie Settings</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
