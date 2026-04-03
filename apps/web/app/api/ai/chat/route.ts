import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || '';
const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
const MAX_TOKENS = 2048;
const MODEL = 'claude-sonnet-4-6-20250514';

export async function POST(req: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { prompt, documentContext, action } = body;

    if (!prompt && !action) {
      return NextResponse.json({ error: 'Missing prompt or action' }, { status: 400 });
    }

    // Build system prompt
    let systemPrompt = `You are SyncDoc AI, an intelligent writing assistant embedded in a collaborative document editor. You help users write, edit, and improve their documents. Be concise, helpful, and match the user's writing style when possible.`;

    if (documentContext) {
      const truncatedContext = documentContext.slice(0, 4000);
      systemPrompt += `\n\nHere is the current document content for context:\n---\n${truncatedContext}\n---`;
    }

    // Build user message based on action
    let userMessage = prompt || '';
    if (action) {
      const actionPrompts: Record<string, string> = {
        summarize:
          'Summarize this document in 3 concise bullet points. Each bullet should capture a key point.',
        'suggest-title':
          'Suggest 5 compelling titles for this document. Return them as a numbered list.',
        'find-actions':
          "Extract all action items, to-dos, and tasks from this document. Format each as a checkbox item like: - [ ] Action item",
        'improve-writing':
          'Improve the writing quality of the selected text. Make it clearer, more concise, and professional while preserving the original meaning.',
        'fix-grammar':
          'Fix any grammar, spelling, and punctuation errors in the following text. Only return the corrected text.',
        'make-shorter':
          'Rewrite the following text to be more concise while preserving the key information.',
        'make-longer':
          'Expand the following text with more detail and supporting points while maintaining the same tone.',
        'change-tone':
          'Rewrite the following text in a more professional/formal tone.',
        translate:
          'Translate the following text to English. If it is already in English, translate to Spanish.',
      };
      userMessage = actionPrompts[action] || prompt;
    }

    // Streaming response
    const response = await fetch(ANTHROPIC_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: MAX_TOKENS,
        system: systemPrompt,
        messages: [{ role: 'user', content: userMessage }],
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[AI] Anthropic API error:', errorText);
      return NextResponse.json(
        { error: 'AI service unavailable' },
        { status: 502 }
      );
    }

    // Transform the SSE stream from Anthropic into a simple text stream
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    const stream = new ReadableStream({
      async start(controller) {
        const reader = response.body?.getReader();
        if (!reader) {
          controller.close();
          return;
        }

        let buffer = '';

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
              if (!line.startsWith('data: ')) continue;
              const data = line.slice(6).trim();
              if (data === '[DONE]') continue;

              try {
                const parsed = JSON.parse(data);
                if (
                  parsed.type === 'content_block_delta' &&
                  parsed.delta?.text
                ) {
                  controller.enqueue(encoder.encode(parsed.delta.text));
                }
              } catch {
                // Skip malformed JSON
              }
            }
          }
        } catch (e) {
          console.error('[AI] Stream error:', e);
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (error) {
    console.error('[AI] Route error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
