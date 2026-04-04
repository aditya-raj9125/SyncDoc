import { createServerSupabaseClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { DocumentsListContent } from '@/components/workspace/DocumentsListContent';

export default async function ArchivePage({ params }: { params: { slug: string } }) {
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
    .eq('status', 'archived')
    .is('deleted_at', null)
    .order('last_edited_at', { ascending: false });

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
      title="Archive"
      emptyMessage="No archived documents"
      emptyHint="Archive documents you want to keep but don't need in your workspace"
    />
  );
}
