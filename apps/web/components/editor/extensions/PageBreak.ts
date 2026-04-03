import { Node, mergeAttributes } from '@tiptap/core';

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    pageBreak: {
      setPageBreak: () => ReturnType;
    };
  }
}

export const PageBreak = Node.create({
  name: 'pageBreak',
  group: 'block',
  atom: true,
  selectable: true,
  draggable: false,

  parseHTML() {
    return [
      { tag: 'div[data-page-break]' },
      {
        tag: 'hr',
        getAttrs: (el) =>
          (el as HTMLElement).classList.contains('page-break') ? {} : false,
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(HTMLAttributes, {
        'data-page-break': '',
        class: 'page-break',
        style:
          'border-top: 2px dashed var(--bg-border); margin: 24px 0; position: relative; page-break-after: always;',
      }),
      [
        'span',
        {
          style:
            'position: absolute; top: -10px; left: 50%; transform: translateX(-50%); background: var(--bg-canvas); padding: 0 8px; font-size: 10px; color: var(--text-tertiary); text-transform: uppercase; letter-spacing: 0.5px;',
        },
        'Page break',
      ],
    ];
  },

  addCommands() {
    return {
      setPageBreak:
        () =>
        ({ chain }) => {
          return chain()
            .insertContent({ type: this.name })
            .createParagraphNear()
            .focus()
            .run();
        },
    };
  },

  addKeyboardShortcuts() {
    return {
      'Mod-Enter': () => this.editor.commands.setPageBreak(),
    };
  },
});
