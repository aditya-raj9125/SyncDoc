-- Fix RLS policy for share_invitations
-- The previous policy tried to query auth.users directly, which is forbidden for non-admin roles.
-- We use auth.jwt() which is accessible to the current user.

DROP POLICY IF EXISTS "Doc owners can view invitations" ON public.share_invitations;
DROP POLICY IF EXISTS "Invitation creators can update" ON public.share_invitations;

CREATE POLICY "Doc owners and invitees can view invitations"
  ON share_invitations FOR SELECT
  USING (
    invited_by = auth.uid()
    OR invited_email = (auth.jwt() ->> 'email')
    OR EXISTS (
      SELECT 1 FROM documents
      WHERE documents.id = share_invitations.document_id
        AND documents.owner_id = auth.uid()
    )
  );

CREATE POLICY "Invitees can update their invitations"
  ON share_invitations FOR UPDATE
  USING (
    invited_by = auth.uid()
    OR invited_email = (auth.jwt() ->> 'email')
  );
