// ProseMirror schema helpers and utilities for SyncDoc
// Used alongside Tiptap's built-in schema for custom node resolution

import { Schema, type NodeSpec, type MarkSpec, type Node as ProsemirrorNode } from 'prosemirror-model';

/**
 * Custom node specs that extend the base Tiptap schema.
 * Used for advanced features like callouts and AI blocks.
 */
export const customNodes: Record<string, NodeSpec> = {
  callout: {
    group: 'block',
    content: 'block+',
    attrs: {
      type: { default: 'info' },
    },
    parseDOM: [
      {
        tag: 'div[data-callout]',
        getAttrs: (dom: string | HTMLElement) => ({
          type: (dom as HTMLElement).getAttribute('data-callout') || 'info',
        }),
      },
    ],
    toDOM(node: ProsemirrorNode) {
      return [
        'div',
        {
          'data-callout': node.attrs.type,
          class: `callout callout-${node.attrs.type}`,
        },
        0,
      ];
    },
  },
};

/**
 * Convert a Tiptap JSON document to plain text.
 */
export function documentToPlainText(doc: Record<string, unknown>): string {
  const content = doc.content as Array<Record<string, unknown>> | undefined;
  if (!content) return '';

  return content
    .map((node) => nodeToText(node))
    .filter(Boolean)
    .join('\n\n');
}

function nodeToText(node: Record<string, unknown>): string {
  if (node.type === 'text') {
    return (node.text as string) || '';
  }

  const content = node.content as Array<Record<string, unknown>> | undefined;
  if (!content) return '';

  const text = content.map((child) => nodeToText(child)).join('');

  switch (node.type) {
    case 'heading':
      return text;
    case 'paragraph':
      return text;
    case 'bulletList':
    case 'orderedList':
      return text;
    case 'listItem':
      return `• ${text}`;
    case 'blockquote':
      return `> ${text}`;
    case 'codeBlock':
      return `\`\`\`\n${text}\n\`\`\``;
    case 'horizontalRule':
      return '---';
    default:
      return text;
  }
}

/**
 * Calculate document statistics from Tiptap JSON.
 */
export function getDocumentStats(doc: Record<string, unknown>) {
  const text = documentToPlainText(doc);
  const words = text.split(/\s+/).filter(Boolean).length;
  const characters = text.length;
  const readingTimeMinutes = Math.max(1, Math.ceil(words / 238));

  return { words, characters, readingTimeMinutes };
}
