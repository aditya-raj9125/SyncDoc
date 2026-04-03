'use client';

import { useState, Suspense } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { STRINGS } from '@/lib/constants';
import { toast } from '@/components/ui/Toast';
import { motion } from 'framer-motion';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Mail, Github, Loader2 } from 'lucide-react';

type AuthMode = 'email' | 'magic-link';

function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<AuthMode>('email');
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get('next') || '/';

  const supabase = createClient();

  async function handleEmailLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    try {
      if (mode === 'magic-link') {
        const { error } = await supabase.auth.signInWithOtp({
          email,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
          },
        });
        if (error) throw error;
        setMagicLinkSent(true);
        toast.success(STRINGS.auth.magicLinkSent);
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        router.push(next);
        router.refresh();
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : STRINGS.errors.generic);
    } finally {
      setLoading(false);
    }
  }

  async function handleOAuthLogin(provider: 'google' | 'github') {
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    });
    if (error) {
      toast.error(STRINGS.auth.invalidOAuth);
    }
  }

  return (
    <div className="flex min-h-screen">
      {/* Left panel — decorative */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-[var(--brand-primary)]">
        <div className="absolute inset-0">
          {/* Geometric particle field background */}
          <svg className="absolute inset-0 w-full h-full opacity-10" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path
                  d="M 40 0 L 0 0 0 40"
                  fill="none"
                  stroke="white"
                  strokeWidth="0.5"
                />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
          {/* Floating circles */}
          <motion.div
            className="absolute w-64 h-64 rounded-full bg-white/5"
            animate={{ y: [0, -20, 0], x: [0, 10, 0] }}
            transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
            style={{ top: '20%', left: '30%' }}
          />
          <motion.div
            className="absolute w-48 h-48 rounded-full bg-white/5"
            animate={{ y: [0, 15, 0], x: [0, -15, 0] }}
            transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
            style={{ top: '60%', left: '50%' }}
          />
          <motion.div
            className="absolute w-32 h-32 rounded-full bg-white/10"
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
            style={{ top: '40%', left: '15%' }}
          />
        </div>
        <div className="relative z-10 flex flex-col justify-center px-16">
          <h1 className="font-display text-5xl text-white mb-4">{STRINGS.app.name}</h1>
          <p className="text-xl text-white/80 max-w-md">{STRINGS.app.tagline}</p>
        </div>
      </div>

      {/* Right panel — auth form */}
      <div className="flex flex-1 items-center justify-center px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="w-full max-w-[380px]"
        >
          <div className="mb-8 text-center lg:text-left">
            <h2 className="text-2xl font-semibold text-[var(--text-primary)]">
              {STRINGS.auth.loginTitle}
            </h2>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">
              {STRINGS.auth.loginSubtitle}
            </p>
          </div>

          {/* OAuth buttons */}
          <div className="flex flex-col gap-3 mb-6">
            <Button
              variant="outline"
              size="lg"
              className="w-full"
              onClick={() => handleOAuthLogin('google')}
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              {STRINGS.auth.signInWithGoogle}
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="w-full"
              onClick={() => handleOAuthLogin('github')}
            >
              <Github className="h-5 w-5" />
              {STRINGS.auth.signInWithGitHub}
            </Button>
          </div>

          {/* Divider */}
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[var(--bg-border)]" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-[var(--bg-canvas)] px-3 text-[var(--text-tertiary)]">
                {STRINGS.auth.orContinueWith}
              </span>
            </div>
          </div>

          {/* Email form */}
          {magicLinkSent ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-8"
            >
              <Mail className="h-12 w-12 mx-auto mb-4 text-[var(--brand-primary)]" />
              <p className="text-sm text-[var(--text-secondary)]">
                {STRINGS.auth.magicLinkSent}
              </p>
            </motion.div>
          ) : (
            <form onSubmit={handleEmailLogin} className="space-y-4">
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
              {mode === 'email' ? (
                <Input
                  id="password"
                  type="password"
                  label="Password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                />
              ) : null}

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm text-[var(--text-secondary)] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded accent-[var(--brand-primary)]"
                  />
                  {STRINGS.auth.rememberMe}
                </label>
                <button
                  type="button"
                  onClick={() => setMode(mode === 'email' ? 'magic-link' : 'email')}
                  className="text-sm text-[var(--brand-primary)] hover:underline"
                >
                  {mode === 'email' ? STRINGS.auth.magicLink : STRINGS.auth.signInWithEmail}
                </button>
              </div>

              <Button type="submit" size="lg" className="w-full" loading={loading}>
                {mode === 'email' ? STRINGS.auth.signIn : STRINGS.auth.magicLink}
              </Button>
            </form>
          )}

          <p className="mt-6 text-center text-sm text-[var(--text-secondary)]">
            {STRINGS.auth.noAccount}{' '}
            <Link href="/signup" className="text-[var(--brand-primary)] hover:underline font-medium">
              {STRINGS.auth.signUp}
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
