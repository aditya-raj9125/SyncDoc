'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { useEditorStore } from '@/store/editorStore';
import {
  Sparkles,
  Send,
  FileText,
  Lightbulb,
  CheckSquare,
  MessageCircle,
  Loader2,
  X,
  Copy,
  Check,
} from 'lucide-react';

interface AiPanelProps {
  documentId: string;
}

interface AiMessage {
  role: 'user' | 'assistant';
  content: string;
}

const AI_ACTIONS = [
  {
    label: 'Summarize document',
    icon: <FileText size={14} />,
    prompt: 'Summarize this document in 3 concise bullet points.',
  },
  {
    label: 'Suggest title',
    icon: <Lightbulb size={14} />,
    prompt: 'Suggest 5 compelling titles for this document. Return just the titles, numbered.',
  },
  {
    label: 'Find action items',
    icon: <CheckSquare size={14} />,
    prompt: 'Extract all action items and to-dos from this document as a checklist.',
  },
  {
    label: 'Ask about this doc',
    icon: <MessageCircle size={14} />,
    prompt: '',
  },
];

export function AiPanel({ documentId }: AiPanelProps) {
  const [messages, setMessages] = useState<AiMessage[]>([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (prompt: string) => {
    if (!prompt.trim() || isStreaming) return;

    const userMessage: AiMessage = { role: 'user', content: prompt };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsStreaming(true);

    const assistantMessage: AiMessage = { role: 'assistant', content: '' };
    setMessages((prev) => [...prev, assistantMessage]);

    try {
      abortControllerRef.current = new AbortController();

      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentId,
          prompt,
          messages: messages.map((m) => ({ role: m.role, content: m.content })),
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        throw new Error('AI request failed');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) throw new Error('No response body');

      let fullContent = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        fullContent += chunk;

        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = { role: 'assistant', content: fullContent };
          return updated;
        });
      }
    } catch (error) {
      if ((error as Error).name === 'AbortError') {
        // User cancelled
      } else {
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = {
            role: 'assistant',
            content: 'AI assistant is unavailable right now. Please try again in a moment.',
          };
          return updated;
        });
      }
    } finally {
      setIsStreaming(false);
      abortControllerRef.current = null;
    }
  };

  const handleCancel = () => {
    abortControllerRef.current?.abort();
    setIsStreaming(false);
  };

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleAction = (action: typeof AI_ACTIONS[number]) => {
    if (action.prompt) {
      sendMessage(action.prompt);
    }
  };

  return (
    <div className="flex h-full w-[360px] flex-col bg-[var(--bg-surface)]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[var(--bg-border)] px-4 py-3">
        <div className="flex items-center gap-2">
          <Sparkles size={16} className="text-[var(--brand-secondary)]" />
          <span className="text-sm font-medium text-[var(--text-primary)]">AI Assistant</span>
        </div>
        {messages.length > 0 && (
          <button
            onClick={() => setMessages([])}
            className="text-xs text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
          >
            Clear
          </button>
        )}
      </div>

      {/* Quick actions */}
      {messages.length === 0 && (
        <div className="border-b border-[var(--bg-border)] p-4">
          <p className="mb-3 text-xs text-[var(--text-tertiary)]">Quick actions</p>
          <div className="grid grid-cols-2 gap-2">
            {AI_ACTIONS.filter((a) => a.prompt).map((action) => (
              <button
                key={action.label}
                onClick={() => handleAction(action)}
                className="flex items-center gap-2 rounded-[var(--radius-md)] border border-[var(--bg-border)] px-3 py-2 text-left text-xs text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] hover:border-[var(--brand-primary)]/30 transition-colors"
              >
                {action.icon}
                {action.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message, i) => (
          <div
            key={i}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`relative max-w-[85%] rounded-[var(--radius-lg)] px-3 py-2 text-sm ${
                message.role === 'user'
                  ? 'bg-[var(--brand-primary)] text-white'
                  : 'bg-[var(--bg-elevated)] text-[var(--text-primary)]'
              }`}
            >
              <div className="whitespace-pre-wrap">{message.content}</div>
              {message.role === 'assistant' && message.content && !isStreaming && (
                <button
                  onClick={() => handleCopy(message.content, i)}
                  className="absolute -bottom-6 right-0 flex items-center gap-1 text-[10px] text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
                >
                  {copiedIndex === i ? (
                    <><Check size={10} /> Copied</>
                  ) : (
                    <><Copy size={10} /> Copy</>
                  )}
                </button>
              )}
              {message.role === 'assistant' && isStreaming && i === messages.length - 1 && (
                <span className="ml-1 inline-block h-4 w-0.5 animate-pulse bg-[var(--text-primary)]" />
              )}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-[var(--bg-border)] p-4">
        {isStreaming && (
          <div className="mb-2 flex justify-center">
            <button
              onClick={handleCancel}
              className="flex items-center gap-1 rounded-full bg-[var(--bg-elevated)] px-3 py-1 text-xs text-[var(--text-secondary)] hover:bg-[var(--bg-border)]"
            >
              <X size={12} />
              Stop generating
            </button>
          </div>
        )}
        <div className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage(input);
              }
            }}
            placeholder="Ask AI anything about this doc..."
            className="flex-1 rounded-[var(--radius-md)] border border-[var(--bg-border)] bg-[var(--bg-canvas)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-placeholder)] outline-none focus:border-[var(--brand-primary)]"
            disabled={isStreaming}
          />
          <Button
            size="sm"
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || isStreaming}
          >
            {isStreaming ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
          </Button>
        </div>
      </div>
    </div>
  );
}
