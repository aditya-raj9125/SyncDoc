import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createClient } from '@supabase/supabase-js';
import { redirect } from 'next/navigation';
import { DocumentsListContent } from '@/components/workspace/DocumentsListContent';

function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

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

  const adminClient = createAdminClient();

  // FIX 9: Fetch owned docs and shared doc IDs in parallel — NO broken .or() call
  const [ownedResult, permissionsResult, starredResult] = await Promise.all([
    // 1. Documents the user owns in this workspace
    adminClient
      .from('documents')
      .select('*, owner:profiles!documents_owner_id_fkey(display_name, avatar_url, avatar_color)')
      .eq('workspace_id', workspace.id)
      .eq('owner_id', user.id)
      .is('deleted_at', null)
      .neq('status', 'archived')
      .order('last_edited_at', { ascending: false }),

    // 2. Document IDs explicitly shared with this user
    adminClient
      .from('document_permissions')
      .select('document_id')
      .eq('user_id', user.id),

    // 3. Starred document IDs for this user
    supabase
      .from('starred_documents')
      .select('document_id')
      .eq('user_id', user.id),
  ]);

  // Fetch the full shared documents separately (only if there are any)
  const sharedDocIds = (permissionsResult.data ?? []).map((p: any) => p.document_id);

  let sharedDocs: any[] = [];
  if (sharedDocIds.length > 0) {
    const { data: sharedData } = await adminClient
      .from('documents')
      .select('*, owner:profiles!documents_owner_id_fkey(display_name, avatar_url, avatar_color)')
      .in('id', sharedDocIds)
      .neq('owner_id', user.id) // exclude own docs (already in ownedResult)
      .is('deleted_at', null)
      .neq('status', 'archived');
    sharedDocs = sharedData ?? [];
  }

  // Optional folder filter
  const ownedDocs = (ownedResult.data ?? []).filter((d: any) =>
    searchParams.folder ? d.folder_id === searchParams.folder : true
  );
  const filteredSharedDocs = sharedDocs.filter((d: any) =>
    searchParams.folder ? d.folder_id === searchParams.folder : true
  );

  // Merge + deduplicate by ID, newest first
  const allDocsMap = new Map<string, any>();
  [...ownedDocs, ...filteredSharedDocs].forEach((doc) => {
    if (!allDocsMap.has(doc.id)) {
      allDocsMap.set(doc.id, doc);
    }
  });

  const allDocs = Array.from(allDocsMap.values()).sort(
    (a, b) => new Date(b.last_edited_at).getTime() - new Date(a.last_edited_at).getTime()
  );

  const starredIds = new Set((starredResult.data ?? []).map((s: any) => s.document_id));

  return (
    <DocumentsListContent
      workspace={workspace}
      documents={allDocs as any}
      starredIds={starredIds}
      title={searchParams.folder ? 'Folder' : 'All Documents'}
      currentUserId={user.id}
    />
  );
}
