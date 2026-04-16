'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ChevronRight,
  FolderIcon,
  FolderOpen,
  Plus,
  Pencil,
  Trash2,
  FileText,
  GripVertical,
  MoreHorizontal,
  Star,
  Copy,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import { Tooltip } from '@/components/ui/Tooltip';
import { Dropdown, DropdownTrigger, DropdownContent, DropdownItem, DropdownSeparator } from '@/components/ui/Dropdown';
import type { Folder, Document } from '@syncdoc/types';
import { motion, AnimatePresence } from 'framer-motion';

interface SidebarDoc {
  id: string;
  title: string;
  emoji_icon: string;
  folder_id: string | null;
}

interface DocumentTreeProps {
  folders: Folder[];
  documents: SidebarDoc[];
  basePath: string;
  workspaceId: string;
  onFoldersChange: (folders: Folder[]) => void;
  onDocumentsChange: (docs: SidebarDoc[]) => void;
  onMoveDocument: (docId: string, folderId: string | null) => void;
  onRemoveDocument: (docId: string) => void;
}

// ---- Root component ----
export function DocumentTree({
  folders,
  documents,
  basePath,
  workspaceId,
  onFoldersChange,
  onDocumentsChange,
  onMoveDocument,
  onRemoveDocument,
}: DocumentTreeProps) {
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  // Root-level folders
  const rootFolders = folders.filter((f) => !f.parent_folder_id);
  // Root-level docs (no folder)
  const rootDocs = documents.filter((d) => !d.folder_id);

  return (
    <div className="space-y-0.5">
      {/* Folders first */}
      {rootFolders.map((folder) => (
        <FolderItem
          key={folder.id}
          folder={folder}
          folders={folders}
          documents={documents}
          basePath={basePath}
          workspaceId={workspaceId}
          depth={0}
          onFoldersChange={onFoldersChange}
          onMoveDocument={onMoveDocument}
          onRemoveDocument={onRemoveDocument}
          dragOverId={dragOverId}
          setDragOverId={setDragOverId}
        />
      ))}
      {/* Root documents */}
      {rootDocs.map((doc) => (
        <DocItem
          key={doc.id}
          doc={doc}
          basePath={basePath}
          depth={0}
          setDragOverId={setDragOverId}
          onRemoveDocument={onRemoveDocument}
        />
      ))}
    </div>
  );
}

// ---- Document item (draggable + context menu) ----
function DocItem({
  doc,
  basePath,
  depth,
  setDragOverId,
  onRemoveDocument,
}: {
  doc: SidebarDoc;
  basePath: string;
  depth: number;
  setDragOverId: (id: string | null) => void;
  onRemoveDocument: (docId: string) => void;
}) {
  const router = useRouter();
  const supabase = createClient();

  async function handleDelete(e: React.MouseEvent) {
    e.stopPropagation();
    e.preventDefault();
    if (!confirm(`Move "${doc.title || 'Untitled'}" to trash?`)) return;

    onRemoveDocument(doc.id);

    await supabase
      .from('documents')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', doc.id);

    router.refresh();
  }

  async function handleStar(e: React.MouseEvent) {
    e.stopPropagation();
    e.preventDefault();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Check if already starred
    const { data: existing } = await supabase
      .from('starred_documents')
      .select('id')
      .eq('document_id', doc.id)
      .eq('user_id', user.id)
      .maybeSingle();

    if (existing) {
      await supabase.from('starred_documents').delete().eq('id', existing.id);
    } else {
      await supabase.from('starred_documents').insert({ document_id: doc.id, user_id: user.id });
    }
  }

  async function handleDuplicate(e: React.MouseEvent) {
    e.stopPropagation();
    e.preventDefault();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Fetch original doc
    const { data: original } = await supabase
      .from('documents')
      .select('workspace_id, title, emoji_icon, cover_image_url, folder_id')
      .eq('id', doc.id)
      .single();

    if (!original) return;

    const { data: newDoc } = await supabase
      .from('documents')
      .insert({
        workspace_id: original.workspace_id,
        owner_id: user.id,
        title: `${original.title || 'Untitled'} (copy)`,
        emoji_icon: original.emoji_icon,
        cover_image_url: original.cover_image_url,
        folder_id: original.folder_id,
        source_type: 'blank',
      })
      .select('id')
      .single();

    if (newDoc) {
      router.push(`${basePath}/doc/${newDoc.id}`);
    }
  }


  return (
    <div
      className="group flex items-center gap-1 rounded-[var(--radius-sm)] py-[5px] text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] transition-colors"
      style={{ paddingLeft: `${depth * 16 + 28}px`, paddingRight: '4px' }}
    >
      <Link
        href={`${basePath}/doc/${doc.id}`}
        draggable
        onDragStart={(e) => {
          e.dataTransfer.setData('application/syncdoc-doc', doc.id);
          e.dataTransfer.effectAllowed = 'move';
          setTimeout(() => setDragOverId(null), 0);
        }}
        onDragEnd={() => setDragOverId(null)}
        className="flex items-center gap-2 flex-1 truncate cursor-grab active:cursor-grabbing"
      >
        <span className="flex-shrink-0 text-xs leading-none">
          {doc.emoji_icon || '📄'}
        </span>
        <span className="truncate">{doc.title || 'Untitled'}</span>
      </Link>

      {/* Three-dot menu */}
      <Dropdown>
        <DropdownTrigger asChild>
          <button
            type="button"
            className="opacity-0 group-hover:opacity-100 h-5 w-5 flex items-center justify-center rounded-[var(--radius-sm)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-border)] transition-all flex-shrink-0"
            aria-label="Document options"
          >
            <MoreHorizontal className="h-3.5 w-3.5" />
          </button>
        </DropdownTrigger>
        <DropdownContent align="start" side="right" sideOffset={8}>
          <DropdownItem onSelect={(e: any) => handleStar(e)}>
            <Star className="h-3.5 w-3.5" />
            Star / Unstar
          </DropdownItem>
          <DropdownItem onSelect={(e: any) => handleDuplicate(e)}>
            <Copy className="h-3.5 w-3.5" />
            Duplicate
          </DropdownItem>
          <DropdownSeparator />
          <DropdownItem onSelect={(e: any) => handleDelete(e)} className="text-red-600 dark:text-red-400">
            <Trash2 className="h-3.5 w-3.5" />
            Move to trash
          </DropdownItem>
        </DropdownContent>
      </Dropdown>
    </div>
  );
}

// ---- Folder item (draggable + drop target) ----
function FolderItem({
  folder,
  folders,
  documents,
  basePath,
  workspaceId,
  depth,
  onFoldersChange,
  onMoveDocument,
  onRemoveDocument,
  dragOverId,
  setDragOverId,
}: {
  folder: Folder;
  folders: Folder[];
  documents: SidebarDoc[];
  basePath: string;
  workspaceId: string;
  depth: number;
  onFoldersChange: (folders: Folder[]) => void;
  onMoveDocument: (docId: string, folderId: string | null) => void;
  onRemoveDocument: (docId: string) => void;
  dragOverId: string | null;
  setDragOverId: (id: string | null) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const childFolders = folders.filter((f) => f.parent_folder_id === folder.id);
  const childDocs = documents.filter((d) => d.folder_id === folder.id);
  const hasChildren = childFolders.length > 0 || childDocs.length > 0;
  const isDropTarget = dragOverId === folder.id;

  // Drop handler
  function handleDragOver(e: React.DragEvent) {
    if (e.dataTransfer.types.includes('application/syncdoc-doc')) {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      setDragOverId(folder.id);
    }
  }

  function handleDragLeave(e: React.DragEvent) {
    // Only clear if we're actually leaving this element
    const rect = e.currentTarget.getBoundingClientRect();
    const { clientX, clientY } = e;
    if (
      clientX < rect.left ||
      clientX > rect.right ||
      clientY < rect.top ||
      clientY > rect.bottom
    ) {
      setDragOverId(null);
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    const docId = e.dataTransfer.getData('application/syncdoc-doc');
    if (docId) {
      onMoveDocument(docId, folder.id);
      setExpanded(true); // auto-expand to show the moved doc
    }
    setDragOverId(null);
  }

  // CRUD handlers
  async function handleCreateDocInFolder(e: React.MouseEvent) {
    e.stopPropagation();
    e.preventDefault();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: doc, error } = await supabase
      .from('documents')
      .insert({
        workspace_id: workspaceId,
        folder_id: folder.id,
        owner_id: user.id,
        title: 'Untitled',
        source_type: 'blank',
      })
      .select('id')
      .single();

    if (!error && doc) {
      router.push(`${basePath}/doc/${doc.id}`);
    }
  }

  async function handleRenameFolder(e: React.MouseEvent) {
    e.stopPropagation();
    e.preventDefault();
    const newName = prompt('Rename folder:', folder.name);
    if (!newName?.trim() || newName.trim() === folder.name) return;

    const { error } = await supabase
      .from('folders')
      .update({ name: newName.trim() })
      .eq('id', folder.id);

    if (!error) {
      onFoldersChange(folders.map((f) => f.id === folder.id ? { ...f, name: newName.trim() } : f));
    }
  }

  async function handleDeleteFolder(e: React.MouseEvent) {
    e.stopPropagation();
    e.preventDefault();
    if (!confirm(`Delete folder "${folder.name}"? Documents inside will be moved to the root.`)) return;

    const { error } = await supabase
      .from('folders')
      .delete()
      .eq('id', folder.id);

    if (!error) {
      onFoldersChange(folders.filter((f) => f.id !== folder.id));
    }
  }

  return (
    <div>
      {/* Folder row */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          'group flex items-center gap-1 rounded-[var(--radius-sm)] py-[5px] text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] transition-all cursor-pointer',
          isDropTarget && 'bg-[var(--brand-primary)]/10 ring-1 ring-[var(--brand-primary)] ring-inset',
        )}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
      >
        {/* Expand/collapse chevron */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="p-0.5 rounded hover:bg-[var(--bg-border)] flex-shrink-0"
          aria-label={expanded ? 'Collapse folder' : 'Expand folder'}
        >
          <ChevronRight
            className={cn('h-3.5 w-3.5 transition-transform duration-150', expanded && 'rotate-90')}
          />
        </button>

        {/* Folder icon + name link */}
        <div
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-2 flex-1 truncate py-0.5"
        >
          {expanded ? (
            <FolderOpen className="h-4 w-4 text-[var(--text-tertiary)] flex-shrink-0" />
          ) : (
            <FolderIcon className="h-4 w-4 text-[var(--text-tertiary)] flex-shrink-0" />
          )}
          <span className="truncate">{folder.name}</span>
        </div>

        {/* Hover actions */}
        <div className="hidden group-hover:flex items-center gap-0.5 mr-1 flex-shrink-0">
          <Tooltip content="New doc">
            <button
              onClick={handleCreateDocInFolder}
              className="rounded p-0.5 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-border)] transition-colors"
              aria-label="Create document in folder"
            >
              <Plus className="h-3 w-3" />
            </button>
          </Tooltip>
          <Tooltip content="Rename">
            <button
              onClick={handleRenameFolder}
              className="rounded p-0.5 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-border)] transition-colors"
              aria-label="Rename folder"
            >
              <Pencil className="h-3 w-3" />
            </button>
          </Tooltip>
          <Tooltip content="Delete">
            <button
              onClick={handleDeleteFolder}
              className="rounded p-0.5 text-[var(--text-tertiary)] hover:text-red-500 hover:bg-[var(--bg-border)] transition-colors"
              aria-label="Delete folder"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          </Tooltip>
        </div>
      </div>

      {/* Children (folders + docs) */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="overflow-hidden"
          >
            {/* Child folders */}
            {childFolders.map((child) => (
              <FolderItem
                key={child.id}
                folder={child}
                folders={folders}
                documents={documents}
                basePath={basePath}
                workspaceId={workspaceId}
                depth={depth + 1}
                onFoldersChange={onFoldersChange}
                onMoveDocument={onMoveDocument}
                onRemoveDocument={onRemoveDocument}
                dragOverId={dragOverId}
                setDragOverId={setDragOverId}
              />
            ))}
            {/* Child docs */}
            {childDocs.map((doc) => (
              <DocItem
                key={doc.id}
                doc={doc}
                basePath={basePath}
                depth={depth + 1}
                setDragOverId={setDragOverId}
                onRemoveDocument={onRemoveDocument}
              />
            ))}
            {/* Empty folder hint */}
            {!hasChildren && (
              <p
                className="text-[11px] text-[var(--text-tertiary)] italic py-1"
                style={{ paddingLeft: `${(depth + 1) * 16 + 28}px` }}
              >
                No pages inside
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
