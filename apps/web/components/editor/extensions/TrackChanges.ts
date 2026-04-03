import { Mark, mergeAttributes } from '@tiptap/core';

/**
 * Track Changes: TrackedInsert mark
 * Applied to newly inserted text during track changes mode.
 * Stores author info and timestamp for review.
 */
export const TrackedInsert = Mark.create({
  name: 'trackedInsert',

  addAttributes() {
    return {
      userId: { default: null },
      userName: { default: null },
      color: { default: '#4ade80' }, // green
      timestamp: { default: null },
    };
  },

  parseHTML() {
    return [{ tag: 'ins[data-tracked]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'ins',
      mergeAttributes(HTMLAttributes, {
        'data-tracked': '',
        style: `
          background-color: ${HTMLAttributes.color || '#4ade80'}22;
          border-bottom: 2px solid ${HTMLAttributes.color || '#4ade80'};
          text-decoration: none;
        `.trim().replace(/\n/g, ''),
      }),
      0,
    ];
  },
});

/**
 * Track Changes: TrackedDelete mark
 * Applied to text marked for deletion during track changes mode.
 */
export const TrackedDelete = Mark.create({
  name: 'trackedDelete',

  addAttributes() {
    return {
      userId: { default: null },
      userName: { default: null },
      color: { default: '#ef4444' }, // red
      timestamp: { default: null },
    };
  },

  parseHTML() {
    return [{ tag: 'del[data-tracked]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'del',
      mergeAttributes(HTMLAttributes, {
        'data-tracked': '',
        style: `
          background-color: ${HTMLAttributes.color || '#ef4444'}22;
          text-decoration: line-through;
          text-decoration-color: ${HTMLAttributes.color || '#ef4444'};
        `.trim().replace(/\n/g, ''),
      }),
      0,
    ];
  },
});

/**
 * Track Changes: TrackedFormat mark
 * Applied to text whose formatting was changed during track changes mode.
 */
export const TrackedFormat = Mark.create({
  name: 'trackedFormat',

  addAttributes() {
    return {
      userId: { default: null },
      userName: { default: null },
      color: { default: '#a78bfa' }, // purple
      timestamp: { default: null },
      formatChange: { default: null }, // e.g. "bold added"
    };
  },

  parseHTML() {
    return [{ tag: 'span[data-tracked-format]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'span',
      mergeAttributes(HTMLAttributes, {
        'data-tracked-format': '',
        style: `border-bottom: 2px dotted ${HTMLAttributes.color || '#a78bfa'};`,
        title: HTMLAttributes.formatChange || 'Format change',
      }),
      0,
    ];
  },
});
