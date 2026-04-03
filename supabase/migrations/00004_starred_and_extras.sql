-- Add starred_documents table for per-user document starring
-- Using a join table since starred state is per-user, not per-document

CREATE TABLE IF NOT EXISTS starred_documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(user_id, document_id)
);

-- Index for fast lookups
CREATE INDEX idx_starred_user ON starred_documents(user_id);
CREATE INDEX idx_starred_document ON starred_documents(document_id);

-- RLS
ALTER TABLE starred_documents ENABLE ROW LEVEL SECURITY;

-- Users can manage their own stars
CREATE POLICY "Users can view their own starred documents"
  ON starred_documents FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can star documents"
  ON starred_documents FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unstar documents"
  ON starred_documents FOR DELETE
  USING (auth.uid() = user_id);

-- Add cover_image_url and content (JSON) columns to documents if not exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'documents' AND column_name = 'cover_image_url'
  ) THEN
    ALTER TABLE documents ADD COLUMN cover_image_url TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'documents' AND column_name = 'content'
  ) THEN
    ALTER TABLE documents ADD COLUMN content JSONB;
  END IF;
END
$$;

-- Add is_public and access_level to document_links if not exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'document_links' AND column_name = 'is_public'
  ) THEN
    ALTER TABLE document_links ADD COLUMN is_public BOOLEAN DEFAULT FALSE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'document_links' AND column_name = 'access_level'
  ) THEN
    ALTER TABLE document_links ADD COLUMN access_level TEXT DEFAULT 'view' CHECK (access_level IN ('view', 'comment', 'edit'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'document_links' AND column_name = 'is_active'
  ) THEN
    ALTER TABLE document_links ADD COLUMN is_active BOOLEAN DEFAULT TRUE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'document_links' AND column_name = 'expires_at'
  ) THEN
    ALTER TABLE document_links ADD COLUMN expires_at TIMESTAMPTZ;
  END IF;
END
$$;
