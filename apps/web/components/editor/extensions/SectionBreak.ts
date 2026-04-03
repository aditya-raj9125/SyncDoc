import { Node, mergeAttributes } from '@tiptap/core';

export type SectionBreakType = 'continuous' | 'nextPage' | 'evenPage' | 'oddPage';

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    sectionBreak: {
      setSectionBreak: (type?: SectionBreakType) => ReturnType;
    };
  }
}

export const SectionBreak = Node.create({
  name: 'sectionBreak',
  group: 'block',
  atom: true,
  selectable: true,

  addAttributes() {
    return {
      breakType: { default: 'nextPage' as SectionBreakType },
      columns: { default: 1 },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-section-break]' }];
  },

  renderHTML({ node, HTMLAttributes }) {
    const breakType = node.attrs.breakType as SectionBreakType;
    const labels: Record<SectionBreakType, string> = {
      continuous: 'Section break (continuous)',
      nextPage: 'Section break (next page)',
      evenPage: 'Section break (even page)',
      oddPage: 'Section break (odd page)',
    };
    const label = labels[breakType] || 'Section break';

    return [
      'div',
      mergeAttributes(HTMLAttributes, {
        'data-section-break': node.attrs.breakType,
        class: 'section-break',
        style: `
          border-top: 1px dashed var(--text-tertiary);
          margin: 20px 0;
          position: relative;
          page-break-after: ${node.attrs.breakType === 'continuous' ? 'auto' : 'always'};
        `.trim().replace(/\n/g, ''),
      }),
      [
        'span',
        {
          style: 'position: absolute; top: -9px; left: 50%; transform: translateX(-50%); background: var(--bg-canvas); padding: 0 8px; font-size: 9px; color: var(--text-tertiary); text-transform: uppercase; letter-spacing: 0.3px;',
        },
        label,
      ],
    ];
  },

  addCommands() {
    return {
      setSectionBreak:
        (type: SectionBreakType = 'nextPage') =>
        ({ chain }) => {
          return chain()
            .insertContent({ type: this.name, attrs: { breakType: type } })
            .createParagraphNear()
            .focus()
            .run();
        },
    };
  },
});
