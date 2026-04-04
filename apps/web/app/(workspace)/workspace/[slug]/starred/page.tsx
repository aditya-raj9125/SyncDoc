import { createServerSupabaseClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { DocumentsListContent } from '@/components/workspace/DocumentsListContent';

export default async function StarredPage({ params }: { params: { slug: string } }) {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: workspace } = await supabase
    .from('workspaces')
    .select('*')
    .eq('slug', params.slug)
    .single();

  if (!workspace) redirect('/');

  // Fetch starred documents via join table
  const { data: starred } = await supabase
    .from('starred_documents')
    .select(`
      document_id, 
      documents:documents(*, owner:profiles!documents_owner_id_fkey(display_name, avatar_url, avatar_color))
    `)
    .eq('user_id', user.id);

  const documents = (starred || [])
    .map((s: any) => s.documents)
    .filter(Boolean);

  const starredIds = new Set(documents.map((d: any) => d.id));

  return (
    <DocumentsListContent
      workspace={workspace}
      documents={documents as any}
      starredIds={starredIds}
      title="Starred"
      emptyMessage="No starred documents"
      emptyHint="Star your important documents for quick access"
    />
  );
}
