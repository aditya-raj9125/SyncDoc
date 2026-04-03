'use client';

import { useState, useRef } from 'react';
import { type Editor } from '@tiptap/react';
import { Sparkles, Send, Loader2, X, Replace, ArrowDown } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { motion, AnimatePresence } from 'framer-motion';

interface AiBlockProps {
  editor: Editor;
  onClose: () => void;
  insertPosition?: number;
}

const QUICK_PROMPTS = [
  'Continue writing...',
  'Summarize the above',
  'Make it more professional',
  'Translate to Spanish',
  'Fix grammar and spelling',
  'Make it shorter',
  'Add more detail',
  'Rewrite in a different tone',
];

export function AiBlock({ editor, onClose, insertPosition }: AiBlockProps) {
  const [prompt, setPrompt] = useState('');
  const [result, setResult] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const generate = async (userPrompt: string) => {
    if (!userPrompt.trim() || isLoading) return;

    setIsLoading(true);
    setError(null);
    setResult('');

    try {
      abortRef.current = new AbortController();

      // Get surrounding document context
      const docText = editor.state.doc.textContent.slice(0, 4000);

      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            {
              role: 'user',
              content: `Context from the document:\n\n${docText}\n\nTask: ${userPrompt}\n\nRespond with just the content, no explanations.`,
            },
          ],
          documentId: editor.storage?.documentId,
        }),
        signal: abortRef.current.signal,
      });

      if (!response.ok) {
        throw new Error('AI request failed');
      }

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
      setError('AI assistant unavailable. Try again in a moment.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInsertBelow = () => {
    if (!result) return;
    const pos = insertPosition ?? editor.state.selection.to;
    editor.chain().focus().insertContentAt(pos, `<p>${result}</p>`).run();
    onClose();
  };

  const handleReplace = () => {
    if (!result) return;
    const { from, to } = editor.state.selection;
    editor.chain().focus().deleteRange({ from, to }).insertContentAt(from, result).run();
    onClose();
  };

  const cancelGeneration = () => {
    abortRef.current?.abort();
    setIsLoading(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="my-2 overflow-hidden rounded-lg border border-violet-200 bg-violet-50/50 dark:border-violet-800 dark:bg-violet-950/20"
    >
      <div className="flex items-center justify-between border-b border-violet-200 px-3 py-2 dark:border-violet-800">
        <div className="flex items-center gap-2 text-sm font-medium text-violet-700 dark:text-violet-300">
          <Sparkles size={14} />
          AI Assistant
        </div>
        <button
          onClick={onClose}
          className="rounded p-0.5 text-violet-400 hover:bg-violet-100 hover:text-violet-600 dark:hover:bg-violet-900/30"
        >
          <X size={14} />
        </button>
      </div>

      <div className="p-3">
        {!result && !isLoading && (
          <div className="mb-2 flex flex-wrap gap-1.5">
            {QUICK_PROMPTS.map((qp) => (
              <button
                key={qp}
                onClick={() => {
                  setPrompt(qp);
                  generate(qp);
                }}
                className="rounded-full border border-violet-200 bg-white px-2.5 py-1 text-xs text-violet-700 transition-colors hover:bg-violet-100 dark:border-violet-700 dark:bg-violet-900/30 dark:text-violet-300 dark:hover:bg-violet-800/50"
              >
                {qp}
              </button>
            ))}
          </div>
        )}

        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && generate(prompt)}
            placeholder="Ask AI to write anything..."
            className="flex-1 rounded-md border border-violet-200 bg-white px-3 py-1.5 text-sm outline-none focus:border-violet-400 focus:ring-1 focus:ring-violet-400 dark:border-violet-700 dark:bg-neutral-800"
            disabled={isLoading}
          />
          {isLoading ? (
            <Button size="sm" variant="secondary" onClick={cancelGeneration}>
              <X size={14} />
              Stop
            </Button>
          ) : (
            <Button size="sm" onClick={() => generate(prompt)} disabled={!prompt.trim()}>
              <Send size={14} />
            </Button>
          )}
        </div>

        {isLoading && !result && (
          <div className="mt-3 flex items-center gap-2 text-sm text-violet-600 dark:text-violet-400">
            <Loader2 size={14} className="animate-spin" />
            Generating...
          </div>
        )}

        {error && (
          <p className="mt-2 text-sm text-red-600">{error}</p>
        )}

        {result && (
          <div className="mt-3">
            <div className="rounded-md border border-violet-200 bg-white p-3 text-sm leading-relaxed dark:border-violet-700 dark:bg-neutral-800">
              {result}
              {isLoading && <span className="ml-0.5 inline-block h-4 w-0.5 animate-pulse bg-violet-500" />}
            </div>
            {!isLoading && (
              <div className="mt-2 flex gap-2">
                <Button size="sm" onClick={handleInsertBelow}>
                  <ArrowDown size={14} />
                  Insert below
                </Button>
                <Button size="sm" variant="secondary" onClick={handleReplace}>
                  <Replace size={14} />
                  Replace selection
                </Button>
                <Button size="sm" variant="ghost" onClick={onClose}>
                  Discard
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}
