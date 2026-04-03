/**
 * DOCX Export Utility
 *
 * Converts a ProseMirror/Tiptap JSON document to a .docx file using the
 * `docx` npm package. Preserves:
 * - Page size/margins
 * - Font family, font size per text run
 * - Bold, italic, underline, strikethrough, superscript, subscript
 * - Text color, highlight
 * - Line spacing, paragraph spacing
 * - Headings (H1-H3)
 * - Bullet/numbered lists
 * - Tables (basic)
 * - Page breaks, section breaks
 */

import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  PageBreak,
  Table as DocxTable,
  TableRow as DocxTableRow,
  TableCell as DocxTableCell,
  WidthType,
  BorderStyle,
  LevelFormat,
  convertInchesToTwip,
} from 'docx';

interface ExportOptions {
  title?: string;
  author?: string;
  pageSize?: { width: number; height: number }; // in mm
  margins?: { top: number; right: number; bottom: number; left: number }; // in mm
}

function mmToTwip(mm: number): number {
  return Math.round((mm / 25.4) * 1440);
}

function processTextRunMarks(
  text: string,
  marks: Array<{ type: string; attrs?: Record<string, unknown> }> = []
): TextRun {
  const runOptions: Record<string, unknown> = { text };

  for (const mark of marks) {
    switch (mark.type) {
      case 'bold':
        runOptions.bold = true;
        break;
      case 'italic':
        runOptions.italics = true;
        break;
      case 'underline':
        runOptions.underline = { type: 'single' };
        break;
      case 'strike':
        runOptions.strike = true;
        break;
      case 'superscript':
        runOptions.superScript = true;
        break;
      case 'subscript':
        runOptions.subScript = true;
        break;
      case 'fontFamily':
        if (mark.attrs?.fontFamily) {
          runOptions.font = String(mark.attrs.fontFamily).replace(/['"]/g, '').split(',')[0].trim();
        }
        break;
      case 'fontSize':
        if (mark.attrs?.fontSize) {
          const px = parseInt(String(mark.attrs.fontSize));
          runOptions.size = Math.round(px * 0.75 * 2); // px → pt → half-pt
        }
        break;
      case 'color':
        if (mark.attrs?.color) {
          runOptions.color = String(mark.attrs.color).replace('#', '');
        }
        break;
      case 'highlight':
        if (mark.attrs?.color) {
          runOptions.highlight = 'yellow';
        }
        break;
      case 'smallCaps':
        runOptions.smallCaps = true;
        break;
      case 'allCaps':
        runOptions.allCaps = true;
        break;
    }
  }

  return new TextRun(runOptions as any);
}

function processNode(
  node: Record<string, unknown>,
  options: ExportOptions
): (Paragraph | DocxTable)[] {
  const type = node.type as string;
  const attrs = (node.attrs as Record<string, unknown>) || {};
  const content = (node.content as Record<string, unknown>[]) || [];

  switch (type) {
    case 'paragraph': {
      const children = content
        .filter((c) => c.type === 'text')
        .map((c) => processTextRunMarks(c.text as string, c.marks as any));

      const alignment =
        attrs.textAlign === 'center' ? AlignmentType.CENTER
        : attrs.textAlign === 'right' ? AlignmentType.RIGHT
        : attrs.textAlign === 'justify' ? AlignmentType.JUSTIFIED
        : AlignmentType.LEFT;

      return [
        new Paragraph({
          children: children.length ? children : [new TextRun('')],
          alignment,
          spacing: {
            line: Math.round(((attrs.lineSpacing as number) || 1.15) * 240),
            before: ((attrs.spaceBefore as number) || 0) * 20,
            after: ((attrs.spaceAfter as number) || 8) * 20,
          },
        }),
      ];
    }

    case 'heading': {
      const level = (attrs.level as number) || 1;
      const headingLevel = level === 1 ? HeadingLevel.HEADING_1 : level === 2 ? HeadingLevel.HEADING_2 : HeadingLevel.HEADING_3;
      const children = content
        .filter((c) => c.type === 'text')
        .map((c) => processTextRunMarks(c.text as string, c.marks as any));

      return [new Paragraph({ children: children.length ? children : [new TextRun('')], heading: headingLevel })];
    }

    case 'bulletList':
    case 'orderedList': {
      const isBullet = type === 'bulletList';
      const items: Paragraph[] = [];
      for (const item of content) {
        if ((item.type as string) === 'listItem') {
          const itemContent = (item.content as Record<string, unknown>[]) || [];
          for (const p of itemContent) {
            if ((p.type as string) === 'paragraph') {
              const pContent = (p.content as Record<string, unknown>[]) || [];
              const runs = pContent
                .filter((c) => c.type === 'text')
                .map((c) => processTextRunMarks(c.text as string, c.marks as any));
              items.push(
                new Paragraph({
                  children: runs,
                  bullet: isBullet ? { level: 0 } : undefined,
                  numbering: !isBullet ? { reference: 'default-numbering', level: 0 } : undefined,
                })
              );
            }
          }
        }
      }
      return items;
    }

    case 'blockquote': {
      const results: (Paragraph | DocxTable)[] = [];
      for (const child of content) {
        results.push(...processNode(child, options));
      }
      return results;
    }

    case 'codeBlock': {
      const text = content.filter((c) => c.type === 'text').map((c) => c.text as string).join('\n');
      return [new Paragraph({ children: [new TextRun({ text, font: 'Courier New', size: 20 })], spacing: { before: 120, after: 120 } })];
    }

    case 'table': {
      const rows = content
        .filter((r) => (r.type as string) === 'tableRow')
        .map((row) => {
          const cells = ((row.content as Record<string, unknown>[]) || [])
            .filter((c) => (c.type as string) === 'tableCell' || (c.type as string) === 'tableHeader')
            .map((cell) => {
              const cellContent = (cell.content as Record<string, unknown>[]) || [];
              const paragraphs = cellContent.flatMap((p) => processNode(p, options));
              return new DocxTableCell({
                children: paragraphs.length ? (paragraphs as Paragraph[]) : [new Paragraph({})],
                width: { size: 0, type: WidthType.AUTO },
              });
            });
          return new DocxTableRow({ children: cells });
        });
      if (rows.length === 0) return [];
      return [new DocxTable({ rows, width: { size: 100, type: WidthType.PERCENTAGE } })];
    }

    case 'horizontalRule':
      return [new Paragraph({ border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: '999999' } }, spacing: { before: 200, after: 200 } })];

    case 'pageBreak':
      return [new Paragraph({ children: [new PageBreak()] })];

    case 'sectionBreak':
      return [new Paragraph({ children: [new PageBreak()] })];

    default:
      return content.flatMap((c) => processNode(c, options));
  }
}

export async function exportToDocx(doc: Record<string, unknown>, options: ExportOptions = {}): Promise<Blob> {
  const content = (doc.content as Record<string, unknown>[]) || [];
  const paragraphs = content.flatMap((node) => processNode(node, options));

  const pageWidth = options.pageSize?.width || 210;
  const pageHeight = options.pageSize?.height || 297;
  const margins = options.margins || { top: 25, right: 20, bottom: 25, left: 20 };

  const document = new Document({
    creator: options.author || 'SyncDoc',
    title: options.title || 'Untitled',
    sections: [
      {
        properties: {
          page: {
            size: { width: mmToTwip(pageWidth), height: mmToTwip(pageHeight) },
            margin: { top: mmToTwip(margins.top), right: mmToTwip(margins.right), bottom: mmToTwip(margins.bottom), left: mmToTwip(margins.left) },
          },
        },
        children: paragraphs as Paragraph[],
      },
    ],
    numbering: {
      config: [{ reference: 'default-numbering', levels: [{ level: 0, format: LevelFormat.DECIMAL, text: '%1.', alignment: AlignmentType.START }] }],
    },
  });

  return await Packer.toBlob(document);
}

export function downloadDocx(blob: Blob, filename: string = 'document.docx') {
  const url = URL.createObjectURL(blob);
  const a = window.document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
