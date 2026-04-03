'use client';

import { useCallback, useState, useRef, useEffect, ReactNode } from 'react';
import { Editor } from '@tiptap/react';
import {
  Undo2, Redo2, Bold, Italic, Underline, Strikethrough,
  AlignLeft, AlignCenter, AlignRight, AlignJustify,
  List, ListOrdered, Indent, Outdent,
  Type, Paintbrush, ChevronDown, TableIcon, ImageIcon,
  Link2, SplitSquareHorizontal, PilcrowSquare,
  Eye, Settings2, FileText,
} from 'lucide-react';

interface FormattingToolbarProps {
  editor: Editor | null;
  visible?: boolean;
}

interface ToolbarButtonProps {
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  title?: string;
  children: ReactNode;
}

function ToolbarButton({ onClick, active, disabled, title, children }: ToolbarButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`flex h-7 w-7 items-center justify-center rounded transition-colors ${
        active
          ? 'bg-[var(--bg-elevated)] border border-[var(--bg-border)]'
          : 'hover:bg-[var(--bg-elevated)]'
      } ${disabled ? 'opacity-30 cursor-not-allowed' : ''}`}
    >
      {children}
    </button>
  );
}

function ToolbarSeparator() {
  return <div className="mx-1 h-5 w-px bg-[var(--bg-border)]" />;
}

interface DropdownProps {
  trigger: ReactNode;
  children: ReactNode;
  width?: number;
}

function ToolbarDropdown({ trigger, children, width = 180 }: DropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex h-7 items-center gap-1 rounded px-1.5 text-xs text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)]"
      >
        {trigger}
        <ChevronDown size={10} />
      </button>
      {open && (
        <div
          className="absolute left-0 top-full z-50 mt-1 rounded-[var(--radius-lg)] border border-[var(--bg-border)] bg-[var(--bg-surface)] py-1 shadow-[var(--shadow-lg)]"
          style={{ width }}
          onClick={() => setOpen(false)}
        >
          {children}
        </div>
      )}
    </div>
  );
}

function DropdownItem({ onClick, active, children }: { onClick?: () => void; active?: boolean; children: ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center px-3 py-1.5 text-xs text-left hover:bg-[var(--bg-elevated)] ${
        active ? 'text-[var(--brand-primary)] font-medium' : 'text-[var(--text-primary)]'
      }`}
    >
      {children}
    </button>
  );
}

function DropdownSeparator() {
  return <div className="my-1 h-px bg-[var(--bg-border)]" />;
}

const FONT_FAMILIES = [
  { label: 'Geist', value: 'Geist, sans-serif' },
  { label: 'Instrument Serif', value: "'Instrument Serif', serif" },
  { label: 'Georgia', value: 'Georgia, serif' },
  { label: 'Times New Roman', value: "'Times New Roman', serif" },
  { label: 'Arial', value: 'Arial, sans-serif' },
  { label: 'Helvetica', value: 'Helvetica, sans-serif' },
  { label: 'Courier New', value: "'Courier New', monospace" },
  { label: 'Geist Mono', value: "'Geist Mono', monospace" },
];

const FONT_SIZES = [8, 9, 10, 11, 12, 14, 16, 18, 20, 24, 28, 32, 36, 48, 72];

const PARAGRAPH_STYLES = [
  { label: 'Normal text', value: 'paragraph', style: { fontSize: '14px' } },
  { label: 'Heading 1', value: 'heading-1', style: { fontSize: '22px', fontWeight: 600 } },
  { label: 'Heading 2', value: 'heading-2', style: { fontSize: '18px', fontWeight: 600 } },
  { label: 'Heading 3', value: 'heading-3', style: { fontSize: '16px', fontWeight: 600 } },
  { label: 'Quote', value: 'blockquote', style: { fontSize: '14px', fontStyle: 'italic' } },
  { label: 'Code block', value: 'codeBlock', style: { fontSize: '13px', fontFamily: 'monospace' } },
];

const LINE_SPACINGS = [
  { label: 'Single (1.0)', value: 1.0 },
  { label: '1.15', value: 1.15 },
  { label: '1.5', value: 1.5 },
  { label: 'Double (2.0)', value: 2.0 },
];

const TEXT_COLORS = [
  '#000000', '#434343', '#666666', '#999999', '#B7B7B7', '#CCCCCC', '#D9D9D9', '#EFEFEF', '#F3F3F3', '#FFFFFF',
  '#980000', '#FF0000', '#FF9900', '#FFFF00', '#00FF00', '#00FFFF', '#4A86E8', '#0000FF', '#9900FF', '#FF00FF',
  '#E6B8AF', '#F4CCCC', '#FCE5CD', '#FFF2CC', '#D9EAD3', '#D0E0E3', '#C9DAF8', '#CFE2F3', '#D9D2E9', '#EAD1DC',
  '#DD7E6B', '#EA9999', '#F9CB9C', '#FFE599', '#B6D7A8', '#A2C4C9', '#A4C2F4', '#9FC5E8', '#B4A7D6', '#D5A6BD',
];

const HIGHLIGHT_COLORS = [
  { name: 'Yellow', color: '#FFFF00' },
  { name: 'Green', color: '#00FF00' },
  { name: 'Cyan', color: '#00FFFF' },
  { name: 'Magenta', color: '#FF00FF' },
  { name: 'Blue', color: '#4A86E8' },
  { name: 'Red', color: '#FF0000' },
  { name: 'Dark Blue', color: '#0000FF' },
  { name: 'Teal', color: '#008080' },
  { name: 'Dark Green', color: '#006400' },
  { name: 'Dark Red', color: '#8B0000' },
  { name: 'Gray', color: '#808080' },
  { name: 'Light Gray', color: '#D3D3D3' },
  { name: 'Orange', color: '#FF9900' },
  { name: 'Pink', color: '#FF69B4' },
  { name: 'None', color: '' },
];

export function FormattingToolbar({ editor, visible = true }: FormattingToolbarProps) {
  const [fontSizeInput, setFontSizeInput] = useState('');

  if (!visible || !editor) return null;

  const getCurrentFontFamily = () => {
    const marks = editor.getAttributes('textStyle');
    return marks?.fontFamily || 'Geist, sans-serif';
  };

  const getCurrentFontLabel = () => {
    const current = getCurrentFontFamily();
    const found = FONT_FAMILIES.find(f => f.value === current);
    return found?.label || 'Geist';
  };

  const getCurrentStyle = () => {
    if (editor.isActive('heading', { level: 1 })) return 'Heading 1';
    if (editor.isActive('heading', { level: 2 })) return 'Heading 2';
    if (editor.isActive('heading', { level: 3 })) return 'Heading 3';
    if (editor.isActive('blockquote')) return 'Quote';
    if (editor.isActive('codeBlock')) return 'Code block';
    return 'Normal text';
  };

  const applyStyle = (style: string) => {
    switch (style) {
      case 'paragraph':
        editor.chain().focus().setParagraph().run();
        break;
      case 'heading-1':
        editor.chain().focus().toggleHeading({ level: 1 }).run();
        break;
      case 'heading-2':
        editor.chain().focus().toggleHeading({ level: 2 }).run();
        break;
      case 'heading-3':
        editor.chain().focus().toggleHeading({ level: 3 }).run();
        break;
      case 'blockquote':
        editor.chain().focus().toggleBlockquote().run();
        break;
      case 'codeBlock':
        editor.chain().focus().toggleCodeBlock().run();
        break;
    }
  };

  return (
    <div className="flex items-center gap-0.5 border-b border-[var(--bg-border)] bg-[var(--bg-surface)] px-2 py-1 overflow-x-auto"
      style={{ height: 40 }}
    >
      {/* Undo / Redo */}
      <ToolbarButton onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} title="Undo">
        <Undo2 size={15} />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} title="Redo">
        <Redo2 size={15} />
      </ToolbarButton>

      <ToolbarSeparator />

      {/* Paragraph styles */}
      <ToolbarDropdown trigger={<span className="max-w-[100px] truncate">{getCurrentStyle()}</span>} width={200}>
        {PARAGRAPH_STYLES.map((s) => (
          <DropdownItem
            key={s.value}
            onClick={() => applyStyle(s.value)}
            active={getCurrentStyle() === s.label}
          >
            <span style={s.style as React.CSSProperties}>{s.label}</span>
          </DropdownItem>
        ))}
      </ToolbarDropdown>

      <ToolbarSeparator />

      {/* Font family */}
      <ToolbarDropdown trigger={<span className="max-w-[100px] truncate text-[11px]">{getCurrentFontLabel()}</span>} width={220}>
        {FONT_FAMILIES.map((f) => (
          <DropdownItem
            key={f.value}
            onClick={() => editor.chain().focus().setMark('textStyle', { fontFamily: f.value }).run()}
          >
            <span style={{ fontFamily: f.value }}>{f.label}</span>
          </DropdownItem>
        ))}
      </ToolbarDropdown>

      {/* Font size */}
      <ToolbarDropdown trigger={<span className="text-[11px] min-w-[24px] text-center">17</span>} width={100}>
        {FONT_SIZES.map((s) => (
          <DropdownItem
            key={s}
            onClick={() => editor.chain().focus().setMark('textStyle', { fontSize: `${s}px` }).run()}
          >
            {s}
          </DropdownItem>
        ))}
      </ToolbarDropdown>

      <ToolbarSeparator />

      {/* Text formatting marks */}
      <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} title="Bold (Ctrl+B)">
        <Bold size={15} />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} title="Italic (Ctrl+I)">
        <Italic size={15} />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive('underline')} title="Underline (Ctrl+U)">
        <Underline size={15} />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive('strike')} title="Strikethrough">
        <Strikethrough size={15} />
      </ToolbarButton>

      <ToolbarSeparator />

      {/* Text color */}
      <ToolbarDropdown trigger={<span className="flex flex-col items-center"><Type size={14} /><div className="h-0.5 w-3.5 mt-0.5 bg-current" /></span>} width={240}>
        <div className="px-2 py-1">
          <p className="text-[10px] text-[var(--text-tertiary)] mb-1">Text color</p>
          <div className="grid grid-cols-10 gap-0.5">
            {TEXT_COLORS.map((c) => (
              <button
                key={c}
                onClick={() => editor.chain().focus().setColor(c).run()}
                className="h-5 w-5 rounded-sm border border-[var(--bg-border)] hover:scale-110 transition-transform"
                style={{ backgroundColor: c }}
                title={c}
              />
            ))}
          </div>
          <button
            onClick={() => editor.chain().focus().unsetColor().run()}
            className="mt-1.5 w-full text-[10px] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          >
            Automatic
          </button>
        </div>
      </ToolbarDropdown>

      {/* Highlight color */}
      <ToolbarDropdown trigger={<Paintbrush size={14} />} width={220}>
        <div className="px-2 py-1">
          <p className="text-[10px] text-[var(--text-tertiary)] mb-1">Highlight</p>
          <div className="grid grid-cols-5 gap-1">
            {HIGHLIGHT_COLORS.map((h) => (
              <button
                key={h.name}
                onClick={() => {
                  if (h.color) {
                    editor.chain().focus().setHighlight({ color: h.color }).run();
                  } else {
                    editor.chain().focus().unsetHighlight().run();
                  }
                }}
                className="h-6 rounded-sm border border-[var(--bg-border)] hover:scale-110 transition-transform flex items-center justify-center text-[8px]"
                style={{ backgroundColor: h.color || 'transparent' }}
                title={h.name}
              >
                {!h.color && '∅'}
              </button>
            ))}
          </div>
        </div>
      </ToolbarDropdown>

      <ToolbarSeparator />

      {/* Alignment */}
      <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('left').run()} active={editor.isActive({ textAlign: 'left' })} title="Align left">
        <AlignLeft size={15} />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('center').run()} active={editor.isActive({ textAlign: 'center' })} title="Center">
        <AlignCenter size={15} />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('right').run()} active={editor.isActive({ textAlign: 'right' })} title="Align right">
        <AlignRight size={15} />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('justify').run()} active={editor.isActive({ textAlign: 'justify' })} title="Justify">
        <AlignJustify size={15} />
      </ToolbarButton>

      <ToolbarSeparator />

      {/* Lists */}
      <ToolbarButton onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')} title="Bullet list">
        <List size={15} />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')} title="Numbered list">
        <ListOrdered size={15} />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().sinkListItem('listItem').run()} disabled={!editor.can().sinkListItem('listItem')} title="Increase indent">
        <Indent size={15} />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().liftListItem('listItem').run()} disabled={!editor.can().liftListItem('listItem')} title="Decrease indent">
        <Outdent size={15} />
      </ToolbarButton>

      <ToolbarSeparator />

      {/* Line spacing */}
      <ToolbarDropdown trigger={<span className="text-[10px]">↕</span>} width={180}>
        <p className="px-3 py-1 text-[10px] text-[var(--text-tertiary)]">Line spacing</p>
        {LINE_SPACINGS.map((s) => (
          <DropdownItem key={s.value} onClick={() => {
            // Line spacing is applied via CSS - this would use a custom extension
            editor.chain().focus().run();
          }}>
            {s.label}
          </DropdownItem>
        ))}
      </ToolbarDropdown>

      <ToolbarSeparator />

      {/* Insert menu */}
      <ToolbarDropdown trigger={<span className="text-[11px]">Insert</span>} width={200}>
        <DropdownItem onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}>
          <TableIcon size={14} className="mr-2" /> Table
        </DropdownItem>
        <DropdownItem onClick={() => {
          const url = window.prompt('Image URL:');
          if (url) editor.chain().focus().setImage({ src: url }).run();
        }}>
          <ImageIcon size={14} className="mr-2" /> Image
        </DropdownItem>
        <DropdownItem onClick={() => {
          const url = window.prompt('Link URL:');
          if (url) editor.chain().focus().setLink({ href: url }).run();
        }}>
          <Link2 size={14} className="mr-2" /> Link
        </DropdownItem>
        <DropdownSeparator />
        <DropdownItem onClick={() => editor.chain().focus().setHorizontalRule().run()}>
          <SplitSquareHorizontal size={14} className="mr-2" /> Horizontal rule
        </DropdownItem>
      </ToolbarDropdown>

      {/* Format menu */}
      <ToolbarDropdown trigger={<span className="text-[11px]">Format</span>} width={200}>
        <DropdownItem onClick={() => editor.chain().focus().toggleBold().run()}>Bold</DropdownItem>
        <DropdownItem onClick={() => editor.chain().focus().toggleItalic().run()}>Italic</DropdownItem>
        <DropdownItem onClick={() => editor.chain().focus().toggleUnderline().run()}>Underline</DropdownItem>
        <DropdownItem onClick={() => editor.chain().focus().toggleStrike().run()}>Strikethrough</DropdownItem>
        <DropdownSeparator />
        <DropdownItem onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()}>
          Clear formatting
        </DropdownItem>
      </ToolbarDropdown>

      {/* View menu */}
      <ToolbarDropdown trigger={<span className="text-[11px]">View</span>} width={200}>
        <DropdownItem active>Print layout</DropdownItem>
        <DropdownItem>Reading layout</DropdownItem>
        <DropdownItem>Focus mode</DropdownItem>
      </ToolbarDropdown>
    </div>
  );
}
