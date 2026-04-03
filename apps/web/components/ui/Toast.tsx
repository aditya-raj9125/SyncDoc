'use client';

import { Toaster as Sonner } from 'sonner';
import { useTheme } from 'next-themes';

export function Toaster() {
  const { theme } = useTheme();

  return (
    <Sonner
      theme={theme as 'light' | 'dark' | 'system'}
      position="bottom-center"
      toastOptions={{
        duration: 4000,
        style: {
          borderRadius: 'var(--radius-md)',
          boxShadow: 'var(--shadow-floating)',
          border: '1px solid var(--bg-border)',
          background: 'var(--bg-surface)',
          color: 'var(--text-primary)',
        },
      }}
    />
  );
}

export { toast } from 'sonner';
