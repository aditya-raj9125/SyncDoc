import { SupabaseClient } from '@supabase/supabase-js';

export type AccessLevel = 'none' | 'view' | 'comment' | 'edit' | 'owner';

/**
 * Resolves the effective access level a user has on a document.
 * Priority: owner → document_permissions → workspace membership → public access → none
 */
export async function resolveDocumentAccess(
  documentId: string,
  userId: string | null,
  supabase: SupabaseClient
): Promise<AccessLevel> {
  // PRIORITIZE AUTHENTICATED ACCESS: But allow guest check to proceed for public docs.
  // if (!userId) return 'none'; (Removed to allow public access fallback)
  // Step 1: Fetch document metadata
  const { data: doc, error } = await supabase
    .from('documents')
    .select('owner_id, is_public, public_access, workspace_id')
    .eq('id', documentId)
    .single();

  if (error || !doc) return 'none';

  // Step 2: Owner always has full access
  if (userId && doc.owner_id === userId) return 'owner';

  // Step 3: Check explicit document_permissions table
  if (userId) {
    const { data: perm } = await supabase
      .from('document_permissions')
      .select('access')
      .eq('document_id', documentId)
      .eq('user_id', userId)
      .single();

    if (perm) return perm.access as AccessLevel;
  }

  // Step 4: Check workspace membership
  if (userId) {
    const { data: member } = await supabase
      .from('workspace_members')
      .select('role')
      .eq('workspace_id', doc.workspace_id)
      .eq('user_id', userId)
      .single();

    if (member) {
      if (member.role === 'owner' || member.role === 'admin') return 'edit';
      if (member.role === 'member') return 'edit';
      if (member.role === 'viewer') return 'view';
    }
  }

  // Step 5: Check share_invitations (by email)
  const { data: { user } } = await supabase.auth.getUser();
  if (user?.email) {
    const { data: invite } = await supabase
      .from('share_invitations')
      .select('access')
      .eq('document_id', documentId)
      .eq('invited_email', user.email)
      .single();

    if (invite) return invite.access as AccessLevel;
  }

  // Step 6: Fall back to public access setting
  if (doc.is_public && doc.public_access !== 'none') {
    return doc.public_access as AccessLevel;
  }

  return 'none';
}
