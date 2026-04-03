-- ============================================
-- SyncDoc — Initial Schema Migration
-- ============================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA extensions;

-- ============================================
-- PROFILES (extends Supabase auth.users)
-- ============================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  avatar_url TEXT,
  avatar_color TEXT NOT NULL DEFAULT '#6366f1',
  bio TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- WORKSPACES
-- ============================================
CREATE TABLE public.workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  logo_url TEXT,
  owner_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  plan TEXT DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'enterprise')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- WORKSPACE MEMBERS
-- ============================================
CREATE TABLE public.workspace_members (
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member', 'viewer')),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (workspace_id, user_id)
);

-- ============================================
-- FOLDERS
-- ============================================
CREATE TABLE public.folders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE,
  parent_folder_id UUID REFERENCES public.folders(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  position FLOAT DEFAULT 0
);

-- ============================================
-- DOCUMENTS
-- ============================================
CREATE TABLE public.documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE,
  folder_id UUID REFERENCES public.folders(id) ON DELETE SET NULL,
  title TEXT NOT NULL DEFAULT 'Untitled',
  emoji_icon TEXT DEFAULT '📄',
  cover_image_url TEXT,
  owner_id UUID REFERENCES public.profiles(id),

  -- CRDT state
  ydoc_state BYTEA,
  word_count INT DEFAULT 0,
  character_count INT DEFAULT 0,

  -- Sharing
  is_public BOOLEAN DEFAULT FALSE,
  public_access TEXT DEFAULT 'none' CHECK (public_access IN ('none', 'view', 'comment', 'edit')),
  share_token TEXT UNIQUE DEFAULT encode(extensions.gen_random_bytes(16), 'hex'),

  -- Status
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  is_template BOOLEAN DEFAULT FALSE,
  template_category TEXT,

  -- Source
  source_type TEXT CHECK (source_type IN ('blank', 'uploaded', 'template')),
  original_filename TEXT,

  -- Metadata
  last_edited_by UUID REFERENCES public.profiles(id),
  last_edited_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  position FLOAT DEFAULT 0
);

-- ============================================
-- DOCUMENT PERMISSIONS
-- ============================================
CREATE TABLE public.document_permissions (
  document_id UUID REFERENCES public.documents(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  access TEXT NOT NULL CHECK (access IN ('view', 'comment', 'edit', 'owner')),
  granted_by UUID REFERENCES public.profiles(id),
  granted_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (document_id, user_id)
);

-- ============================================
-- DOCUMENT REVISIONS
-- ============================================
CREATE TABLE public.document_revisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID REFERENCES public.documents(id) ON DELETE CASCADE,
  ydoc_snapshot BYTEA NOT NULL,
  title TEXT,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  label TEXT,
  delta_size_bytes INT
);

-- ============================================
-- COMMENTS
-- ============================================
CREATE TABLE public.comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID REFERENCES public.documents(id) ON DELETE CASCADE,
  author_id UUID REFERENCES public.profiles(id),

  -- Thread support
  parent_comment_id UUID REFERENCES public.comments(id) ON DELETE CASCADE,
  thread_id UUID,

  -- Text anchor
  anchor_from INT,
  anchor_to INT,
  quoted_text TEXT,

  body TEXT NOT NULL,
  resolved BOOLEAN DEFAULT FALSE,
  resolved_by UUID REFERENCES public.profiles(id),
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TEMPLATES
-- ============================================
CREATE TABLE public.templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  thumbnail_url TEXT,
  ydoc_state BYTEA NOT NULL,
  is_system BOOLEAN DEFAULT FALSE,
  created_by UUID REFERENCES public.profiles(id),
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE,
  use_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- DOCUMENT LINKS (knowledge graph)
-- ============================================
CREATE TABLE public.document_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_document_id UUID REFERENCES public.documents(id) ON DELETE CASCADE,
  target_document_id UUID REFERENCES public.documents(id) ON DELETE CASCADE,
  link_type TEXT DEFAULT 'mention' CHECK (link_type IN ('mention', 'embed', 'backlink')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (source_document_id, target_document_id, link_type)
);

-- ============================================
-- SHARE INVITATIONS
-- ============================================
CREATE TABLE public.share_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID REFERENCES public.documents(id) ON DELETE CASCADE,
  invited_email TEXT NOT NULL,
  access TEXT NOT NULL CHECK (access IN ('view', 'comment', 'edit')),
  invited_by UUID REFERENCES public.profiles(id),
  token TEXT UNIQUE DEFAULT encode(extensions.gen_random_bytes(24), 'hex'),
  accepted BOOLEAN DEFAULT FALSE,
  expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '7 days',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX idx_documents_workspace ON documents(workspace_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_documents_owner ON documents(owner_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_documents_share_token ON documents(share_token);
CREATE INDEX idx_revisions_document_time ON document_revisions(document_id, created_at DESC);
CREATE INDEX idx_comments_document ON comments(document_id) WHERE resolved = FALSE;
CREATE INDEX idx_document_links_source ON document_links(source_document_id);
CREATE INDEX idx_document_links_target ON document_links(target_document_id);
CREATE INDEX idx_folders_workspace ON folders(workspace_id);
CREATE INDEX idx_workspace_members_user ON workspace_members(user_id);
CREATE INDEX idx_share_invitations_token ON share_invitations(token);
CREATE INDEX idx_share_invitations_email ON share_invitations(invited_email);
CREATE INDEX idx_documents_deleted ON documents(deleted_at) WHERE deleted_at IS NOT NULL;

-- Full-text search index
ALTER TABLE documents ADD COLUMN IF NOT EXISTS fts tsvector
  GENERATED ALWAYS AS (to_tsvector('english', coalesce(title, ''))) STORED;
CREATE INDEX idx_documents_fts ON documents USING gin(fts);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER comments_updated_at
  BEFORE UPDATE ON comments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Auto-create profile on auth signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, avatar_url, avatar_color)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.raw_user_meta_data ->> 'name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data ->> 'avatar_url',
    (ARRAY['#6366f1', '#ec4899', '#10b981', '#f59e0b', '#3b82f6', '#8b5cf6', '#ef4444', '#14b8a6'])[
      1 + (abs(hashtext(NEW.id::text)) % 8)
    ]
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Auto-update document last_edited_at
CREATE OR REPLACE FUNCTION update_document_edited()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_edited_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER documents_edited_at
  BEFORE UPDATE ON documents
  FOR EACH ROW EXECUTE FUNCTION update_document_edited();
