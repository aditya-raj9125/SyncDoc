import { createServerSupabaseClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { TemplatesContent } from '@/components/workspace/TemplatesContent';

export default async function TemplatesPage({ params }: { params: { slug: string } }) {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: workspace } = await supabase
    .from('workspaces')
    .select('*')
    .eq('slug', params.slug)
    .single();

  if (!workspace) redirect('/');

  const { data: templates } = await supabase
    .from('templates')
    .select('*')
    .or(`is_system.eq.true,workspace_id.eq.${workspace.id}`)
    .order('use_count', { ascending: false });

  return (
    <TemplatesContent
      workspace={workspace}
      templates={templates ?? []}
    />
  );
}
