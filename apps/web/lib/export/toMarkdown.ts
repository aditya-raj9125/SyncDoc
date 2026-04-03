import type { JSONContent } from '@tiptap/react';

/**
 * Convert Tiptap JSON content to Markdown string
 */
export function toMarkdown(content: JSONContent): string {
  if (!content.content) return '';
  return content.content.map(nodeToMarkdown).join('\n\n');
}

function nodeToMarkdown(node: JSONContent): string {
  switch (node.type) {
    case 'paragraph':
      return inlineToMarkdown(node.content);

    case 'heading': {
      const level = node.attrs?.level || 1;
      const prefix = '#'.repeat(level);
      return `${prefix} ${inlineToMarkdown(node.content)}`;
    }

    case 'bulletList':
      return (node.content || [])
        .map((item) => `- ${inlineToMarkdown(item.content?.[0]?.content)}`)
        .join('\n');

    case 'orderedList':
      return (node.content || [])
        .map((item, i) => `${i + 1}. ${inlineToMarkdown(item.content?.[0]?.content)}`)
        .join('\n');

    case 'taskList':
      return (node.content || [])
        .map((item) => {
          const checked = item.attrs?.checked ? 'x' : ' ';
          return `- [${checked}] ${inlineToMarkdown(item.content?.[0]?.content)}`;
        })
        .join('\n');

    case 'blockquote':
      return (node.content || [])
        .map((child) => `> ${nodeToMarkdown(child)}`)
        .join('\n');

    case 'codeBlock': {
      const lang = node.attrs?.language || '';
      const code = node.content?.map((c) => c.text || '').join('') || '';
      return `\`\`\`${lang}\n${code}\n\`\`\``;
    }

    case 'horizontalRule':
      return '---';

    case 'image': {
      const alt = node.attrs?.alt || '';
      const src = node.attrs?.src || '';
      return `![${alt}](${src})`;
    }

    case 'table':
      return tableToMarkdown(node);

    case 'callout': {
      const variant = node.attrs?.variant || 'info';
      const inner = (node.content || []).map(nodeToMarkdown).join('\n');
      return `> **${variant.toUpperCase()}**: ${inner}`;
    }

    default:
      return inlineToMarkdown(node.content);
  }
}

function inlineToMarkdown(content?: JSONContent[]): string {
  if (!content) return '';
  return content
    .map((node) => {
      if (node.type === 'text') {
        let text = node.text || '';
        const marks = node.marks || [];
        for (const mark of marks) {
          switch (mark.type) {
            case 'bold':
              text = `**${text}**`;
              break;
            case 'italic':
              text = `*${text}*`;
              break;
            case 'strike':
              text = `~~${text}~~`;
              break;
            case 'code':
              text = `\`${text}\``;
              break;
            case 'link':
              text = `[${text}](${mark.attrs?.href || ''})`;
              break;
          }
        }
        return text;
      }
      if (node.type === 'hardBreak') return '\n';
      return '';
    })
    .join('');
}

function tableToMarkdown(table: JSONContent): string {
  const rows = table.content || [];
  if (rows.length === 0) return '';

  const lines: string[] = [];

  rows.forEach((row, rowIndex) => {
    const cells = (row.content || []).map((cell) =>
      inlineToMarkdown(cell.content?.[0]?.content)
    );
    lines.push(`| ${cells.join(' | ')} |`);

    // Add separator after header row
    if (rowIndex === 0) {
      lines.push(`| ${cells.map(() => '---').join(' | ')} |`);
    }
  });

  return lines.join('\n');
}

/**
 * Download markdown as a .md file
 */
export function downloadMarkdown(content: JSONContent, title: string) {
  const md = toMarkdown(content);
  const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
  downloadBlob(blob, `${sanitizeFilename(title)}.md`);
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function sanitizeFilename(name: string): string {
  return (name || 'untitled')
    .replace(/[^a-zA-Z0-9\s-_]/g, '')
    .replace(/\s+/g, '-')
    .slice(0, 200);
}
