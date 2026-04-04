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

  // Fetch workspace
  const { data: workspace } = await supabase
    .from('workspaces')
    .select('*')
    .eq('slug', params.slug)
    .single();

  if (!workspace) redirect('/');

  // Fetch profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  // Fetch recent documents
  const { data: recentDocs } = await supabase
    .from('documents')
    .select('*, owner:profiles!documents_owner_id_fkey(display_name, avatar_url, avatar_color)')
    .eq('workspace_id', workspace.id)
    .is('deleted_at', null)
    .order('last_edited_at', { ascending: false })
    .limit(12);

  // Fetch starred documents to show star status in list
  const { data: starredDocs } = await supabase
    .from('starred_documents')
    .select('document_id')
    .eq('user_id', user.id);

  const starredIds = new Set(starredDocs?.map((s) => s.document_id) || []);

  return (
    <HomeContent
      workspace={workspace}
      profile={profile!}
      recentDocuments={(recentDocs as any) ?? []}
      starredIds={starredIds}
    />
  );
}
