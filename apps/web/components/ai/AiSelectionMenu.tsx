'use client';

import { useState, useRef, useEffect } from 'react';
import { Sparkles, Send, Loader2, X, Replace, ChevronDown, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { motion, AnimatePresence } from 'framer-motion';

interface AiSelectionMenuProps {
  selectedText: string;
  position: { top: number; left: number } | null;
  onClose: () => void;
  onApply: (result: string) => void;
  documentId?: string;
}

const AI_ACTIONS = [
  { label: 'Improve writing', prompt: 'Improve this text for clarity and style:' },
  { label: 'Fix grammar', prompt: 'Fix all grammar and spelling errors in:' },
  { label: 'Make shorter', prompt: 'Make this text more concise:' },
  { label: 'Make longer', prompt: 'Expand on this text with more detail:' },
  { label: 'Simplify', prompt: 'Simplify this text for a general audience:' },
  { label: 'Professional tone', prompt: 'Rewrite this in a professional tone:' },
  { label: 'Casual tone', prompt: 'Rewrite this in a casual, friendly tone:' },
  { label: 'Translate to Spanish', prompt: 'Translate to Spanish:' },
  { label: 'Translate to French', prompt: 'Translate to French:' },
  { label: 'Translate to German', prompt: 'Translate to German:' },
];

export function AiSelectionMenu({
  selectedText,
  position,
  onClose,
  onApply,
  documentId,
}: AiSelectionMenuProps) {
  const [result, setResult] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  if (!position) return null;

  const runAction = async (actionPrompt: string) => {
    setIsLoading(true);
    setError(null);
    setResult('');

    try {
      abortRef.current = new AbortController();

      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            {
              role: 'user',
              content: `${actionPrompt}\n\n${selectedText}\n\nRespond with only the improved text, no explanations.`,
            },
          ],
          documentId,
        }),
        signal: abortRef.current.signal,
      });

      if (!response.ok) throw new Error('AI request failed');

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response stream');

      const decoder = new TextDecoder();
      let fullText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ') && line !== 'data: [DONE]') {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.text) {
                fullText += data.text;
                setResult(fullText);
              }
            } catch {
              // Skip malformed chunks
            }
          }
        }
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      setError('AI unavailable. Try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 4 }}
        className="absolute z-50 w-64 rounded-lg border border-neutral-200 bg-white shadow-xl dark:border-neutral-700 dark:bg-neutral-800"
        style={{ top: position.top, left: position.left }}
      >
        <div className="flex items-center justify-between border-b border-neutral-100 px-3 py-2 dark:border-neutral-700">
          <span className="flex items-center gap-1.5 text-xs font-medium text-violet-600 dark:text-violet-400">
            <Sparkles size={12} />
            AI Actions
          </span>
          <button
            onClick={() => {
              abortRef.current?.abort();
              onClose();
            }}
            className="rounded p-0.5 text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-700"
          >
            <X size={12} />
          </button>
        </div>

        {!result && !isLoading ? (
          <div className="max-h-60 overflow-y-auto py-1">
            {AI_ACTIONS.map((action) => (
              <button
                key={action.label}
                onClick={() => runAction(action.prompt)}
                className="flex w-full items-center px-3 py-1.5 text-left text-sm text-neutral-700 transition-colors hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-700"
              >
                {action.label}
              </button>
            ))}
          </div>
        ) : (
          <div className="p-3">
            {isLoading && !result && (
              <div className="flex items-center gap-2 text-sm text-violet-600 dark:text-violet-400">
                <Loader2 size={14} className="animate-spin" />
                Processing...
              </div>
            )}

            {error && <p className="text-sm text-red-600">{error}</p>}

            {result && (
              <>
                <div className="max-h-40 overflow-y-auto rounded border border-neutral-100 p-2 text-sm leading-relaxed dark:border-neutral-700">
                  {result}
                  {isLoading && (
                    <span className="ml-0.5 inline-block h-3.5 w-0.5 animate-pulse bg-violet-500" />
                  )}
                </div>
                {!isLoading && (
                  <div className="mt-2 flex gap-1.5">
                    <Button size="sm" onClick={() => onApply(result)}>
                      <Replace size={12} />
                      Replace
                    </Button>
                    <Button size="sm" variant="secondary" onClick={handleCopy}>
                      {copied ? <Check size={12} /> : <Copy size={12} />}
                      {copied ? 'Copied' : 'Copy'}
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
