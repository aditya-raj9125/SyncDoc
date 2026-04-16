'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { STRINGS } from '@/lib/constants';
import { toast } from '@/components/ui/Toast';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Github, Mail, CheckCircle2, ArrowLeft, Zap, Shield, Sparkles, FileText, Users } from 'lucide-react';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [confirmationSent, setConfirmationSent] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !password.trim() || !fullName.trim()) return;

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName },
          emailRedirectTo: `${window.location.origin}/auth/callback?next=/onboarding`,
        },
      });
      if (error) throw error;

      if (data.session) {
        // Email confirmation disabled — user is immediately logged in
        router.push('/onboarding');
        router.refresh();
      } else {
        // Email confirmation required — show check-your-email screen
        setConfirmationSent(true);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : STRINGS.errors.generic);
    } finally {
      setLoading(false);
    }
  }

  async function handleOAuthSignup(provider: 'google' | 'github') {
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) {
      toast.error(STRINGS.auth.invalidOAuth);
    }
  }

  if (confirmationSent) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--bg-canvas)]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-[400px] rounded-2xl border border-[var(--bg-border)] bg-[var(--bg-surface)] p-10 text-center shadow-lg"
        >
          <div className="mb-5 flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
              <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
          </div>
          <h2 className="text-2xl font-semibold text-[var(--text-primary)]">Check your email</h2>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">
            We sent a confirmation link to <strong>{email}</strong>. Click the link to activate your account and get started.
          </p>
          <p className="mt-4 text-xs text-[var(--text-tertiary)]">
            Didn&apos;t receive it? Check your spam folder, or{' '}
            <button
              onClick={() => setConfirmationSent(false)}
              className="text-[var(--brand-primary)] hover:underline"
            >
              try again
            </button>
            .
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen lg:h-screen lg:overflow-hidden relative bg-[#09090B]">
      {/* Back to Home Button — Clean Repositioning */}
      <Link 
        href="/" 
        className="absolute right-6 top-6 z-50 flex items-center gap-2 rounded-full bg-white/5 px-4 py-2 text-xs font-semibold text-white/60 backdrop-blur-md border border-white/10 hover:bg-white/10 hover:text-white transition-all shadow-lg lg:right-8 lg:top-8"
      >
        <ArrowLeft size={14} />
        Back to Home
      </Link>

      {/* Left panel — decorative */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-indigo-600">
        <div className="absolute inset-0">
          {/* Grid Pattern */}
          <div className="absolute inset-0 opacity-10" style={{ 
            backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
            backgroundSize: '24px 24px' 
          }} />
          
          {/* Animated Glows */}
          <motion.div
            className="absolute w-[500px] h-[500px] rounded-full bg-indigo-400/20 blur-[120px]"
            animate={{ 
              scale: [1, 1.1, 1],
              opacity: [0.3, 0.5, 0.3] 
            }}
            transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
            style={{ top: '-10%', left: '-10%' }}
          />
        </div>

        <div className="relative z-10 flex flex-col justify-center px-16">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="mb-6 flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 backdrop-blur-md ring-1 ring-white/20">
              <Sparkles className="text-white" size={20} />
            </div>
            <h1 className="font-display text-5xl text-white mb-4 leading-tight">
              Start your <br />
              <span className="text-indigo-200">journey here</span>
            </h1>
            <p className="text-base text-white/70 max-w-sm mb-10 leading-relaxed">
              Join thousands of teams shipping faster with SyncDoc's intelligent collaborative workspace.
            </p>

            {/* Feature Highlights */}
            <div className="space-y-4">
              {[
                { icon: Zap, title: "Unstoppable Sync", desc: "Sub-100ms latency for global teams." },
                { icon: Sparkles, title: "AI-Powered", desc: "Generate and refine content instantly." },
                { icon: Shield, title: "Secure Shares", desc: "Control access with granular permissions." }
              ].map((item, i) => (
                <motion.div 
                  key={item.title}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 + (i * 0.1) }}
                  className="flex items-start gap-3"
                >
                  <div className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/10 text-white">
                    <item.icon size={12} />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white uppercase tracking-wider">{item.title}</div>
                    <div className="text-[11px] text-white/50">{item.desc}</div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Workflow Visual Overlay */}
            <div className="mt-10 relative h-24 w-full max-w-sm rounded-[1.25rem] border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
               <div className="flex items-center justify-between h-full">
                  <div className="flex flex-col items-center gap-1.5">
                    <div className="h-8 w-8 rounded-lg bg-indigo-500 flex items-center justify-center border border-white/20">
                      <FileText className="text-white" size={16} />
                    </div>
                    <span className="text-[9px] text-white/40 uppercase tracking-widest font-bold">Idea</span>
                  </div>
                  <div className="flex-1 flex items-center px-4">
                     <div className="h-0.5 w-full bg-indigo-400/20 relative">
                        <motion.div 
                          className="absolute -top-1 h-1.5 w-1.5 rounded-full bg-white shadow-[0_0_8px_white]"
                          animate={{ left: ['0%', '100%'] }}
                          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                        />
                     </div>
                  </div>
                  <div className="flex flex-col items-center gap-1.5">
                    <div className="h-8 w-8 rounded-lg bg-emerald-500 flex items-center justify-center border border-white/20">
                      <Users className="text-white" size={16} />
                    </div>
                    <span className="text-[9px] text-white/40 uppercase tracking-widest font-bold">Success</span>
                  </div>
               </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Right — form */}
      <div className="flex flex-1 items-center justify-center px-6 py-6 md:py-10 mt-16 md:mt-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="w-full max-w-[390px] rounded-[2rem] border border-white/[0.08] bg-white/[0.02] p-6 shadow-[0_8px_32px_rgba(0,0,0,0.4)] backdrop-blur-xl md:p-8"
        >
          <div className="mb-6 text-center lg:text-left">
            <h2 className="text-xl font-semibold text-white">
              {STRINGS.auth.signupTitle}
            </h2>
            <p className="mt-1 text-xs text-white/80">
              {STRINGS.auth.signupSubtitle}
            </p>
          </div>

          {/* OAuth */}
          <div className="flex flex-col gap-2 mb-4">
            <Button variant="outline" size="md" className="w-full h-10 text-xs text-white hover:bg-transparent focus:bg-transparent active:bg-transparent" onClick={() => handleOAuthSignup('google')}>
              <svg className="h-4 w-4" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              {STRINGS.auth.signInWithGoogle}
            </Button>
            <Button variant="outline" size="md" className="w-full h-10 text-xs text-white hover:bg-transparent focus:bg-transparent active:bg-transparent" onClick={() => handleOAuthSignup('github')}>
              <Github className="h-4 w-4" />
              {STRINGS.auth.signInWithGitHub}
            </Button>
          </div>

          <div className="relative mb-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[var(--bg-border)]" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-[#09090B] px-3 text-white/60">
                {STRINGS.auth.orContinueWith}
              </span>
            </div>
          </div>

          <form onSubmit={handleSignup} className="space-y-4">
            <Input
              id="fullName"
              type="text"
              label="Full name"
              placeholder="John Doe"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              autoComplete="name"
              required
            />
            <Input
              id="email"
              type="email"
              label="Email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
            <Input
              id="password"
              type="password"
              label="Password"
              placeholder="Create a password (min 6 chars)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              minLength={6}
              required
            />

            <Button type="submit" size="lg" className="w-full" loading={loading}>
              {STRINGS.auth.signUpWithEmail}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-white/80">
            {STRINGS.auth.hasAccount}{' '}
            <Link href="/login" className="text-indigo-400 hover:underline font-medium">
              {STRINGS.auth.signIn}
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
