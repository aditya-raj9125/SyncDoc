import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { html, title } = await req.json();

    if (!html) {
      return new Response(
        JSON.stringify({ error: 'HTML content is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build a complete HTML document for PDF rendering
    const fullHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${title || 'Document'}</title>
  <style>
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      line-height: 1.7;
      color: #1a1a1a;
      max-width: 800px;
      margin: 0 auto;
      padding: 40px 20px;
      font-size: 14px;
    }
    h1 { font-size: 28px; font-weight: 700; margin: 1.5em 0 0.5em; }
    h2 { font-size: 22px; font-weight: 600; margin: 1.3em 0 0.4em; }
    h3 { font-size: 18px; font-weight: 600; margin: 1.2em 0 0.3em; }
    p { margin: 0.5em 0; }
    code {
      background: #f3f4f6;
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 13px;
    }
    pre {
      background: #1e1e2e;
      color: #cdd6f4;
      padding: 16px;
      border-radius: 8px;
      overflow-x: auto;
    }
    blockquote {
      border-left: 3px solid #6366f1;
      padding-left: 16px;
      margin-left: 0;
      color: #6b7280;
    }
    table {
      border-collapse: collapse;
      width: 100%;
      margin: 1em 0;
    }
    th, td {
      border: 1px solid #e5e7eb;
      padding: 8px 12px;
      text-align: left;
    }
    th { background: #f9fafb; font-weight: 600; }
    img { max-width: 100%; border-radius: 8px; }
    ul, ol { padding-left: 24px; }
    li { margin: 0.3em 0; }
    .callout {
      padding: 12px 16px;
      border-radius: 8px;
      margin: 1em 0;
      border-left: 4px solid;
    }
    .callout-info { background: #eff6ff; border-left-color: #3b82f6; }
    .callout-warning { background: #fffbeb; border-left-color: #f59e0b; }
    .callout-error { background: #fef2f2; border-left-color: #ef4444; }
    .callout-success { background: #f0fdf4; border-left-color: #22c55e; }
    hr { border: none; border-top: 1px solid #e5e7eb; margin: 2em 0; }
  </style>
</head>
<body>
  ${html}
</body>
</html>`;

    // For Edge Function environments without Puppeteer, return the HTML
    // which can be converted client-side or via a dedicated PDF service.
    // In production, use a service like Browserless, Gotenberg, or a
    // container with Puppeteer.
    return new Response(
      JSON.stringify({
        html: fullHtml,
        message: 'PDF HTML generated. Use a PDF rendering service or client-side library.',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: 'Failed to generate PDF' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
