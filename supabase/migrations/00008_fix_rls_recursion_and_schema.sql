-- Migration 00008: Fix RLS infinite recursion & schema alignment
-- Root cause: document_permissions SELECT policy references documents,
-- while documents SELECT policy references document_permissions → circular recursion (42P17)

-- ============================================================
-- 1. FIX DOCUMENT_PERMISSIONS SELECT POLICY (breaks recursion)
-- ============================================================
DROP POLICY IF EXISTS "Users can view permissions for their docs" ON document_permissions;
DROP POLICY IF EXISTS "Users can view their permissions" ON document_permissions;

-- Simple non-recursive policy: users can see their own permissions
CREATE POLICY "Users can view their permissions"
  ON document_permissions FOR SELECT
  USING (user_id = auth.uid());

-- ============================================================
-- 2. ADD MISSING COLUMNS / FIX SCHEMA MISMATCHES
-- ============================================================

-- Ensure 'content' column exists (stores JSON content of document)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'documents' AND column_name = 'content'
  ) THEN
    ALTER TABLE public.documents ADD COLUMN content JSONB;
  END IF;
END $$;

-- ============================================================
-- 3. CLEAN UP TEST DATA (from diagnostic inserts)
-- ============================================================
DELETE FROM public.documents WHERE title IN ('Test Doc', 'Test API', 'Test Anon');
