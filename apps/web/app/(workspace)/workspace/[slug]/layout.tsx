import { createServerSupabaseClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Sidebar } from '@/components/sidebar/Sidebar';

interface WorkspaceLayoutProps {
  children: React.ReactNode;
  params: { slug: string };
}

export default async function WorkspaceLayout({ children, params }: WorkspaceLayoutProps) {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  console.log('[WorkspaceLayout] user:', user?.id, 'slug:', params.slug);

  if (!user) {
    console.log('[WorkspaceLayout] No user -> /login');
    redirect('/login');
  }

  // Fetch workspace
  const { data: workspace, error: wsError } = await supabase
    .from('workspaces')
    .select('*')
    .eq('slug', params.slug)
    .single();

  console.log('[WorkspaceLayout] workspace:', workspace?.id, 'error:', wsError?.message);

  if (!workspace) {
    console.log('[WorkspaceLayout] No workspace -> /');
    redirect('/');
  }

  // Verify membership
  const { data: membership, error: memError } = await supabase
    .from('workspace_members')
    .select('role')
    .eq('workspace_id', workspace.id)
    .eq('user_id', user.id)
    .single();

  console.log('[WorkspaceLayout] membership:', membership?.role, 'error:', memError?.message);

  if (!membership) {
    console.log('[WorkspaceLayout] No membership -> /');
    redirect('/');
  }

  // Fetch profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  // Fetch folders
  const { data: folders } = await supabase
    .from('folders')
    .select('*')
    .eq('workspace_id', workspace.id)
    .order('position');

  // Fetch member count
  const { count: memberCount } = await supabase
    .from('workspace_members')
    .select('*', { count: 'exact', head: true })
    .eq('workspace_id', workspace.id);

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar
        workspace={workspace}
        profile={profile!}
        folders={folders ?? []}
        memberCount={memberCount ?? 0}
        userRole={membership.role}
      />
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
