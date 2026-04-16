-- ============================================================
-- Share Links Table — Unique random token per access level
-- Implements FIX 3: Unique Random Share Links Per Access Level
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA extensions;

CREATE TABLE IF NOT EXISTS public.share_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  access_level TEXT NOT NULL CHECK (access_level IN ('view', 'comment', 'edit')),
  -- Cryptographically random 64-char hex token — NOT derived from doc id or access level
  token TEXT UNIQUE NOT NULL DEFAULT encode(extensions.gen_random_bytes(32), 'hex'),
  created_by UUID REFERENCES public.profiles(id),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  -- One row per access level per document
  UNIQUE (document_id, access_level)
);

-- Indexes for fast token lookup and document lookup
CREATE INDEX IF NOT EXISTS idx_share_links_token ON public.share_links(token) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_share_links_document ON public.share_links(document_id);

-- RLS
ALTER TABLE public.share_links ENABLE ROW LEVEL SECURITY;

-- Document owners can read their share links
CREATE POLICY "Owners can view their document share links"
  ON public.share_links FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.documents
      WHERE documents.id = share_links.document_id
      AND documents.owner_id = auth.uid()
    )
  );

-- Document owners can insert/update share links for their documents
CREATE POLICY "Owners can manage share links"
  ON public.share_links FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.documents
      WHERE documents.id = share_links.document_id
      AND documents.owner_id = auth.uid()
    )
  );

-- Anyone (including unauthenticated) can read active share links by token
-- This is needed for the /share/[token] route to resolve
CREATE POLICY "Anyone can read active share links by token"
  ON public.share_links FOR SELECT
  USING (is_active = TRUE);
