import { createServerSupabaseClient } from '@/lib/supabase/server';
import { PubPageContent } from './PubPageContent';

interface PubPageProps {
  params: { token: string };
}

export async function generateMetadata({ params }: PubPageProps) {
  const supabase = createServerSupabaseClient();

  const { data: doc } = await supabase
    .from('documents')
    .select('title, content')
    .eq('share_token', params.token)
    .eq('is_public', true)
    .single();

  const title = doc?.title || 'SyncDoc';
  const description =
    typeof doc?.content === 'object'
      ? JSON.stringify(doc.content).slice(0, 200).replace(/[{}\[\]"]/g, '')
      : 'A document on SyncDoc';

  return {
    title,
    description,
    openGraph: { title, description },
  };
}

export default async function PubPage({ params }: PubPageProps) {
  const supabase = createServerSupabaseClient();

  const { data: doc, error } = await supabase
    .from('documents')
    .select('id, title, emoji_icon, content, cover_image_url, created_at, last_edited_at')
    .eq('share_token', params.token)
    .eq('is_public', true)
    .single();

  if (error || !doc) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--bg-canvas)]">
        <div className="max-w-md text-center">
          <h1 className="text-2xl font-semibold text-[var(--text-primary)]">
            Page not found
          </h1>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">
            This published page doesn&apos;t exist or has been unpublished.
          </p>
        </div>
      </div>
    );
  }

  return <PubPageContent document={doc} />;
}
