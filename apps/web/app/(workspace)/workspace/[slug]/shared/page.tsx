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

  // Fetch workspace
  const { data: workspace } = await supabase
    .from('workspaces')
    .select('*')
    .eq('slug', params.slug)
    .single();

  if (!workspace) redirect('/');

  // Fetch profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (!profile) redirect('/onboarding');

  return (
    <SharedWithMeContent
      workspace={workspace}
      profile={profile}
      email={user.email!}
    />
  );
}
