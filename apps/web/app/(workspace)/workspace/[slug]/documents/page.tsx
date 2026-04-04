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

  // Fetch starred documents to show star status in list
  const { data: starredDocs } = await supabase
    .from('starred_documents')
    .select('document_id')
    .eq('user_id', user.id);

  const starredIds = new Set(starredDocs?.map((s) => s.document_id) || []);

  return (
    <DocumentsListContent
      workspace={workspace}
      documents={(documents as any) ?? []}
      starredIds={starredIds}
      title={searchParams.folder ? "Folder" : "All Documents"}
    />
  );
}
