import { createServerSupabaseClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import LandingPage from '@/components/landing/LandingPage';

export default async function HomePage() {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Unauthenticated → show landing page
  if (!user) {
    return <LandingPage />;
  }

  // Authenticated → try to find user's first workspace
  const { data: membership } = await supabase
    .from('workspace_members')
    .select('workspace_id, workspaces(slug)')
    .eq('user_id', user.id)
    .limit(1)
    .single();

  if (membership?.workspaces) {
    const workspace = membership.workspaces as unknown as { slug: string };
    redirect(`/workspace/${workspace.slug}/home`);
  }

  // No workspace — go to onboarding
  redirect('/onboarding');
}
