'use client';

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

export function NavItem({ icon, label, active, href, count, onClick, className }: NavItemProps) {
  const content = (
    <>
      <span className={cn(active ? 'text-[var(--brand-primary)]' : 'text-[var(--text-tertiary)]')}>
        {icon}
      </span>
      <span className="flex-1 truncate">{label}</span>
      {typeof count === 'number' && count > 0 ? (
        <span className="rounded-full bg-[var(--bg-elevated)] px-1.5 py-0.5 text-[10px] font-medium text-[var(--text-tertiary)]">
          {count}
        </span>
      ) : null}
    </>
  );

  const classes = cn(
    'flex items-center gap-2.5 rounded-[var(--radius-md)] px-3 py-[9px] text-sm transition-colors cursor-pointer',
    active
      ? 'bg-indigo-50 text-[var(--brand-primary)] dark:bg-indigo-950/30'
      : 'text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)]',
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
    <div className={classes} onClick={onClick}>
      {content}
    </div>
  );
}
