import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createClient } from '@supabase/supabase-js';
import { redirect, notFound } from 'next/navigation';
import { EditorPage } from '@/components/editor/EditorPage';
import { resolveDocumentAccess } from '@/lib/permissions';

// Admin client that bypasses RLS — for shared doc recipients
function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

interface DocPageProps {
  params: { slug: string; docId: string };
}

export default async function DocPage({ params }: DocPageProps) {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  // Fetch document — RLS allows access via document_permissions
  const { data: document } = await supabase
    .from('documents')
    .select('*')
    .eq('id', params.docId)
    .single();

  if (!document) notFound();

  // Try workspace with user client first, fallback to admin
  let workspace = null;
  const { data: wsData } = await supabase
    .from('workspaces')
    .select('*')
    .eq('slug', params.slug)
    .single();

  workspace = wsData;

  if (!workspace) {
    // User isn't a workspace member — use admin client for shared doc access
    const adminClient = createAdminClient();
    const { data: adminWs } = await adminClient
      .from('workspaces')
      .select('*')
      .eq('slug', params.slug)
      .single();
    workspace = adminWs;
  }

  if (!workspace) redirect('/');

  // Fetch profile (profiles RLS allows reading any profile)
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  // Resolve access level — uses admin-like checks internally
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
