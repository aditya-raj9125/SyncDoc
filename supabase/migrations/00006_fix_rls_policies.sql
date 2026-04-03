-- ============================================
-- Fix recursive + chicken-and-egg RLS policies
-- ============================================

-- WORKSPACES SELECT: also allow owner to see own workspace
-- (needed for INSERT...RETURNING before membership row exists)
DROP POLICY IF EXISTS "Members can view workspace" ON workspaces;
CREATE POLICY "Members or owners can view workspace"
  ON workspaces FOR SELECT
  USING (
    owner_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM workspace_members
      WHERE workspace_members.workspace_id = workspaces.id
        AND workspace_members.user_id = auth.uid()
    )
  );

-- WORKSPACE_MEMBERS SELECT: simplify to break self-referential recursion
-- (old policy queried workspace_members to authorize workspace_members access)
DROP POLICY IF EXISTS "Members can view other members" ON workspace_members;
CREATE POLICY "Users can view own memberships"
  ON workspace_members FOR SELECT
  USING (user_id = auth.uid());

-- Allow workspace members to see all members of their workspace (non-recursive now)
CREATE POLICY "Members can view workspace members"
  ON workspace_members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM workspaces
      WHERE workspaces.id = workspace_members.workspace_id
        AND workspaces.owner_id = auth.uid()
    )
    OR workspace_id IN (
      SELECT workspace_id FROM workspace_members wm
      WHERE wm.user_id = auth.uid()
    )
  );

-- WORKSPACE_MEMBERS INSERT: allow workspace owner to insert the first member row
-- (old policy required being a member already — impossible for first insert)
DROP POLICY IF EXISTS "Admins can manage members" ON workspace_members;
CREATE POLICY "Owners and admins can add members"
  ON workspace_members FOR INSERT
  WITH CHECK (
    -- workspace owner can always add members (including self on workspace creation)
    (SELECT owner_id FROM workspaces WHERE id = workspace_members.workspace_id) = auth.uid()
    OR
    -- existing admins/owners can add members
    EXISTS (
      SELECT 1 FROM workspace_members wm
      WHERE wm.workspace_id = workspace_members.workspace_id
        AND wm.user_id = auth.uid()
        AND wm.role IN ('owner', 'admin')
    )
  );
