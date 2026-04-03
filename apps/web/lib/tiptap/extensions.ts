import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextStyle from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import Highlight from '@tiptap/extension-highlight';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Table from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import Placeholder from '@tiptap/extension-placeholder';
import CharacterCount from '@tiptap/extension-character-count';
import Typography from '@tiptap/extension-typography';
import TextAlign from '@tiptap/extension-text-align';
import Focus from '@tiptap/extension-focus';
import Dropcursor from '@tiptap/extension-dropcursor';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import HorizontalRule from '@tiptap/extension-horizontal-rule';
import Mention from '@tiptap/extension-mention';
import { common, createLowlight } from 'lowlight';
import { Callout } from '@/components/editor/extensions/Callout';
import { FontFamily } from '@/components/editor/extensions/FontFamily';
import { FontSize } from '@/components/editor/extensions/FontSize';
import { Superscript } from '@/components/editor/extensions/Superscript';
import { Subscript } from '@/components/editor/extensions/Subscript';
import { SmallCaps } from '@/components/editor/extensions/SmallCaps';
import { AllCaps } from '@/components/editor/extensions/AllCaps';
import { LineSpacing } from '@/components/editor/extensions/LineSpacing';
import { PageBreak } from '@/components/editor/extensions/PageBreak';
import { SectionBreak } from '@/components/editor/extensions/SectionBreak';
import { TableOfContents } from '@/components/editor/extensions/TableOfContents';
import { TrackedInsert, TrackedDelete, TrackedFormat } from '@/components/editor/extensions/TrackChanges';

const lowlight = createLowlight(common);

export function getExtensions({
  placeholder = "Press '/' for commands, or start typing...",
}: {
  placeholder?: string;
} = {}) {
  return [
    StarterKit.configure({
      codeBlock: false, // replaced by CodeBlockLowlight
      dropcursor: false, // use our own config
      horizontalRule: false, // use our own config
      heading: {
        levels: [1, 2, 3],
      },
    }),
    Underline,
    TextStyle,
    Color,
    Highlight.configure({
      multicolor: true,
    }),
    Link.configure({
      openOnClick: false,
      HTMLAttributes: {
        rel: 'noopener noreferrer',
        target: '_blank',
      },
    }),
    Image.configure({
      allowBase64: false,
      HTMLAttributes: {
        class: 'editor-image',
      },
    }),
    Table.configure({
      resizable: true,
      HTMLAttributes: {
        class: 'editor-table',
      },
    }),
    TableRow,
    TableCell,
    TableHeader,
    TaskList.configure({
      HTMLAttributes: {
        class: 'task-list',
      },
    }),
    TaskItem.configure({
      nested: true,
    }),
    Placeholder.configure({
      placeholder: ({ node }) => {
        if (node.type.name === 'heading') {
          const level = node.attrs.level;
          return `Heading ${level}`;
        }
        return placeholder;
      },
    }),
    CharacterCount,
    Typography,
    TextAlign.configure({
      types: ['heading', 'paragraph', 'image'],
    }),
    Focus.configure({
      className: 'has-focus',
      mode: 'all',
    }),
    Dropcursor.configure({
      color: 'var(--brand-primary)',
      width: 2,
    }),
    CodeBlockLowlight.configure({
      lowlight,
      HTMLAttributes: {
        class: 'code-block',
      },
    }),
    HorizontalRule,
    Mention.configure({
      HTMLAttributes: {
        class: 'mention',
      },
    }),
    Callout,
    // Phase B extensions
    FontFamily,
    FontSize,
    Superscript,
    Subscript,
    SmallCaps,
    AllCaps,
    LineSpacing,
    // Phase C/D extensions
    PageBreak,
    SectionBreak,
    TableOfContents,
    TrackedInsert,
    TrackedDelete,
    TrackedFormat,
  ];
}

