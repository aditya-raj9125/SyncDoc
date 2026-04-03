'use client';

import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  loading?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading, disabled, children, ...props }, ref) => {
    const baseStyles =
      'inline-flex items-center justify-center font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-primary)] disabled:pointer-events-none disabled:opacity-50';

    const variants = {
      primary:
        'bg-[var(--brand-primary)] text-white hover:bg-[var(--brand-primary-hover)] active:bg-[var(--brand-primary-hover)]',
      secondary:
        'bg-[var(--bg-elevated)] text-[var(--text-primary)] hover:bg-[var(--bg-border)] border border-[var(--bg-border)]',
      ghost: 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]',
      danger: 'bg-[var(--danger)] text-white hover:bg-red-600',
      outline:
        'border border-[var(--bg-border)] text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]',
    };

    const sizes = {
      sm: 'h-8 px-3 text-sm rounded-[var(--radius-md)] gap-1.5',
      md: 'h-10 px-4 text-sm rounded-[var(--radius-md)] gap-2',
      lg: 'h-12 px-6 text-base rounded-[var(--radius-lg)] gap-2',
      icon: 'h-9 w-9 rounded-[var(--radius-md)]',
    };

    return (
      <motion.button
        ref={ref}
        whileTap={{ scale: 0.97 }}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        disabled={disabled || loading}
        {...(props as Record<string, unknown>)}
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        {children}
      </motion.button>
    );
  },
);

Button.displayName = 'Button';
export { Button };
