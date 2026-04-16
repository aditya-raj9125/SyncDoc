import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createClient } from '@supabase/supabase-js';
import { redirect } from 'next/navigation';
import { Sidebar } from '@/components/sidebar/Sidebar';

// Admin client that bypasses RLS — used for shared doc recipients
// who aren't workspace members
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

    // Verify the user has document_permissions for at least one doc in this workspace
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

  // Fetch profile (always accessible — profiles RLS allows reading any profile)
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  // Try to fetch membership (may be null for shared-doc-only users)
  const { data: membership } = await supabase
    .from('workspace_members')
    .select('role')
    .eq('workspace_id', workspace.id)
    .eq('user_id', user.id)
    .single();

  // Fetch folders and member count (may fail for non-members, that's OK)
  const [foldersResult, memberCountResult] = await Promise.all([
    supabase
      .from('folders')
      .select('*')
      .eq('workspace_id', workspace.id)
      .order('position'),
    supabase
      .from('workspace_members')
      .select('*', { count: 'exact', head: true })
      .eq('workspace_id', workspace.id),
  ]);

  const userRole = membership?.role || 'viewer';

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar
        workspace={workspace}
        profile={profile!}
        folders={foldersResult.data ?? []}
        memberCount={memberCountResult.count ?? 0}
        userRole={userRole}
      />
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
