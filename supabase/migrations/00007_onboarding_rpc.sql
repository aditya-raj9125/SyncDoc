-- ============================================
-- complete_onboarding: atomic bootstrap RPC
-- Runs as SECURITY DEFINER, bypasses RLS for
-- the circular workspace/member bootstrap problem
-- ============================================

CREATE OR REPLACE FUNCTION public.complete_onboarding(
  p_display_name  TEXT,
  p_avatar_color  TEXT,
  p_workspace_name TEXT,
  p_workspace_slug TEXT,
  p_doc_title      TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id      UUID;
  v_workspace_id UUID;
  v_doc_id       UUID;
BEGIN
  -- Get the calling user's id
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- 1. Upsert profile
  INSERT INTO public.profiles (id, display_name, avatar_color)
  VALUES (v_user_id, p_display_name, p_avatar_color)
  ON CONFLICT (id) DO UPDATE
    SET display_name = EXCLUDED.display_name,
        avatar_color = EXCLUDED.avatar_color,
        updated_at   = NOW();

  -- 2. Create workspace
  INSERT INTO public.workspaces (name, slug, owner_id)
  VALUES (p_workspace_name, p_workspace_slug, v_user_id)
  RETURNING id INTO v_workspace_id;

  -- 3. Add user as owner member
  INSERT INTO public.workspace_members (workspace_id, user_id, role)
  VALUES (v_workspace_id, v_user_id, 'owner');

  -- 4. Create initial document
  INSERT INTO public.documents (workspace_id, owner_id, title)
  VALUES (v_workspace_id, v_user_id, p_doc_title)
  RETURNING id INTO v_doc_id;

  RETURN json_build_object(
    'workspace_id',   v_workspace_id,
    'workspace_slug', p_workspace_slug,
    'doc_id',         v_doc_id
  );
END;
$$;

-- Grant execute to authenticated users only
REVOKE ALL ON FUNCTION public.complete_onboarding FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.complete_onboarding TO authenticated;

-- Drop the second (recursive) workspace_members SELECT policy from migration 00006
DROP POLICY IF EXISTS "Members can view workspace members" ON workspace_members;
