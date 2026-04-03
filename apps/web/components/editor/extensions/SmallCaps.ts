import { Mark, mergeAttributes } from '@tiptap/core';

export const SmallCaps = Mark.create({
  name: 'smallCaps',

  parseHTML() {
    return [
      { style: 'font-variant', getAttrs: (v) => (v === 'small-caps' ? {} : false) },
      { style: 'font-variant-caps', getAttrs: (v) => (v === 'small-caps' ? {} : false) },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['span', mergeAttributes(HTMLAttributes, { style: 'font-variant: small-caps' }), 0];
  },
});
