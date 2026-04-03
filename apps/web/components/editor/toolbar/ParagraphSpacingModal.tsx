'use client';

import { useState } from 'react';
import { Editor } from '@tiptap/react';
import { X } from 'lucide-react';

interface ParagraphSpacingModalProps {
  editor: Editor;
  isOpen: boolean;
  onClose: () => void;
}

const LINE_SPACING_OPTIONS = [
  { label: 'Single', value: 1.0 },
  { label: '1.15', value: 1.15 },
  { label: '1.5', value: 1.5 },
  { label: 'Double', value: 2.0 },
  { label: 'Custom', value: 0 },
];

export function ParagraphSpacingModal({ editor, isOpen, onClose }: ParagraphSpacingModalProps) {
  const [lineSpacing, setLineSpacing] = useState(1.15);
  const [customSpacing, setCustomSpacing] = useState(1.15);
  const [spaceBefore, setSpaceBefore] = useState(0);
  const [spaceAfter, setSpaceAfter] = useState(8);

  if (!isOpen) return null;

  const effectiveSpacing = lineSpacing === 0 ? customSpacing : lineSpacing;

  const handleApply = () => {
    // Apply to selection using the LineSpacing extension commands
    try {
      editor.chain().focus()
        .command(({ tr, state, dispatch }) => {
          const { from, to } = state.selection;
          state.doc.nodesBetween(from, to, (node, pos) => {
            if (node.type.name === 'paragraph' || node.type.name === 'heading') {
              if (dispatch) {
                tr.setNodeMarkup(pos, undefined, {
                  ...node.attrs,
                  lineSpacing: effectiveSpacing,
                  spaceBefore,
                  spaceAfter,
                });
              }
            }
          });
          return true;
        })
        .run();
    } catch {
      // Fallback: just close
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-[380px] rounded-[var(--radius-lg)] border border-[var(--bg-border)] bg-[var(--bg-surface)] shadow-[var(--shadow-lg)]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--bg-border)] px-4 py-3">
          <h3 className="text-sm font-medium text-[var(--text-primary)]">Paragraph Spacing</h3>
          <button onClick={onClose} className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)]">
            <X size={16} />
          </button>
        </div>

        <div className="px-4 py-4 space-y-4">
          {/* Line spacing */}
          <div>
            <p className="mb-2 text-xs font-medium text-[var(--text-secondary)]">Line spacing</p>
            <div className="flex flex-wrap gap-2">
              {LINE_SPACING_OPTIONS.map((opt) => (
                <button
                  key={opt.label}
                  onClick={() => setLineSpacing(opt.value)}
                  className={`rounded-[var(--radius-md)] border px-3 py-1.5 text-xs transition-colors ${
                    lineSpacing === opt.value
                      ? 'border-[var(--brand-primary)] bg-[var(--brand-primary)]/5 text-[var(--brand-primary)]'
                      : 'border-[var(--bg-border)] text-[var(--text-secondary)] hover:border-[var(--text-tertiary)]'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            {lineSpacing === 0 && (
              <input
                type="number"
                step={0.05}
                min={0.5}
                max={5}
                value={customSpacing}
                onChange={(e) => setCustomSpacing(parseFloat(e.target.value) || 1)}
                className="mt-2 w-20 rounded-[var(--radius-md)] border border-[var(--bg-border)] bg-[var(--bg-canvas)] px-2 py-1 text-center text-xs"
              />
            )}
          </div>

          {/* Space before */}
          <div className="flex items-center justify-between">
            <label className="text-xs text-[var(--text-secondary)]">Space before paragraph (pt)</label>
            <input
              type="number"
              min={0}
              max={200}
              value={spaceBefore}
              onChange={(e) => setSpaceBefore(Math.max(0, parseInt(e.target.value) || 0))}
              className="w-16 rounded-[var(--radius-md)] border border-[var(--bg-border)] bg-[var(--bg-canvas)] px-2 py-1 text-center text-xs"
            />
          </div>

          {/* Space after */}
          <div className="flex items-center justify-between">
            <label className="text-xs text-[var(--text-secondary)]">Space after paragraph (pt)</label>
            <input
              type="number"
              min={0}
              max={200}
              value={spaceAfter}
              onChange={(e) => setSpaceAfter(Math.max(0, parseInt(e.target.value) || 0))}
              className="w-16 rounded-[var(--radius-md)] border border-[var(--bg-border)] bg-[var(--bg-canvas)] px-2 py-1 text-center text-xs"
            />
          </div>

          {/* Preview */}
          <div className="rounded-[var(--radius-md)] border border-[var(--bg-border)] bg-[var(--bg-canvas)] p-3">
            <p className="mb-1 text-[10px] font-medium uppercase tracking-wide text-[var(--text-tertiary)]">Preview</p>
            <div
              style={{
                lineHeight: effectiveSpacing,
                marginTop: `${spaceBefore}pt`,
                marginBottom: `${spaceAfter}pt`,
              }}
            >
              <p className="text-xs text-[var(--text-secondary)]">
                The quick brown fox jumps over the lazy dog. This is a sample paragraph to preview your spacing settings.
              </p>
              <p className="text-xs text-[var(--text-secondary)]">
                A second paragraph follows immediately with the configured spacing applied between them.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 border-t border-[var(--bg-border)] px-4 py-3">
          <button
            onClick={onClose}
            className="rounded-[var(--radius-md)] px-3 py-1.5 text-xs text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)]"
          >
            Cancel
          </button>
          <button
            onClick={handleApply}
            className="rounded-[var(--radius-md)] bg-[var(--brand-primary)] px-4 py-1.5 text-xs text-white hover:bg-[var(--brand-primary-hover)]"
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
}
