'use client';

import { useEffect, useState, useCallback } from 'react';
import { createBrowserClient } from '@/lib/supabase/client';
import type { Document } from '@syncdoc/types';

interface UseDocumentOptions {
  documentId: string;
  enabled?: boolean;
}

export function useDocument({ documentId, enabled = true }: UseDocumentOptions) {
  const [document, setDocument] = useState<Document | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createBrowserClient();

  const fetchDocument = useCallback(async () => {
    if (!enabled || !documentId) return;
    setLoading(true);
    setError(null);

    const { data, error: err } = await supabase
      .from('documents')
      .select('*')
      .eq('id', documentId)
      .single();

    if (err) {
      setError(err.message);
      setDocument(null);
    } else {
      setDocument(data);
    }
    setLoading(false);
  }, [documentId, enabled]);

  useEffect(() => {
    fetchDocument();
  }, [fetchDocument]);

  const updateDocument = useCallback(
    async (updates: Partial<Document>) => {
      const { error: err } = await supabase
        .from('documents')
        .update({ ...updates, last_edited_at: new Date().toISOString() })
        .eq('id', documentId);

      if (err) {
        setError(err.message);
        return false;
      }

      setDocument((prev) => (prev ? { ...prev, ...updates } : null));
      return true;
    },
    [documentId]
  );

  const deleteDocument = useCallback(async () => {
    const { error: err } = await supabase
      .from('documents')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', documentId);

    if (err) {
      setError(err.message);
      return false;
    }
    return true;
  }, [documentId]);

  return { document, loading, error, refetch: fetchDocument, updateDocument, deleteDocument };
}
