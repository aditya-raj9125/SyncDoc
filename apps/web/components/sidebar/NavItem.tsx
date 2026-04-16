'use client';

import { memo } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  href?: string;
  count?: number;
  onClick?: () => void;
  className?: string;
}

function NavItemBase({ icon, label, active, href, count, onClick, className }: NavItemProps) {
  const content = (
    <>
      {/* Left accent bar — 3px brand color only on active */}
      <span
        className={cn(
          'absolute left-0 top-1/2 -translate-y-1/2 w-[3px] rounded-r-full transition-all duration-150',
          active ? 'h-5 bg-[var(--brand-primary)] opacity-100' : 'h-0 opacity-0'
        )}
      />
      <span
        className={cn(
          'flex-shrink-0 transition-colors duration-150',
          active ? 'text-[var(--brand-primary)]' : 'text-[var(--text-tertiary)]'
        )}
      >
        {icon}
      </span>
      <span className="flex-1 truncate whitespace-nowrap overflow-hidden text-[13px]">{label}</span>
      {typeof count === 'number' && count > 0 ? (
        <span className="rounded-full bg-[var(--bg-elevated)] px-1.5 py-0.5 text-[10px] font-medium text-[var(--text-tertiary)]">
          {count}
        </span>
      ) : null}
    </>
  );

  const classes = cn(
    'relative flex items-center gap-2 rounded-[6px] px-2 py-[9px] h-9 text-sm transition-all duration-150 cursor-pointer overflow-hidden',
    active
      ? 'bg-[var(--brand-primary)]/8 text-[var(--brand-primary)] font-medium dark:bg-[var(--brand-primary)]/12'
      : 'text-[var(--text-secondary)] hover:bg-[var(--brand-primary)]/5 hover:text-[var(--text-primary)]',
    className
  );

  if (href) {
    return (
      <Link href={href} className={classes} onClick={onClick}>
        {content}
      </Link>
    );
  }

  return (
    <div className={classes} onClick={onClick} role="button" tabIndex={0}>
      {content}
    </div>
  );
}

// Performance Audit: memo prevents re-renders when parent workspace store updates
export const NavItem = memo(NavItemBase);
NavItem.displayName = 'NavItem';
