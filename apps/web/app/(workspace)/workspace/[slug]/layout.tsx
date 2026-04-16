import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createClient } from '@supabase/supabase-js';
import { redirect } from 'next/navigation';
import { Sidebar } from '@/components/sidebar/Sidebar';
import { WorkspaceStoreInitializer } from '@/components/providers/WorkspaceStoreInitializer';
import { WorkspaceRealtimeProvider } from '@/components/providers/WorkspaceRealtimeProvider';

// Admin client that bypasses RLS — used for shared doc recipients
function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

interface WorkspaceLayoutProps {
  children: React.ReactNode;
  params: { slug: string };
}

export default async function WorkspaceLayout({ children, params }: WorkspaceLayoutProps) {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Try fetching workspace with the user's client first (works if user is a member)
  let workspace = null;
  const { data: wsData } = await supabase
    .from('workspaces')
    .select('*')
    .eq('slug', params.slug)
    .single();

  workspace = wsData;

  // If the user's client can't see the workspace (not a member),
  // use the admin client — the user might have shared doc access
  if (!workspace) {
    const adminClient = createAdminClient();

    const { data: adminWs } = await adminClient
      .from('workspaces')
      .select('*')
      .eq('slug', params.slug)
      .single();

    if (adminWs) {
      const { data: sharedAccess } = await adminClient
        .from('document_permissions')
        .select('document_id, documents!inner(workspace_id)')
        .eq('user_id', user.id)
        .eq('documents.workspace_id', adminWs.id)
        .limit(1);

      if (sharedAccess && sharedAccess.length > 0) {
        workspace = adminWs;
      }
    }
  }

  if (!workspace) {
    redirect('/');
  }

  // FIX 12: Parallel fetch all initial workspace data — Promise.all (Performance Audit)
  const [profileResult, membershipResult, foldersResult, memberCountResult, docsResult, sharedDocsResult, starredResult] =
    await Promise.all([
      supabase.from('profiles').select('*').eq('id', user.id).single(),
      supabase.from('workspace_members').select('role').eq('workspace_id', workspace.id).eq('user_id', user.id).single(),
      supabase.from('folders').select('*').eq('workspace_id', workspace.id).order('position'),
      supabase.from('workspace_members').select('*', { count: 'exact', head: true }).eq('workspace_id', workspace.id),
      supabase
        .from('documents')
        .select('*, owner:profiles!documents_owner_id_fkey(display_name, avatar_url, avatar_color)')
        .eq('workspace_id', workspace.id)
        .eq('owner_id', user.id)
        .is('deleted_at', null)
        .neq('status', 'archived')
        .order('last_edited_at', { ascending: false }),
      supabase
        .from('document_permissions')
        .select('document_id, documents!inner(*, owner:profiles!documents_owner_id_fkey(display_name, avatar_url, avatar_color))')
        .eq('user_id', user.id),
      supabase
        .from('starred_documents')
        .select('document_id')
        .eq('user_id', user.id),
    ]);

  const userRole = membershipResult.data?.role || 'viewer';
  const sharedDocs = (sharedDocsResult.data ?? [])
    .map((p: any) => p.documents)
    .filter(Boolean) as any[];
  const starredIds = (starredResult.data ?? []).map((s: any) => s.document_id);

  return (
    <div className="flex h-screen overflow-hidden">
      {/* FIX 12: Hydrate Zustand store with all server-fetched data */}
      <WorkspaceStoreInitializer
        documents={(docsResult.data ?? []) as any}
        sharedDocuments={sharedDocs}
        folders={(foldersResult.data ?? []) as any}
        starredIds={starredIds}
      />

      <Sidebar
        workspace={workspace}
        profile={profileResult.data!}
        folders={foldersResult.data ?? []}
        memberCount={memberCountResult.count ?? 0}
        userRole={userRole}
      />

      {/* FIX 12: Realtime subscriptions active for all workspace routes */}
      <WorkspaceRealtimeProvider workspaceId={workspace.id} userId={user.id}>
        <main className="flex-1 overflow-auto">{children}</main>
      </WorkspaceRealtimeProvider>
    </div>
  );
}
