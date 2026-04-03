import { Node, mergeAttributes } from '@tiptap/core';

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    tableOfContents: {
      insertTableOfContents: () => ReturnType;
    };
  }
}

export const TableOfContents = Node.create({
  name: 'tableOfContents',
  group: 'block',
  atom: true,
  selectable: true,
  draggable: true,

  addAttributes() {
    return {
      depth: {
        default: 3,
      },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-toc]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(HTMLAttributes, {
        'data-toc': '',
        class: 'table-of-contents',
        style: `
          border: 1px solid var(--bg-border);
          border-radius: var(--radius-lg);
          padding: 16px 20px;
          margin: 16px 0;
          background: var(--bg-elevated);
        `.trim().replace(/\n/g, ''),
      }),
      [
        'div',
        { style: 'font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; color: var(--text-tertiary); margin-bottom: 8px;' },
        'Table of Contents',
      ],
      [
        'div',
        { style: 'font-size: 13px; color: var(--text-secondary); font-style: italic;' },
        'Auto-generated from document headings',
      ],
    ];
  },

  addCommands() {
    return {
      insertTableOfContents:
        () =>
        ({ chain }) => {
          return chain()
            .insertContent({ type: this.name })
            .focus()
            .run();
        },
    };
  },

  addNodeView() {
    return ({ node, editor }) => {
      const dom = document.createElement('div');
      dom.setAttribute('data-toc', '');
      dom.className = 'table-of-contents';
      Object.assign(dom.style, {
        border: '1px solid var(--bg-border)',
        borderRadius: 'var(--radius-lg)',
        padding: '16px 20px',
        margin: '16px 0',
        background: 'var(--bg-elevated)',
      });

      const renderTOC = () => {
        dom.innerHTML = '';

        // Header
        const header = document.createElement('div');
        header.textContent = 'Table of Contents';
        Object.assign(header.style, {
          fontSize: '12px',
          fontWeight: '600',
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
          color: 'var(--text-tertiary)',
          marginBottom: '10px',
        });
        dom.appendChild(header);

        // Scan headings
        const headings: { level: number; text: string; pos: number }[] = [];
        editor.state.doc.descendants((n, pos) => {
          if (n.type.name === 'heading' && n.attrs.level <= (node.attrs.depth || 3)) {
            headings.push({
              level: n.attrs.level,
              text: n.textContent,
              pos,
            });
          }
        });

        if (headings.length === 0) {
          const empty = document.createElement('div');
          empty.textContent = 'No headings found';
          Object.assign(empty.style, {
            fontSize: '13px',
            color: 'var(--text-tertiary)',
            fontStyle: 'italic',
          });
          dom.appendChild(empty);
          return;
        }

        headings.forEach((h) => {
          const item = document.createElement('div');
          Object.assign(item.style, {
            paddingLeft: `${(h.level - 1) * 16}px`,
            fontSize: '13px',
            lineHeight: '1.8',
            cursor: 'pointer',
            color: 'var(--text-secondary)',
          });
          item.textContent = h.text;
          item.addEventListener('mouseenter', () => {
            item.style.color = 'var(--brand-primary)';
          });
          item.addEventListener('mouseleave', () => {
            item.style.color = 'var(--text-secondary)';
          });
          item.addEventListener('click', () => {
            editor.commands.focus(h.pos + 1);
          });
          dom.appendChild(item);
        });
      };

      // Render on create and debounce updates
      renderTOC();
      let timeout: ReturnType<typeof setTimeout>;
      const onUpdate = () => {
        clearTimeout(timeout);
        timeout = setTimeout(renderTOC, 1500);
      };
      editor.on('update', onUpdate);

      return {
        dom,
        destroy: () => {
          editor.off('update', onUpdate);
          clearTimeout(timeout);
        },
      };
    };
  },
});
