import type { JSONContent } from '@tiptap/react';

/**
 * Generate a PDF by rendering HTML content in a print-optimized iframe
 * This approach avoids heavy dependencies like puppeteer on the client side
 */
export function downloadPdf(content: JSONContent, title: string, editorHtml: string) {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Please allow popups to export as PDF');
    return;
  }

  printWindow.document.write(`<!DOCTYPE html>
<html>
<head>
  <title>${escapeHtml(title)}</title>
  <style>
    @page { margin: 1in; size: letter; }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Georgia', 'Times New Roman', serif;
      font-size: 12pt;
      line-height: 1.6;
      color: #1a1a1a;
    }
    h1 { font-size: 24pt; margin-bottom: 12pt; page-break-after: avoid; }
    h2 { font-size: 18pt; font-weight: bold; margin-top: 18pt; margin-bottom: 8pt; page-break-after: avoid; }
    h3 { font-size: 14pt; font-weight: bold; margin-top: 14pt; margin-bottom: 6pt; page-break-after: avoid; }
    p { margin-bottom: 8pt; orphans: 3; widows: 3; }
    ul, ol { padding-left: 24pt; margin-bottom: 8pt; }
    li { margin-bottom: 3pt; }
    blockquote {
      border-left: 2pt solid #ccc;
      padding-left: 12pt;
      color: #555;
      margin: 10pt 0;
    }
    pre {
      background: #f5f5f5;
      padding: 10pt;
      font-family: 'Courier New', monospace;
      font-size: 10pt;
      white-space: pre-wrap;
      page-break-inside: avoid;
      margin: 10pt 0;
    }
    code {
      font-family: 'Courier New', monospace;
      font-size: 0.9em;
      background: #f5f5f5;
      padding: 1pt 3pt;
    }
    pre code { background: none; padding: 0; }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 10pt 0;
      page-break-inside: avoid;
    }
    th, td {
      border: 0.5pt solid #999;
      padding: 5pt 8pt;
      text-align: left;
    }
    th { background: #f0f0f0; font-weight: bold; }
    img { max-width: 100%; height: auto; margin: 8pt 0; }
    hr { border: none; border-top: 0.5pt solid #ccc; margin: 14pt 0; }
    a { color: #1a1a1a; text-decoration: underline; }
  </style>
</head>
<body>
  <h1>${escapeHtml(title)}</h1>
  ${editorHtml}
</body>
</html>`);

  printWindow.document.close();

  // Wait for content to render, then trigger print
  setTimeout(() => {
    printWindow.print();
    printWindow.close();
  }, 500);
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
