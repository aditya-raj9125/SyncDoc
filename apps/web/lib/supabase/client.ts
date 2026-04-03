import { createBrowserClient as _createSsrClient } from '@supabase/ssr';

export function createClient() {
  return _createSsrClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}

// Alias so existing imports of createBrowserClient keep working
export const createBrowserClient = createClient;
