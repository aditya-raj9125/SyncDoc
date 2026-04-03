import { Mark, mergeAttributes } from '@tiptap/core';

export const AllCaps = Mark.create({
  name: 'allCaps',

  parseHTML() {
    return [
      { style: 'text-transform', getAttrs: (v) => (v === 'uppercase' ? {} : false) },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['span', mergeAttributes(HTMLAttributes, { style: 'text-transform: uppercase' }), 0];
  },
});
