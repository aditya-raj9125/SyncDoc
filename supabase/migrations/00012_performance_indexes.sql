-- ============================================================
-- Performance Hardening — Missing Indexes
-- Performance Audit from Changes.md
-- ============================================================

-- document_permissions: user_id lookup (for "shared with me" queries and permission checks)
CREATE INDEX IF NOT EXISTS idx_document_permissions_user
  ON public.document_permissions(user_id);

-- document_permissions: document_id lookup (for permission checks per document)
CREATE INDEX IF NOT EXISTS idx_document_permissions_document
  ON public.document_permissions(document_id);

-- starred_documents: document_id lookup (for checking if any user starred a doc)
CREATE INDEX IF NOT EXISTS idx_starred_document_id
  ON public.starred_documents(document_id);

-- documents: last_edited_at for fast ordering (most common sort)
CREATE INDEX IF NOT EXISTS idx_documents_last_edited
  ON public.documents(last_edited_at DESC)
  WHERE deleted_at IS NULL;

-- documents: workspace + owner combined index for "owned documents in workspace" queries
CREATE INDEX IF NOT EXISTS idx_documents_workspace_owner
  ON public.documents(workspace_id, owner_id)
  WHERE deleted_at IS NULL;

-- folders: workspace + position for sorted folder fetches
CREATE INDEX IF NOT EXISTS idx_folders_workspace_position
  ON public.folders(workspace_id, position);

-- share_links: document_id + access_level for fast upsert lookups
CREATE INDEX IF NOT EXISTS idx_share_links_doc_access
  ON public.share_links(document_id, access_level);
