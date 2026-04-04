import { createServerSupabaseClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { DocumentsListContent } from '@/components/workspace/DocumentsListContent';
import { STRINGS } from '@/lib/constants';

export default async function TrashPage({ params }: { params: { slug: string } }) {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: workspace } = await supabase
    .from('workspaces')
    .select('*')
    .eq('slug', params.slug)
    .single();

  if (!workspace) redirect('/');

  const { data: documents } = await supabase
    .from('documents')
    .select('*, owner:profiles!documents_owner_id_fkey(display_name, avatar_url, avatar_color)')
    .eq('workspace_id', workspace.id)
    .not('deleted_at', 'is', null)
    .order('deleted_at', { ascending: false });

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
      isTrash={true}
      title="Trash"
      emptyMessage={STRINGS.workspace.trashEmpty}
      emptyHint={STRINGS.workspace.trashHint}
    />
  );
}
