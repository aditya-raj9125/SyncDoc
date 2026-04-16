/**
 * FIX 6 — PDF Export (Production-grade)
 *
 * Accepts the Tiptap editor instance + document title.
 * Uses html2canvas at 2x for crisp capture, then jsPDF with
 * correct A4 page slicing — immune to the content-clipping bug.
 *
 * Guard: never called server-side.
 */

export async function exportToPdf(editorElement: HTMLElement, title: string): Promise<void> {
  if (typeof window === 'undefined') return;

  const { default: jsPDF } = await import('jspdf');
  const { default: html2canvas } = await import('html2canvas');

  // A4 dimensions in mm
  const A4_WIDTH_MM = 210;
  const A4_HEIGHT_MM = 297;
  const MARGIN_MM = 20;

  // Capture at 2x pixel ratio for crisp output
  const canvas = await html2canvas(editorElement, {
    scale: 2,
    useCORS: true,
    logging: false,
    backgroundColor: '#ffffff',
    // Capture full scrollable height
    windowWidth: editorElement.scrollWidth,
    windowHeight: editorElement.scrollHeight,
  });

  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const imgWidthMM = A4_WIDTH_MM - MARGIN_MM * 2;
  // Scale factor: how many canvas pixels per mm
  const pxPerMm = canvas.width / imgWidthMM;
  const pageHeightPx = (A4_HEIGHT_MM - MARGIN_MM * 2) * pxPerMm;
  const totalPages = Math.ceil(canvas.height / pageHeightPx);

  // Add title page header on first page
  pdf.setFontSize(20);
  pdf.setFont('helvetica', 'bold');
  pdf.text(title.slice(0, 80), MARGIN_MM, MARGIN_MM - 4);

  for (let page = 0; page < totalPages; page++) {
    if (page > 0) {
      pdf.addPage();
    }

    // Slice the canvas for this page
    const sliceCanvas = document.createElement('canvas');
    sliceCanvas.width = canvas.width;
    const sliceHeightPx = Math.min(pageHeightPx, canvas.height - page * pageHeightPx);
    sliceCanvas.height = sliceHeightPx;

    const ctx = sliceCanvas.getContext('2d');
    if (!ctx) continue;

    ctx.drawImage(
      canvas,
      0, page * pageHeightPx,           // source x, y
      canvas.width, sliceHeightPx,       // source width, height
      0, 0,                              // dest x, y
      canvas.width, sliceHeightPx        // dest width, height
    );

    const imgData = sliceCanvas.toDataURL('image/png');
    const sliceHeightMm = sliceHeightPx / pxPerMm;

    pdf.addImage(imgData, 'PNG', MARGIN_MM, MARGIN_MM, imgWidthMM, sliceHeightMm);
  }

  pdf.save(`${title || 'Untitled'}.pdf`);
}

/**
 * Legacy print-to-PDF fallback — used by the print menu item
 */
export function printToPdf(title: string, editorHtml: string): void {
  if (typeof window === 'undefined') return;

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
    @page { size: A4; margin: 2cm; }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Georgia', 'Times New Roman', serif;
      font-size: 12pt;
      line-height: 1.6;
      color: #1a1a1a;
      width: 100%;
    }
    h1 { font-size: 24pt; margin-bottom: 12pt; page-break-after: avoid; }
    h2 { font-size: 18pt; font-weight: bold; margin-top: 18pt; margin-bottom: 8pt; page-break-after: avoid; }
    h3 { font-size: 14pt; font-weight: bold; margin-top: 14pt; margin-bottom: 6pt; page-break-after: avoid; }
    p { margin-bottom: 8pt; orphans: 3; widows: 3; }
    ul, ol { padding-left: 24pt; margin-bottom: 8pt; }
    li { margin-bottom: 3pt; }
    img { max-width: 100%; height: auto; margin: 8pt 0; }
    table { width: 100%; border-collapse: collapse; margin: 10pt 0; page-break-inside: avoid; }
    th, td { border: 0.5pt solid #999; padding: 5pt 8pt; text-align: left; }
    th { background: #f0f0f0; font-weight: bold; }
    pre { background: #f5f5f5; padding: 10pt; font-family: monospace; font-size: 10pt; white-space: pre-wrap; page-break-inside: avoid; margin: 10pt 0; }
    blockquote { border-left: 2pt solid #ccc; padding-left: 12pt; color: #555; margin: 10pt 0; }
    a { color: #1a1a1a; text-decoration: underline; }
  </style>
</head>
<body>
  <h1>${escapeHtml(title)}</h1>
  ${editorHtml}
</body>
</html>`);

  printWindow.document.close();
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
