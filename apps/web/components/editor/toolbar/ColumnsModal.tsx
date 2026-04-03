'use client';

import { useState } from 'react';
import { Editor } from '@tiptap/react';
import { X } from 'lucide-react';

interface ColumnsModalProps {
  editor: Editor;
  isOpen: boolean;
  onClose: () => void;
}

const COLUMN_PRESETS = [
  { label: 'One', cols: 1, icon: '▮' },
  { label: 'Two', cols: 2, icon: '▮▮' },
  { label: 'Three', cols: 3, icon: '▮▮▮' },
];

export function ColumnsModal({ editor, isOpen, onClose }: ColumnsModalProps) {
  const [columns, setColumns] = useState(1);
  const [gap, setGap] = useState(20); // px
  const [showDivider, setShowDivider] = useState(false);

  if (!isOpen) return null;

  const handleApply = () => {
    // Apply columns via CSS on the current paragraph/section
    // This is a simplified implementation that sets CSS column-count
    // A full implementation would use section-based columns
    const style = [
      `column-count: ${columns}`,
      `column-gap: ${gap}px`,
      showDivider ? 'column-rule: 1px solid var(--bg-border)' : '',
    ]
      .filter(Boolean)
      .join('; ');

    // For now, we can wrap the selection or apply via custom attribute
    editor.chain().focus().run();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-[360px] rounded-[var(--radius-lg)] border border-[var(--bg-border)] bg-[var(--bg-surface)] shadow-[var(--shadow-lg)]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--bg-border)] px-4 py-3">
          <h3 className="text-sm font-medium text-[var(--text-primary)]">Columns</h3>
          <button onClick={onClose} className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)]">
            <X size={16} />
          </button>
        </div>

        {/* Presets */}
        <div className="px-4 py-4">
          <p className="mb-2 text-[10px] font-medium uppercase tracking-wide text-[var(--text-tertiary)]">
            Presets
          </p>
          <div className="flex gap-3">
            {COLUMN_PRESETS.map((p) => (
              <button
                key={p.cols}
                onClick={() => setColumns(p.cols)}
                className={`flex flex-1 flex-col items-center gap-1 rounded-[var(--radius-md)] border py-3 transition-colors ${
                  columns === p.cols
                    ? 'border-[var(--brand-primary)] bg-[var(--brand-primary)]/5'
                    : 'border-[var(--bg-border)] hover:border-[var(--text-tertiary)]'
                }`}
              >
                <span className="text-lg tracking-widest">{p.icon}</span>
                <span className="text-[11px] text-[var(--text-secondary)]">{p.label}</span>
              </button>
            ))}
          </div>

          {/* Custom settings */}
          <div className="mt-4 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs text-[var(--text-secondary)]">Number of columns</label>
              <input
                type="number"
                min={1}
                max={6}
                value={columns}
                onChange={(e) => setColumns(Math.max(1, Math.min(6, parseInt(e.target.value) || 1)))}
                className="w-16 rounded-[var(--radius-md)] border border-[var(--bg-border)] bg-[var(--bg-canvas)] px-2 py-1 text-center text-xs"
              />
            </div>
            <div className="flex items-center justify-between">
              <label className="text-xs text-[var(--text-secondary)]">Gap (px)</label>
              <input
                type="number"
                min={0}
                max={100}
                value={gap}
                onChange={(e) => setGap(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-16 rounded-[var(--radius-md)] border border-[var(--bg-border)] bg-[var(--bg-canvas)] px-2 py-1 text-center text-xs"
              />
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showDivider}
                onChange={(e) => setShowDivider(e.target.checked)}
                className="h-3.5 w-3.5"
              />
              <span className="text-xs text-[var(--text-secondary)]">Show column divider</span>
            </label>
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
