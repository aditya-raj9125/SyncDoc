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
  Star,
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
      <div className="group relative overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.02] p-8 shadow-[0_8px_32px_rgba(0,0,0,0.2)] backdrop-blur-md transition-all duration-500 hover:border-indigo-500/40 hover:bg-white/[0.04] hover:shadow-[0_20px_40px_rgba(0,0,0,0.4)]">
        {/* Glow effect on hover */}
        <div className="absolute -inset-px opacity-0 bg-gradient-to-br from-indigo-500/20 via-transparent to-purple-500/20 blur-xl transition-opacity duration-500 group-hover:opacity-100" />
        
        <div className="relative z-10">
          <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400 transition-colors group-hover:bg-indigo-500/20 group-hover:text-indigo-300">
            <Icon size={24} />
          </div>
          <h3 className="mb-3 text-lg font-semibold text-white group-hover:text-indigo-100 transition-colors">{title}</h3>
          <p className="text-sm leading-relaxed text-neutral-500 group-hover:text-neutral-400 transition-colors">{description}</p>
        </div>
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
      <nav className="fixed top-4 left-1/2 z-50 w-[95%] max-w-7xl -translate-x-1/2 overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.02] shadow-[0_8px_32px_rgba(0,0,0,0.3)] backdrop-blur-md">
        <div className="mx-auto flex h-14 items-center justify-between px-6">
          {/* Logo (Left) */}
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500">
              <FileText size={16} className="text-white" />
            </div>
            <span className="text-lg font-semibold tracking-tight">SyncDoc</span>
          </Link>

          {/* Right Aligned Navigation & Auth */}
          <div className="hidden items-center gap-8 md:flex">
            <div className="flex items-center gap-6">
              <a href="#features" className="text-sm text-neutral-400 transition-colors hover:text-white">Features</a>
              <a href="#pricing" className="text-sm text-neutral-400 transition-colors hover:text-white">Pricing</a>
              <a href="#blog" className="text-sm text-neutral-400 transition-colors hover:text-white">Blog</a>
              <a href="#docs" className="text-sm text-neutral-400 transition-colors hover:text-white">Docs</a>
            </div>
            
            <div className="h-4 w-px bg-white/10" />

            <div className="flex items-center gap-3">
              <Link
                href="/login"
                className="rounded-lg px-4 py-2 text-sm font-medium text-neutral-300 transition-colors hover:text-white"
              >
                Sign in
              </Link>
              <Link
                href="/signup"
                className="rounded-lg bg-indigo-500 px-5 py-2 text-sm font-medium text-white transition-all hover:bg-indigo-400 hover:shadow-[0_0_20px_rgba(99,102,241,0.4)]"
              >
                Get started free
              </Link>
            </div>
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
              <a href="#pricing" className="py-2 text-sm text-neutral-300" onClick={() => setMobileMenuOpen(false)}>Pricing</a>
              <a href="#blog" className="py-2 text-sm text-neutral-300" onClick={() => setMobileMenuOpen(false)}>Blog</a>
              <a href="#docs" className="py-2 text-sm text-neutral-300" onClick={() => setMobileMenuOpen(false)}>Docs</a>
              <div className="mt-2 flex flex-col gap-2 border-t border-white/[0.06] pt-4">
                <Link href="/login" className="rounded-lg border border-white/10 px-4 py-2.5 text-center text-sm font-medium text-white">Sign in</Link>
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
            <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.03] px-4 py-1.5 text-xs text-neutral-400 backdrop-blur-sm">
              <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              Now with AI writing assistant — powered by SyncDoc-AI
            </div>
          </FadeInSection>

          {/* Title - Mix of Sans and Italic Serif */}
          <FadeInSection delay={0.1}>
            <h1 className="mx-auto max-w-4xl font-sans text-[clamp(2.5rem,7vw,5.5rem)] leading-[1.0] tracking-tight font-medium">
              <span className="text-white">The document editor</span>
              <br />
              <span className="font-display italic text-neutral-300">
                your team actually wants
              </span>
            </h1>
          </FadeInSection>

          {/* Subtitle */}
          <FadeInSection delay={0.2}>
            <p className="mx-auto mt-8 max-w-2xl text-lg leading-relaxed text-neutral-500 md:text-xl">
              Real-time collaboration, offline-first reliability, and AI that 
              learns your team&apos;s voice. Everything Google Docs promised, 
              finally delivered.
            </p>
          </FadeInSection>

          {/* CTA */}
          <FadeInSection delay={0.3}>
            <div className="mt-12 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Link
                href="/signup"
                className="group flex items-center gap-2 rounded-xl bg-indigo-500 px-8 py-4 text-sm font-semibold text-white shadow-[0_0_30px_rgba(99,102,241,0.3)] transition-all hover:bg-indigo-400 hover:shadow-[0_0_50px_rgba(99,102,241,0.4)]"
              >
                Start writing for free →
              </Link>
              <Link
                href="/demo"
                className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-8 py-4 text-sm font-medium text-neutral-300 backdrop-blur-sm transition-all hover:border-white/20 hover:text-white"
              >
                Watch 2 min demo
              </Link>
            </div>
          </FadeInSection>

          {/* Social Proof */}
          <FadeInSection delay={0.4}>
             <div className="mt-20 flex flex-col items-center gap-5">
                <div className="flex -space-x-3 items-center">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="h-10 w-10 rounded-full border-2 border-[#09090B] shadow-xl flex items-center justify-center overflow-hidden">
                      <div className={`h-full w-full bg-gradient-to-br ${['from-indigo-500 to-purple-500', 'from-emerald-500 to-teal-500', 'from-orange-500 to-red-500', 'from-blue-500 to-cyan-500', 'from-pink-500 to-rose-500'][i-1]} opacity-80`} />
                    </div>
                  ))}
                  <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-[#09090B] bg-neutral-900 shadow-xl">
                    <span className="text-[10px] font-bold text-neutral-400">+12k</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 rounded-full border border-white/[0.06] bg-white/[0.02] px-3 py-1 backdrop-blur-md">
                   <div className="h-1.5 w-1.5 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.5)]" />
                   <p className="text-[10px] font-bold tracking-widest text-neutral-500 uppercase">
                     Trusted by <span className="text-neutral-300">12,000+ teams</span> worldwide
                   </p>
                </div>
             </div>
          </FadeInSection>
        </motion.div>
      </section>

      {/* ─── Features ─────────────────────────────────────────────────────── */}
      <section id="features" className="py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-6">
          <FadeInSection>
            <div className="mx-auto max-w-2xl text-center">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1 text-xs text-neutral-400">
                <Layers size={12} className="text-indigo-400" /> Features
              </div>
              <h2 className="font-display text-4xl text-white md:text-5xl italic">
                Everything you need to write brilliantly
              </h2>
              <p className="mt-4 text-neutral-500">
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
      <section id="collaboration" className="relative overflow-hidden py-16 md:py-20">
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
                <h2 className="font-display text-4xl text-white md:text-5xl italic leading-tight">
                  The best ideas come from <br /> working together
                </h2>
                <p className="mt-6 text-lg leading-relaxed text-neutral-500">
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
                    <li key={item} className="flex items-start gap-3 text-sm text-neutral-400">
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
                <div className="overflow-hidden rounded-2xl border border-white/[0.1] bg-[#111113]/40 shadow-[0_20px_50px_rgba(0,0,0,0.5)] backdrop-blur-md transition-all duration-500 hover:border-white/20">
                  {/* Title bar */}
                  <div className="flex items-center gap-2 border-b border-white/[0.06] px-4 py-3">
                    <div className="flex gap-1.5">
                      <div className="h-3 w-3 rounded-full bg-red-500/60" />
                      <div className="h-3 w-3 rounded-full bg-yellow-500/60" />
                      <div className="h-3 w-3 rounded-full bg-green-500/60" />
                    </div>
                    <span className="ml-3 text-xs text-neutral-500 italic">Q4 Strategy — SyncDoc</span>
                  </div>

                  {/* Toolbar mock */}
                  <div className="flex items-center gap-1 border-b border-white/[0.06] px-4 py-2">
                    {['B', 'I', 'U', 'S'].map((k) => (
                      <div key={k} className="flex h-6 w-6 items-center justify-center rounded text-[11px] font-bold text-neutral-600 hover:bg-white/5">
                        {k}
                      </div>
                    ))}
                    <div className="mx-1 h-4 w-px bg-white/[0.06]" />
                    <div className="rounded px-2 py-1 text-[10px] text-neutral-600">Heading 1</div>
                    <div className="rounded px-2 py-1 text-[10px] text-neutral-600">Geist</div>
                  </div>

                  {/* Content */}
                  <div className="px-6 py-5">
                    <h3 className="font-display text-xl text-white/90 italic">Q4 Product Strategy</h3>
                    <p className="mt-3 text-sm leading-relaxed text-neutral-500">
                      Our focus this quarter is to expand real-time collaboration
                      capabilities across all document types. Key initiatives include...
                    </p>
                    <p className="mt-3 text-sm leading-relaxed text-neutral-500">
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
                    <p className="mt-4 text-sm leading-relaxed text-neutral-500">
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
                    <span className="text-[10px] text-neutral-600">3 collaborators editing</span>
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

      {/* ─── Security Section ─────────────────────────────────────────────── */}
      <section id="security" className="py-16 md:py-20">
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
                  <div key={label} className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-6 shadow-lg backdrop-blur-md transition-all duration-500 hover:border-indigo-500/30 hover:bg-white/[0.04] hover:shadow-[0_10px_30px_rgba(0,0,0,0.2)]">
                    <Icon size={18} className="mb-3 text-indigo-400" />
                    <div className="text-sm font-medium text-white">{label}</div>
                    <div className="mt-1 text-xs text-neutral-600">{desc}</div>
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
                <h2 className="font-display text-4xl text-white md:text-5xl italic">
                  Enterprise-grade security, built in
                </h2>
                <p className="mt-6 text-lg leading-relaxed text-neutral-500">
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
      <section className="relative overflow-hidden py-24">
        <div className="mx-auto max-w-5xl px-6">
          <div className="relative overflow-hidden rounded-[2.5rem] border border-white/[0.08] bg-white/[0.02] p-12 text-center md:p-20">
            {/* Background Effects */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.15),transparent_40%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(52,211,153,0.05),transparent_40%)]" />
            <div className="absolute inset-0 backdrop-blur-3xl" />
            
            <div className="relative z-10 flex flex-col items-center">
              <FadeInSection>
                <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-indigo-500/20 bg-indigo-500/5 px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest text-indigo-400">
                  <Star size={12} className="fill-current" /> Lifetime access available
                </div>
                <h2 className="font-display text-4xl text-white md:text-6xl italic leading-tight">
                  Stop settling for <br />
                  <span className="text-neutral-500">legacy editors.</span>
                </h2>
                <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-neutral-400">
                  Join the next generation of teams writing faster and collaborating better. 
                  Experience the sub-100ms future of document editing today.
                </p>
                <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
                  <Link
                    href="/signup"
                    className="group relative flex items-center gap-2 rounded-2xl bg-white px-8 py-4 text-sm font-bold text-black transition-all hover:scale-[1.02] hover:shadow-[0_0_20px_rgba(255,255,255,0.4)]"
                  >
                    Start writing now
                    <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
                  </Link>
                  <Link
                    href="/demo"
                    className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-8 py-4 text-sm font-bold text-white transition-all hover:bg-white/10"
                  >
                    Watch live demo
                  </Link>
                </div>
              </FadeInSection>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Footer ─────────────────────────────────────────────────────── */}
      <footer className="border-t border-white/[0.06] bg-[#09090B] py-12">
        <div className="mx-auto max-w-7xl px-6 text-center">
          <p className="text-sm font-medium tracking-widest text-neutral-600 uppercase">
            © 2026 SyncDoc
          </p>
        </div>
      </footer>
    </div>
  );
}

