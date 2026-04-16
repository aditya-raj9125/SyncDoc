import { createServerSupabaseClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { HomeContent } from '@/components/workspace/HomeContent';

interface HomePageProps {
  params: { slug: string };
}

export default async function HomePage({ params }: HomePageProps) {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  // First, fetch workspace (needed for subsequent queries)
  const { data: workspace } = await supabase
    .from('workspaces')
    .select('*')
    .eq('slug', params.slug)
    .single();

  if (!workspace) redirect('/');

  // Parallelize all remaining queries
  const [profileResult, recentDocsResult, starredDocsResult] = await Promise.all([
    supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single(),
    supabase
      .from('documents')
      .select('*, owner:profiles!documents_owner_id_fkey(display_name, avatar_url, avatar_color)')
      .eq('workspace_id', workspace.id)
      .is('deleted_at', null)
      .order('last_edited_at', { ascending: false })
      .limit(5),
    supabase
      .from('starred_documents')
      .select('document_id')
      .eq('user_id', user.id),
  ]);

  const starredIds = new Set(starredDocsResult.data?.map((s) => s.document_id) || []);

  return (
    <HomeContent
      workspace={workspace}
      profile={profileResult.data!}
      recentDocuments={(recentDocsResult.data as any) ?? []}
      starredIds={starredIds}
    />
  );
}
