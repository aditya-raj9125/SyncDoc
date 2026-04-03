import { createServerSupabaseClient } from '@/lib/supabase/server';
import { redirect, notFound } from 'next/navigation';
import { EditorPage } from '@/components/editor/EditorPage';
import { resolveDocumentAccess } from '@/lib/permissions';

interface DocPageProps {
  params: { slug: string; docId: string };
}

export default async function DocPage({ params }: DocPageProps) {
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

  const { data: document } = await supabase
    .from('documents')
    .select('*')
    .eq('id', params.docId)
    .eq('workspace_id', workspace.id)
    .single();

  if (!document) notFound();

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  // Resolve access level for this user on this document
  const accessLevel = await resolveDocumentAccess(document.id, user.id, supabase);

  if (accessLevel === 'none') {
    redirect('/');
  }

  return (
    <EditorPage
      document={document}
      workspace={workspace}
      profile={profile!}
      accessLevel={accessLevel}
    />
  );
}
