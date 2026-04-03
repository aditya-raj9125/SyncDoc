-- ============================================
-- SyncDoc — Row Level Security Policies
-- ============================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_revisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.share_invitations ENABLE ROW LEVEL SECURITY;

-- ============================================
-- PROFILES
-- ============================================
CREATE POLICY "Users can view any profile"
  ON profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- ============================================
-- WORKSPACES
-- ============================================
CREATE POLICY "Members can view workspace"
  ON workspaces FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM workspace_members
      WHERE workspace_members.workspace_id = workspaces.id
        AND workspace_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Authenticated users can create workspaces"
  ON workspaces FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners can update workspace"
  ON workspaces FOR UPDATE
  USING (owner_id = auth.uid());

CREATE POLICY "Owners can delete workspace"
  ON workspaces FOR DELETE
  USING (owner_id = auth.uid());

-- ============================================
-- WORKSPACE MEMBERS
-- ============================================
CREATE POLICY "Members can view other members"
  ON workspace_members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM workspace_members wm
      WHERE wm.workspace_id = workspace_members.workspace_id
        AND wm.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage members"
  ON workspace_members FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM workspace_members wm
      WHERE wm.workspace_id = workspace_members.workspace_id
        AND wm.user_id = auth.uid()
        AND wm.role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Admins can update members"
  ON workspace_members FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM workspace_members wm
      WHERE wm.workspace_id = workspace_members.workspace_id
        AND wm.user_id = auth.uid()
        AND wm.role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Admins can remove members"
  ON workspace_members FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM workspace_members wm
      WHERE wm.workspace_id = workspace_members.workspace_id
        AND wm.user_id = auth.uid()
        AND wm.role IN ('owner', 'admin')
    )
    OR user_id = auth.uid()  -- users can leave
  );

-- ============================================
-- FOLDERS
-- ============================================
CREATE POLICY "Workspace members can view folders"
  ON folders FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM workspace_members
      WHERE workspace_members.workspace_id = folders.workspace_id
        AND workspace_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Members can create folders"
  ON folders FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM workspace_members
      WHERE workspace_members.workspace_id = folders.workspace_id
        AND workspace_members.user_id = auth.uid()
        AND workspace_members.role IN ('owner', 'admin', 'member')
    )
  );

CREATE POLICY "Members can update folders"
  ON folders FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM workspace_members
      WHERE workspace_members.workspace_id = folders.workspace_id
        AND workspace_members.user_id = auth.uid()
        AND workspace_members.role IN ('owner', 'admin', 'member')
    )
  );

CREATE POLICY "Members can delete folders"
  ON folders FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM workspace_members
      WHERE workspace_members.workspace_id = folders.workspace_id
        AND workspace_members.user_id = auth.uid()
        AND workspace_members.role IN ('owner', 'admin', 'member')
    )
  );

-- ============================================
-- DOCUMENTS
-- ============================================
CREATE POLICY "Public documents are viewable by anyone"
  ON documents FOR SELECT
  USING (
    (is_public = TRUE AND public_access != 'none' AND deleted_at IS NULL)
    OR
    EXISTS (
      SELECT 1 FROM workspace_members
      WHERE workspace_members.workspace_id = documents.workspace_id
        AND workspace_members.user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM document_permissions
      WHERE document_permissions.document_id = documents.id
        AND document_permissions.user_id = auth.uid()
    )
  );

CREATE POLICY "Workspace members can create documents"
  ON documents FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM workspace_members
      WHERE workspace_members.workspace_id = documents.workspace_id
        AND workspace_members.user_id = auth.uid()
        AND workspace_members.role IN ('owner', 'admin', 'member')
    )
  );

CREATE POLICY "Document access for updates"
  ON documents FOR UPDATE
  USING (
    owner_id = auth.uid()
    OR
    EXISTS (
      SELECT 1 FROM workspace_members
      WHERE workspace_members.workspace_id = documents.workspace_id
        AND workspace_members.user_id = auth.uid()
        AND workspace_members.role IN ('owner', 'admin', 'member')
    )
    OR
    EXISTS (
      SELECT 1 FROM document_permissions
      WHERE document_permissions.document_id = documents.id
        AND document_permissions.user_id = auth.uid()
        AND document_permissions.access IN ('edit', 'owner')
    )
  );

CREATE POLICY "Owners and admins can delete documents"
  ON documents FOR DELETE
  USING (
    owner_id = auth.uid()
    OR
    EXISTS (
      SELECT 1 FROM workspace_members
      WHERE workspace_members.workspace_id = documents.workspace_id
        AND workspace_members.user_id = auth.uid()
        AND workspace_members.role IN ('owner', 'admin')
    )
  );

-- ============================================
-- DOCUMENT PERMISSIONS
-- ============================================
CREATE POLICY "Users can view permissions for their docs"
  ON document_permissions FOR SELECT
  USING (
    user_id = auth.uid()
    OR
    EXISTS (
      SELECT 1 FROM documents
      WHERE documents.id = document_permissions.document_id
        AND documents.owner_id = auth.uid()
    )
  );

CREATE POLICY "Doc owners can manage permissions"
  ON document_permissions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM documents
      WHERE documents.id = document_permissions.document_id
        AND (
          documents.owner_id = auth.uid()
          OR EXISTS (
            SELECT 1 FROM document_permissions dp
            WHERE dp.document_id = document_permissions.document_id
              AND dp.user_id = auth.uid()
              AND dp.access = 'owner'
          )
        )
    )
  );

CREATE POLICY "Doc owners can update permissions"
  ON document_permissions FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM documents
      WHERE documents.id = document_permissions.document_id
        AND documents.owner_id = auth.uid()
    )
  );

CREATE POLICY "Doc owners can delete permissions"
  ON document_permissions FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM documents
      WHERE documents.id = document_permissions.document_id
        AND documents.owner_id = auth.uid()
    )
  );

-- ============================================
-- DOCUMENT REVISIONS
-- ============================================
CREATE POLICY "Users with doc access can view revisions"
  ON document_revisions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM documents
      WHERE documents.id = document_revisions.document_id
        AND (
          documents.owner_id = auth.uid()
          OR EXISTS (
            SELECT 1 FROM workspace_members
            WHERE workspace_members.workspace_id = documents.workspace_id
              AND workspace_members.user_id = auth.uid()
          )
          OR EXISTS (
            SELECT 1 FROM document_permissions
            WHERE document_permissions.document_id = documents.id
              AND document_permissions.user_id = auth.uid()
          )
        )
    )
  );

CREATE POLICY "Users with edit access can create revisions"
  ON document_revisions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM documents
      WHERE documents.id = document_revisions.document_id
        AND (
          documents.owner_id = auth.uid()
          OR EXISTS (
            SELECT 1 FROM workspace_members
            WHERE workspace_members.workspace_id = documents.workspace_id
              AND workspace_members.user_id = auth.uid()
              AND workspace_members.role IN ('owner', 'admin', 'member')
          )
          OR EXISTS (
            SELECT 1 FROM document_permissions
            WHERE document_permissions.document_id = documents.id
              AND document_permissions.user_id = auth.uid()
              AND document_permissions.access IN ('edit', 'owner')
          )
        )
    )
  );

-- ============================================
-- COMMENTS
-- ============================================
CREATE POLICY "Users with doc access can view comments"
  ON comments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM documents
      WHERE documents.id = comments.document_id
        AND (
          (documents.is_public = TRUE AND documents.public_access IN ('comment', 'edit'))
          OR documents.owner_id = auth.uid()
          OR EXISTS (
            SELECT 1 FROM workspace_members
            WHERE workspace_members.workspace_id = documents.workspace_id
              AND workspace_members.user_id = auth.uid()
          )
          OR EXISTS (
            SELECT 1 FROM document_permissions
            WHERE document_permissions.document_id = documents.id
              AND document_permissions.user_id = auth.uid()
          )
        )
    )
  );

CREATE POLICY "Users with comment/edit access can create comments"
  ON comments FOR INSERT
  WITH CHECK (
    author_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM documents
      WHERE documents.id = comments.document_id
        AND (
          (documents.is_public = TRUE AND documents.public_access IN ('comment', 'edit'))
          OR documents.owner_id = auth.uid()
          OR EXISTS (
            SELECT 1 FROM workspace_members
            WHERE workspace_members.workspace_id = documents.workspace_id
              AND workspace_members.user_id = auth.uid()
              AND workspace_members.role != 'viewer'
          )
          OR EXISTS (
            SELECT 1 FROM document_permissions
            WHERE document_permissions.document_id = documents.id
              AND document_permissions.user_id = auth.uid()
              AND document_permissions.access IN ('comment', 'edit', 'owner')
          )
        )
    )
  );

CREATE POLICY "Comment authors can update their comments"
  ON comments FOR UPDATE
  USING (author_id = auth.uid());

CREATE POLICY "Comment authors and doc owners can delete comments"
  ON comments FOR DELETE
  USING (
    author_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM documents
      WHERE documents.id = comments.document_id
        AND documents.owner_id = auth.uid()
    )
  );

-- ============================================
-- TEMPLATES
-- ============================================
CREATE POLICY "System templates visible to all authenticated"
  ON templates FOR SELECT
  USING (
    is_system = TRUE
    OR created_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM workspace_members
      WHERE workspace_members.workspace_id = templates.workspace_id
        AND workspace_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Authenticated users can create templates"
  ON templates FOR INSERT
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Template creators can update"
  ON templates FOR UPDATE
  USING (created_by = auth.uid());

CREATE POLICY "Template creators can delete"
  ON templates FOR DELETE
  USING (created_by = auth.uid());

-- ============================================
-- DOCUMENT LINKS
-- ============================================
CREATE POLICY "Users with doc access can view links"
  ON document_links FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM documents
      WHERE documents.id = document_links.source_document_id
        AND (
          documents.owner_id = auth.uid()
          OR EXISTS (
            SELECT 1 FROM workspace_members
            WHERE workspace_members.workspace_id = documents.workspace_id
              AND workspace_members.user_id = auth.uid()
          )
        )
    )
  );

CREATE POLICY "Users with edit access can create links"
  ON document_links FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM documents
      WHERE documents.id = document_links.source_document_id
        AND (
          documents.owner_id = auth.uid()
          OR EXISTS (
            SELECT 1 FROM workspace_members
            WHERE workspace_members.workspace_id = documents.workspace_id
              AND workspace_members.user_id = auth.uid()
              AND workspace_members.role IN ('owner', 'admin', 'member')
          )
        )
    )
  );

CREATE POLICY "Users with edit access can delete links"
  ON document_links FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM documents
      WHERE documents.id = document_links.source_document_id
        AND (
          documents.owner_id = auth.uid()
          OR EXISTS (
            SELECT 1 FROM workspace_members
            WHERE workspace_members.workspace_id = documents.workspace_id
              AND workspace_members.user_id = auth.uid()
              AND workspace_members.role IN ('owner', 'admin', 'member')
          )
        )
    )
  );

-- ============================================
-- SHARE INVITATIONS
-- ============================================
CREATE POLICY "Doc owners can view invitations"
  ON share_invitations FOR SELECT
  USING (
    invited_by = auth.uid()
    OR invited_email = (SELECT email FROM auth.users WHERE id = auth.uid())
    OR EXISTS (
      SELECT 1 FROM documents
      WHERE documents.id = share_invitations.document_id
        AND documents.owner_id = auth.uid()
    )
  );

CREATE POLICY "Doc owners can create invitations"
  ON share_invitations FOR INSERT
  WITH CHECK (
    invited_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM documents
      WHERE documents.id = share_invitations.document_id
        AND (
          documents.owner_id = auth.uid()
          OR EXISTS (
            SELECT 1 FROM document_permissions
            WHERE document_permissions.document_id = documents.id
              AND document_permissions.user_id = auth.uid()
              AND document_permissions.access IN ('edit', 'owner')
          )
        )
    )
  );

CREATE POLICY "Invitation creators can update"
  ON share_invitations FOR UPDATE
  USING (
    invited_by = auth.uid()
    OR invited_email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

CREATE POLICY "Invitation creators can delete"
  ON share_invitations FOR DELETE
  USING (invited_by = auth.uid());
