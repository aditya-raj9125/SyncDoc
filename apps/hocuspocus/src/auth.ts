import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Service role client — bypasses RLS for server-side permission checks
const supabaseAdmin: SupabaseClient = createClient(supabaseUrl, supabaseServiceKey);

interface AuthUser {
  id: string;
  name?: string;
  email?: string;
  isAnonymous?: boolean;
  readOnly?: boolean;
}

interface AuthResult {
  user: AuthUser;
}

/**
 * Authenticate a Hocuspocus connection.
 * Checks: JWT validity → document ownership → document_permissions → workspace membership → public access.
 */
export async function authenticateConnection(
  token: string | null | undefined,
  documentName: string
): Promise<AuthResult> {
  const documentId = documentName;

  // Case 1: No token — check if document is publicly accessible
  if (!token) {
    const { data: doc } = await supabaseAdmin
      .from('documents')
      .select('is_public, public_access')
      .eq('id', documentId)
      .single();

    if (doc?.is_public && doc.public_access === 'edit') {
      return { user: { id: 'anonymous', name: 'Guest', isAnonymous: true } };
    }
    if (doc?.is_public && doc.public_access === 'view') {
      return { user: { id: 'anonymous', name: 'Guest', isAnonymous: true, readOnly: true } };
    }
    throw new Error('Unauthorized: no token and document is not public');
  }

  // Case 2: Token provided — verify JWT with Supabase
  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !user) {
    throw new Error('Authentication failed: invalid token');
  }

  // Get user profile name
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('display_name')
    .eq('id', user.id)
    .single();

  const userName = profile?.display_name || user.user_metadata?.name || user.email || 'User';

  // Case 3: Fetch document to check access
  const { data: doc } = await supabaseAdmin
    .from('documents')
    .select('owner_id, workspace_id, is_public, public_access')
    .eq('id', documentId)
    .single();

  if (!doc) throw new Error('Document not found');

  // Owner always has full access
  if (doc.owner_id === user.id) {
    return { user: { id: user.id, name: userName, email: user.email } };
  }

  // Check explicit document permissions
  const { data: perm } = await supabaseAdmin
    .from('document_permissions')
    .select('access')
    .eq('document_id', documentId)
    .eq('user_id', user.id)
    .single();

  if (perm && perm.access !== 'none') {
    return {
      user: {
        id: user.id,
        name: userName,
        email: user.email,
        readOnly: perm.access === 'view',
      },
    };
  }

  // Check workspace membership
  const { data: member } = await supabaseAdmin
    .from('workspace_members')
    .select('role')
    .eq('workspace_id', doc.workspace_id)
    .eq('user_id', user.id)
    .single();

  if (member) {
    return {
      user: {
        id: user.id,
        name: userName,
        email: user.email,
        readOnly: member.role === 'viewer',
      },
    };
  }

  // Check public access as last resort
  if (doc.is_public && doc.public_access !== 'none') {
    return {
      user: {
        id: user.id,
        name: userName,
        email: user.email,
        readOnly: doc.public_access === 'view',
      },
    };
  }

  throw new Error('Access denied: user has no permission for this document');
}
