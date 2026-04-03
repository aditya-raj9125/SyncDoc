'use client';

import * as AvatarPrimitive from '@radix-ui/react-avatar';
import { cn } from '@/lib/utils';
import { getInitials } from '@syncdoc/utils';
import { forwardRef, type ComponentPropsWithoutRef } from 'react';

interface AvatarProps extends ComponentPropsWithoutRef<typeof AvatarPrimitive.Root> {
  src?: string | null;
  name: string;
  color?: string;
  size?: 'sm' | 'md' | 'lg';
  isTyping?: boolean;
}

const Avatar = forwardRef<HTMLSpanElement, AvatarProps>(
  ({ src, name, color = '#6366f1', size = 'md', isTyping, className, ...props }, ref) => {
    const sizeClasses = {
      sm: 'h-6 w-6 text-[10px]',
      md: 'h-7 w-7 text-xs',
      lg: 'h-10 w-10 text-sm',
    };

    return (
      <AvatarPrimitive.Root
        ref={ref}
        className={cn(
          'relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-white dark:border-[var(--dark-surface)]',
          sizeClasses[size],
          isTyping && 'ring-2 ring-[var(--brand-primary)] ring-offset-1 animate-pulse-subtle',
          className,
        )}
        {...props}
      >
        {src ? (
          <AvatarPrimitive.Image
            src={src}
            alt={name}
            className="aspect-square h-full w-full object-cover"
          />
        ) : null}
        <AvatarPrimitive.Fallback
          className="flex h-full w-full items-center justify-center font-medium text-white"
          style={{ backgroundColor: color }}
          delayMs={src ? 600 : 0}
        >
          {getInitials(name)}
        </AvatarPrimitive.Fallback>
      </AvatarPrimitive.Root>
    );
  },
);

Avatar.displayName = 'Avatar';
export { Avatar };
