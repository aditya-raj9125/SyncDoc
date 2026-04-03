'use client';

import { useState, useCallback, useRef } from 'react';
import { streamAiResponse, getAiResponse } from '@/lib/ai/stream';

interface UseAIOptions {
  documentContext?: string;
}

export function useAI({ documentContext }: UseAIOptions = {}) {
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const streamPrompt = useCallback(
    async (prompt: string, action?: string) => {
      setLoading(true);
      setError(null);
      setResponse('');

      abortRef.current = new AbortController();

      try {
        let accumulated = '';
        for await (const token of streamAiResponse(
          prompt,
          documentContext,
          action,
          abortRef.current.signal
        )) {
          accumulated += token;
          setResponse(accumulated);
        }
      } catch (e) {
        if (e instanceof Error && e.name === 'AbortError') {
          // User cancelled
        } else {
          setError(e instanceof Error ? e.message : 'AI request failed');
        }
      } finally {
        setLoading(false);
        abortRef.current = null;
      }
    },
    [documentContext]
  );

  const runAction = useCallback(
    async (action: string) => {
      setLoading(true);
      setError(null);

      try {
        const result = await getAiResponse('', documentContext, action);
        setResponse(result);
        return result;
      } catch (e) {
        setError(e instanceof Error ? e.message : 'AI request failed');
        return null;
      } finally {
        setLoading(false);
      }
    },
    [documentContext]
  );

  const cancel = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  const reset = useCallback(() => {
    setResponse('');
    setError(null);
    setLoading(false);
  }, []);

  return { response, loading, error, streamPrompt, runAction, cancel, reset };
}
