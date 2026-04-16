-- ============================================================
-- Enable Supabase Realtime for workspace state tables
-- Without this, postgres_changes subscriptions TIMED_OUT
-- ============================================================

-- Add tables to the supabase_realtime publication so that
-- Supabase Realtime postgres_changes events are emitted for them.
-- The publication only needs the tables that the client subscribes to.

ALTER PUBLICATION supabase_realtime ADD TABLE public.documents;
ALTER PUBLICATION supabase_realtime ADD TABLE public.folders;
ALTER PUBLICATION supabase_realtime ADD TABLE public.document_permissions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.starred_documents;
