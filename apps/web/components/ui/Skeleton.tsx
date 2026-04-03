'use client';

import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-[var(--radius-md)] bg-[var(--bg-elevated)]',
        className,
      )}
    />
  );
}

export function EditorSkeleton() {
  return (
    <div className="mx-auto max-w-[800px] px-[120px] pt-[80px]">
      {/* Title skeleton */}
      <Skeleton className="mb-6 h-12 w-3/4" />
      {/* Lines */}
      <Skeleton className="mb-4 h-5 w-full" />
      <Skeleton className="mb-4 h-5 w-5/6" />
      <Skeleton className="mb-4 h-5 w-4/5" />
      <Skeleton className="mb-8 h-5 w-2/3" />
      {/* More lines */}
      <Skeleton className="mb-4 h-5 w-full" />
      <Skeleton className="mb-4 h-5 w-5/6" />
      <Skeleton className="mb-4 h-5 w-3/4" />
    </div>
  );
}

export function DocumentCardSkeleton() {
  return (
    <div className="w-[200px] overflow-hidden rounded-[var(--radius-lg)] border border-[var(--bg-border)]">
      <Skeleton className="h-20 w-full rounded-none" />
      <div className="p-3">
        <div className="flex items-center gap-2 mb-2">
          <Skeleton className="h-5 w-5 rounded" />
          <Skeleton className="h-4 w-24" />
        </div>
        <Skeleton className="h-3 w-16" />
      </div>
    </div>
  );
}

export function SidebarSkeleton() {
  return (
    <div className="flex flex-col gap-2 p-4">
      <Skeleton className="h-8 w-32 mb-4" />
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton key={i} className="h-9 w-full" />
      ))}
    </div>
  );
}
