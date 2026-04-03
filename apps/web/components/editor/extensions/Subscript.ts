import { Mark, mergeAttributes } from '@tiptap/core';

export const Subscript = Mark.create({
  name: 'subscript',

  excludes: 'superscript',

  parseHTML() {
    return [
      { tag: 'sub' },
      { style: 'vertical-align', getAttrs: (v) => (v === 'sub' ? {} : false) },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['sub', mergeAttributes(HTMLAttributes), 0];
  },

  addKeyboardShortcuts() {
    return {
      'Mod-,': () => this.editor.commands.toggleMark(this.name),
    };
  },
});
