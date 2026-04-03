'use client';

import * as TooltipPrimitive from '@radix-ui/react-tooltip';
import { cn } from '@/lib/utils';

interface TooltipProps {
  content: string;
  shortcut?: string;
  children: React.ReactNode;
  side?: 'top' | 'right' | 'bottom' | 'left';
  delayDuration?: number;
}

export function Tooltip({
  content,
  shortcut,
  children,
  side = 'top',
  delayDuration = 500,
}: TooltipProps) {
  return (
    <TooltipPrimitive.Provider>
      <TooltipPrimitive.Root delayDuration={delayDuration}>
        <TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>
        <TooltipPrimitive.Portal>
          <TooltipPrimitive.Content
            side={side}
            sideOffset={6}
            className={cn(
              'z-50 rounded-[var(--radius-md)] bg-[var(--text-primary)] px-2.5 py-1.5 text-xs text-white',
              'animate-scale-in shadow-md',
              'flex items-center gap-2',
            )}
          >
            <span>{content}</span>
            {shortcut ? (
              <kbd className="rounded bg-white/20 px-1 py-0.5 text-[10px] font-mono">
                {shortcut}
              </kbd>
            ) : null}
            <TooltipPrimitive.Arrow className="fill-[var(--text-primary)]" />
          </TooltipPrimitive.Content>
        </TooltipPrimitive.Portal>
      </TooltipPrimitive.Root>
    </TooltipPrimitive.Provider>
  );
}
