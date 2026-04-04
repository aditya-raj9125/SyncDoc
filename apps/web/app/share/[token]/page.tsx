import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { SharePageContent } from './SharePageContent';

interface SharePageProps {
  params: { token: string };
}

export default async function SharePage({ params }: SharePageProps) {
  const supabase = createServerSupabaseClient();

  // Find the document by share token
  const { data: document, error } = await supabase
    .from('documents')
    .select('id, title, emoji_icon, workspace_id, content, is_public, public_access, workspaces(slug)')
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

  // GUEST ACCESS: Remove the redirect that forced login for edit access.
  // if (accessLevel === 'edit' && !user) {
  //   redirect(`/login?next=/share/${params.token}`);
  // }

  // If user is authenticated, add to document_permissions if not already
  if (user && document) {
    const { data: existingPerm } = await supabase
      .from('document_permissions')
      .select('document_id')
      .eq('document_id', document.id)
      .eq('user_id', user.id)
      .single();

    if (!existingPerm) {
      await supabase.from('document_permissions').insert({
        document_id: document.id,
        user_id: user.id,
        access: accessLevel,
      });
    }
  }

  return (
    <SharePageContent
      document={document}
      accessLevel={accessLevel}
      isAuthenticated={!!user}
      token={params.token}
    />
  );
}
