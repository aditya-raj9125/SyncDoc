'use client';

import { useWorkspaceRealtime } from '@/hooks/useWorkspaceRealtime';

interface WorkspaceRealtimeProviderProps {
  workspaceId: string;
  userId: string;
  children: React.ReactNode;
}

/**
 * FIX 12 — WorkspaceRealtimeProvider
 *
 * Wrapper component that activates the Supabase Realtime subscriptions
 * for the workspace. Lives in the workspace layout so it's always active
 * while the user is in any workspace route.
 */
export function WorkspaceRealtimeProvider({
  workspaceId,
  userId,
  children,
}: WorkspaceRealtimeProviderProps) {
  useWorkspaceRealtime({ workspaceId, userId });
  return <>{children}</>;
}
