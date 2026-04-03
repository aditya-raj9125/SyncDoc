'use client';

import { useEffect, useState, useCallback } from 'react';
import { createBrowserClient } from '@/lib/supabase/client';
import type { Comment } from '@syncdoc/types';

interface UseCommentsOptions {
  documentId: string;
  enabled?: boolean;
}

export function useComments({ documentId, enabled = true }: UseCommentsOptions) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createBrowserClient();

  const fetchComments = useCallback(async () => {
    if (!enabled || !documentId) return;
    setLoading(true);

    const { data } = await supabase
      .from('comments')
      .select('*, profiles(display_name, avatar_url, avatar_color)')
      .eq('document_id', documentId)
      .is('parent_comment_id', null)
      .order('created_at', { ascending: true });

    setComments(data || []);
    setLoading(false);
  }, [documentId, enabled]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  // Real-time subscription
  useEffect(() => {
    if (!enabled || !documentId) return;

    const channel = supabase
      .channel(`comments:${documentId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'comments',
          filter: `document_id=eq.${documentId}`,
        },
        () => {
          fetchComments();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [documentId, enabled, fetchComments]);

  const addComment = useCallback(
    async (content: string, anchorText?: string, parentCommentId?: string) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from('comments')
        .insert({
          document_id: documentId,
          author_id: user.id,
          body: content,
          quoted_text: anchorText,
          parent_comment_id: parentCommentId,
        })
        .select('*, profiles(display_name, avatar_url, avatar_color)')
        .single();

      if (error) return null;
      return data;
    },
    [documentId]
  );

  const resolveComment = useCallback(
    async (commentId: string, resolved: boolean) => {
      await supabase
        .from('comments')
        .update({ resolved })
        .eq('id', commentId);
    },
    []
  );

  const deleteComment = useCallback(async (commentId: string) => {
    await supabase.from('comments').delete().eq('id', commentId);
  }, []);

  return { comments, loading, addComment, resolveComment, deleteComment, refetch: fetchComments };
}
