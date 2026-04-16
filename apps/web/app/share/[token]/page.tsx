import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createClient } from '@supabase/supabase-js';
import { SharePageContent } from './SharePageContent';

// Admin client that bypasses RLS — for workspace slug lookup only
function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

interface SharePageProps {
  params: { token: string };
}

export default async function SharePage({ params }: SharePageProps) {
  const supabase = createServerSupabaseClient();

  // Find the document by share token
  const { data: document, error } = await supabase
    .from('documents')
    .select('id, title, emoji_icon, workspace_id, content, is_public, public_access')
    .eq('share_token', params.token)
    .single();

  if (error || !document) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--bg-canvas)]">
        <div className="max-w-md text-center">
          <h1 className="text-2xl font-semibold text-[var(--text-primary)]">
            Access denied
          </h1>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">
            This link is invalid or has been disabled. Request a new link from the document owner.
          </p>
          <a
            href="/login"
            className="mt-6 inline-block rounded-[var(--radius-md)] bg-[var(--brand-primary)] px-4 py-2 text-sm text-white hover:bg-[var(--brand-primary-hover)] transition-colors"
          >
            Sign in
          </a>
        </div>
      </div>
    );
  }

  const accessLevel = document.public_access === 'none' ? 'view' : document.public_access;

  // Check auth status
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // AUTHENTICATED USER: Grant permissions and redirect to full workspace editor
  if (user) {
    // Insert document_permissions if not already present
    // Use admin client since the user might not have INSERT permission yet
    const adminClient = createAdminClient();

    try {
      const { data: existingPerm } = await adminClient
        .from('document_permissions')
        .select('document_id')
        .eq('document_id', document.id)
        .eq('user_id', user.id)
        .single();

      if (!existingPerm) {
        await adminClient.from('document_permissions').insert({
          document_id: document.id,
          user_id: user.id,
          access: accessLevel,
        });
      }
    } catch (err) {
      console.error('[SharePage] Error inserting document_permissions:', err);
    }

    // Get workspace slug using admin client (bypasses RLS)
    const { data: workspace } = await adminClient
      .from('workspaces')
      .select('slug')
      .eq('id', document.workspace_id)
      .single();

    if (workspace?.slug) {
      redirect(`/workspace/${workspace.slug}/doc/${document.id}`);
    }
  }

  // UNAUTHENTICATED USER: Show the bare share view with sign-in prompt
  return (
    <SharePageContent
      document={document}
      accessLevel={accessLevel}
      isAuthenticated={!!user}
      token={params.token}
    />
  );
}
