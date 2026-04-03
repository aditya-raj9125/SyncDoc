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

  return (
    <DocumentsListContent
      workspace={workspace}
      documents={documents ?? []}
      title="Trash"
      emptyMessage={STRINGS.workspace.trashEmpty}
      emptyHint={STRINGS.workspace.trashHint}
    />
  );
}
