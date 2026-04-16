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
  const adminClient = createAdminClient();

  // FIX 3: Look up document via share_links table (NOT documents.share_token)
  // token → share_links → document
  const { data: shareLink, error: linkError } = await adminClient
    .from('share_links')
    .select('id, document_id, access_level, is_active')
    .eq('token', params.token)
    .eq('is_active', true)
    .single();

  if (linkError || !shareLink) {
    // Fallback: try old share_token on documents for backward compatibility
    const { data: legacyDoc, error: legacyError } = await supabase
      .from('documents')
      .select('id, title, emoji_icon, workspace_id, content, is_public, public_access')
      .eq('share_token', params.token)
      .single();

    if (legacyError || !legacyDoc) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-[var(--bg-canvas)]">
          <div className="max-w-md text-center">
            <h1 className="text-2xl font-semibold text-[var(--text-primary)]">
              Link disabled or invalid
            </h1>
            <p className="mt-2 text-sm text-[var(--text-secondary)]">
              This link has been disabled or is invalid. Request a new link from the document owner.
            </p>
            <a
              href="/login"
              className="mt-6 inline-block rounded-[var(--radius-md)] bg-[var(--brand-primary)] px-4 py-2 text-sm text-white hover:opacity-90 transition-opacity"
            >
              Sign in
            </a>
          </div>
        </div>
      );
    }

    // Legacy path
    const accessLevel = legacyDoc.public_access === 'none' ? 'view' : legacyDoc.public_access;
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      try {
        const { data: existingPerm } = await adminClient
          .from('document_permissions')
          .select('document_id')
          .eq('document_id', legacyDoc.id)
          .eq('user_id', user.id)
          .single();

        if (!existingPerm) {
          await adminClient.from('document_permissions').insert({
            document_id: legacyDoc.id,
            user_id: user.id,
            access: accessLevel,
          });
        }
      } catch (err) {
        console.error('[SharePage] Error inserting document_permissions:', err);
      }

      const { data: workspace } = await adminClient
        .from('workspaces')
        .select('slug')
        .eq('id', legacyDoc.workspace_id)
        .single();

      if (workspace?.slug) {
        redirect(`/workspace/${workspace.slug}/doc/${legacyDoc.id}`);
      }
    }

    return (
      <SharePageContent
        document={legacyDoc}
        accessLevel={accessLevel}
        isAuthenticated={!!user}
        token={params.token}
      />
    );
  }

  // Fetch the document using the share link's document_id
  const { data: document, error: docError } = await adminClient
    .from('documents')
    .select('id, title, emoji_icon, workspace_id, content, is_public, public_access')
    .eq('id', shareLink.document_id)
    .is('deleted_at', null)
    .single();

  if (docError || !document) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--bg-canvas)]">
        <div className="max-w-md text-center">
          <h1 className="text-2xl font-semibold text-[var(--text-primary)]">Document not found</h1>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">
            This document may have been deleted.
          </p>
        </div>
      </div>
    );
  }

  const accessLevel = shareLink.access_level;

  // Check auth status
  const { data: { user } } = await supabase.auth.getUser();

  // AUTHENTICATED USER: Grant permissions and redirect to full workspace editor
  if (user) {
    try {
      const { data: existingPerm } = await adminClient
        .from('document_permissions')
        .select('document_id, access')
        .eq('document_id', document.id)
        .eq('user_id', user.id)
        .single();

      if (!existingPerm) {
        await adminClient.from('document_permissions').insert({
          document_id: document.id,
          user_id: user.id,
          access: accessLevel,
        });
      } else if (existingPerm.access !== accessLevel) {
        // Upgrade/downgrade access to match the link's access level
        await adminClient
          .from('document_permissions')
          .update({ access: accessLevel })
          .eq('document_id', document.id)
          .eq('user_id', user.id);
      }
    } catch (err) {
      console.error('[SharePage] Error managing document_permissions:', err);
    }

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
