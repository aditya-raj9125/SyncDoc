import { createServerSupabaseClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { SharedWithMeContent } from '@/components/workspace/SharedWithMeContent';

interface SharedPageProps {
  params: { slug: string };
}

export default async function SharedPage({ params }: SharedPageProps) {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  // Parallelize workspace + profile fetch
  const [workspaceResult, profileResult] = await Promise.all([
    supabase
      .from('workspaces')
      .select('*')
      .eq('slug', params.slug)
      .single(),
    supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single(),
  ]);

  const workspace = workspaceResult.data;
  const profile = profileResult.data;

  if (!workspace) redirect('/');
  if (!profile) redirect('/onboarding');

  return (
    <SharedWithMeContent
      workspace={workspace}
      profile={profile}
      email={user.email!}
    />
  );
}
