import { createServerSupabaseClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { DocumentsListContent } from '@/components/workspace/DocumentsListContent';

interface DocumentsPageProps {
  params: { slug: string };
  searchParams: { folder?: string };
}

export default async function DocumentsPage({ params, searchParams }: DocumentsPageProps) {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: workspace } = await supabase
    .from('workspaces')
    .select('*')
    .eq('slug', params.slug)
    .single();

  if (!workspace) redirect('/');

  let query = supabase
    .from('documents')
    .select('*, owner:profiles!documents_owner_id_fkey(display_name, avatar_url, avatar_color)')
    .eq('workspace_id', workspace.id)
    .is('deleted_at', null)
    .order('last_edited_at', { ascending: false });

  if (searchParams.folder) {
    query = query.eq('folder_id', searchParams.folder);
  }

  const { data: documents } = await query;

  return (
    <DocumentsListContent
      workspace={workspace}
      documents={documents ?? []}
      title="All Documents"
    />
  );
}
