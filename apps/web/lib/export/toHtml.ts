import type { Editor } from '@tiptap/react';

/**
 * Export editor content as a standalone HTML file with embedded CSS
 */
export function downloadHtml(editor: Editor, title: string) {
  const html = editor.getHTML();

  const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
      font-size: 17px;
      line-height: 1.75;
      color: #1C1917;
      background: #FAFAF9;
      max-width: 720px;
      margin: 0 auto;
      padding: 48px 24px;
    }
    h1 { font-size: 36px; line-height: 1.2; margin-bottom: 16px; }
    h2 { font-size: 24px; font-weight: 600; margin-top: 32px; margin-bottom: 12px; }
    h3 { font-size: 18px; font-weight: 600; margin-top: 24px; margin-bottom: 8px; }
    p { margin-bottom: 12px; }
    ul, ol { padding-left: 24px; margin-bottom: 12px; }
    li { margin-bottom: 4px; }
    blockquote {
      border-left: 3px solid #E7E5E4;
      padding-left: 16px;
      color: #78716C;
      margin: 16px 0;
    }
    pre {
      background: #F5F5F4;
      border-radius: 8px;
      padding: 16px;
      overflow-x: auto;
      margin: 16px 0;
      font-family: 'Courier New', monospace;
      font-size: 14px;
    }
    code {
      background: #F5F5F4;
      padding: 2px 6px;
      border-radius: 4px;
      font-family: 'Courier New', monospace;
      font-size: 0.9em;
    }
    pre code { background: none; padding: 0; }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 16px 0;
    }
    th, td {
      border: 1px solid #E7E5E4;
      padding: 8px 12px;
      text-align: left;
    }
    th { background: #F5F5F4; font-weight: 600; }
    img { max-width: 100%; height: auto; border-radius: 8px; margin: 16px 0; }
    a { color: #6366F1; text-decoration: underline; }
    hr { border: none; border-top: 1px solid #E7E5E4; margin: 24px 0; }
    .task-list { list-style: none; padding-left: 0; }
    .task-list li { display: flex; align-items: flex-start; gap: 8px; }
    .task-list input[type="checkbox"] { margin-top: 6px; }
  </style>
</head>
<body>
  ${html}
</body>
</html>`;

  const blob = new Blob([fullHtml], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${sanitizeFilename(title)}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Trigger the browser print dialog
 */
export function printDocument() {
  window.print();
}

function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function sanitizeFilename(name: string): string {
  return (name || 'untitled')
    .replace(/[^a-zA-Z0-9\s-_]/g, '')
    .replace(/\s+/g, '-')
    .slice(0, 200);
}
