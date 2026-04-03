import { Mark, mergeAttributes } from '@tiptap/core';

export const Superscript = Mark.create({
  name: 'superscript',

  excludes: 'subscript',

  parseHTML() {
    return [
      { tag: 'sup' },
      { style: 'vertical-align', getAttrs: (v) => (v === 'super' ? {} : false) },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['sup', mergeAttributes(HTMLAttributes), 0];
  },

  addKeyboardShortcuts() {
    return {
      'Mod-.': () => this.editor.commands.toggleMark(this.name),
    };
  },
});
