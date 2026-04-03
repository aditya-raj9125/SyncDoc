import { Extension } from '@tiptap/core';

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    lineSpacing: {
      setLineSpacing: (spacing: number) => ReturnType;
      setSpaceBefore: (pt: number) => ReturnType;
      setSpaceAfter: (pt: number) => ReturnType;
    };
  }
}

export const LineSpacing = Extension.create({
  name: 'lineSpacing',

  addGlobalAttributes() {
    return [
      {
        types: ['paragraph', 'heading'],
        attributes: {
          lineSpacing: {
            default: 1.15,
            parseHTML: (element) => {
              const lh = element.style.lineHeight;
              return lh ? parseFloat(lh) : 1.15;
            },
            renderHTML: (attributes) => {
              if (attributes.lineSpacing === 1.15) return {};
              return { style: `line-height: ${attributes.lineSpacing}` };
            },
          },
          spaceBefore: {
            default: 0,
            parseHTML: (element) => {
              const mt = element.style.marginTop;
              return mt ? parseInt(mt) : 0;
            },
            renderHTML: (attributes) => {
              if (!attributes.spaceBefore) return {};
              return { style: `margin-top: ${attributes.spaceBefore}pt` };
            },
          },
          spaceAfter: {
            default: 8,
            parseHTML: (element) => {
              const mb = element.style.marginBottom;
              return mb ? parseInt(mb) : 8;
            },
            renderHTML: (attributes) => {
              if (attributes.spaceAfter === 8) return {};
              return { style: `margin-bottom: ${attributes.spaceAfter}pt` };
            },
          },
        },
      },
    ];
  },

  addCommands() {
    return {
      setLineSpacing:
        (spacing: number) =>
        ({ tr, state, dispatch }) => {
          const { from, to } = state.selection;
          state.doc.nodesBetween(from, to, (node, pos) => {
            if (node.type.name === 'paragraph' || node.type.name === 'heading') {
              if (dispatch) {
                tr.setNodeMarkup(pos, undefined, {
                  ...node.attrs,
                  lineSpacing: spacing,
                });
              }
            }
          });
          return true;
        },
      setSpaceBefore:
        (pt: number) =>
        ({ tr, state, dispatch }) => {
          const { from, to } = state.selection;
          state.doc.nodesBetween(from, to, (node, pos) => {
            if (node.type.name === 'paragraph' || node.type.name === 'heading') {
              if (dispatch) {
                tr.setNodeMarkup(pos, undefined, {
                  ...node.attrs,
                  spaceBefore: pt,
                });
              }
            }
          });
          return true;
        },
      setSpaceAfter:
        (pt: number) =>
        ({ tr, state, dispatch }) => {
          const { from, to } = state.selection;
          state.doc.nodesBetween(from, to, (node, pos) => {
            if (node.type.name === 'paragraph' || node.type.name === 'heading') {
              if (dispatch) {
                tr.setNodeMarkup(pos, undefined, {
                  ...node.attrs,
                  spaceAfter: pt,
                });
              }
            }
          });
          return true;
        },
    };
  },
});
