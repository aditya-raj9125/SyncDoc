'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';
import { FolderIcon, Check } from 'lucide-react';
import type { Folder } from '@syncdoc/types';

interface MoveToFolderModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  documentId: string;
  workspaceId: string;
  currentFolderId?: string | null;
  onMoved?: () => void;
}

export function MoveToFolderModal({
  open,
  onOpenChange,
  documentId,
  workspaceId,
  currentFolderId,
  onMoved,
}: MoveToFolderModalProps) {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(currentFolderId || null);
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    if (!open) return;
    loadFolders();
  }, [open]);

  async function loadFolders() {
    const { data } = await supabase
      .from('folders')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('name');
    if (data) setFolders(data);
  }

  async function handleMove() {
    setLoading(true);
    const { error } = await supabase
      .from('documents')
      .update({ folder_id: selectedFolderId })
      .eq('id', documentId);

    setLoading(false);
    if (!error) {
      onMoved?.();
      onOpenChange(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50" onClick={() => onOpenChange(false)}>
      <div
        className="w-[360px] rounded-[var(--radius-lg)] bg-[var(--bg-surface)] border border-[var(--bg-border)] shadow-2xl p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold mb-4">Move to folder</h2>

        <div className="max-h-[300px] overflow-y-auto space-y-1">
          {/* Root option */}
          <button
            onClick={() => setSelectedFolderId(null)}
            className={`flex items-center gap-2 w-full rounded-[var(--radius-md)] px-3 py-2 text-sm text-left transition-colors ${
              selectedFolderId === null
                ? 'bg-[var(--brand-primary)] text-white'
                : 'hover:bg-[var(--bg-elevated)] text-[var(--text-primary)]'
            }`}
          >
            <FolderIcon size={14} />
            Root (no folder)
            {selectedFolderId === null && <Check size={14} className="ml-auto" />}
          </button>

          {folders.map((folder) => (
            <button
              key={folder.id}
              onClick={() => setSelectedFolderId(folder.id)}
              className={`flex items-center gap-2 w-full rounded-[var(--radius-md)] px-3 py-2 text-sm text-left transition-colors ${
                selectedFolderId === folder.id
                  ? 'bg-[var(--brand-primary)] text-white'
                  : 'hover:bg-[var(--bg-elevated)] text-[var(--text-primary)]'
              }`}
            >
              <FolderIcon size={14} />
              {folder.name}
              {selectedFolderId === folder.id && <Check size={14} className="ml-auto" />}
            </button>
          ))}

          {folders.length === 0 && (
            <p className="text-sm text-[var(--text-tertiary)] py-4 text-center">
              No folders yet. Create one from the sidebar first.
            </p>
          )}
        </div>

        <div className="flex justify-end gap-2 mt-4">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleMove} disabled={loading}>
            {loading ? 'Moving...' : 'Move'}
          </Button>
        </div>
      </div>
    </div>
  );
}
