/**
 * Streaming AI response handler
 * Reads a plain text stream from the AI API and yields tokens
 */

export async function* streamAiResponse(
  prompt: string,
  documentContext?: string,
  action?: string,
  signal?: AbortSignal
): AsyncGenerator<string, void, unknown> {
  const response = await fetch('/api/ai/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, documentContext, action }),
    signal,
  });

  if (!response.ok) {
    throw new Error(`AI request failed: ${response.status}`);
  }

  const reader = response.body?.getReader();
  if (!reader) throw new Error('No response body');

  const decoder = new TextDecoder();

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      yield decoder.decode(value, { stream: true });
    }
  } finally {
    reader.releaseLock();
  }
}

/**
 * Collect a full streaming response into a single string
 */
export async function getAiResponse(
  prompt: string,
  documentContext?: string,
  action?: string,
  signal?: AbortSignal
): Promise<string> {
  let result = '';
  for await (const token of streamAiResponse(prompt, documentContext, action, signal)) {
    result += token;
  }
  return result;
}
