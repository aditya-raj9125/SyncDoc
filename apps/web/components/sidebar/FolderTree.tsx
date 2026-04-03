'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChevronRight, FolderIcon, FolderOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Folder } from '@syncdoc/types';
import { motion, AnimatePresence } from 'framer-motion';

interface FolderTreeProps {
  folders: Folder[];
  basePath: string;
  workspaceId: string;
  parentId?: string | null;
  depth?: number;
}

export function FolderTree({
  folders,
  basePath,
  workspaceId,
  parentId = null,
  depth = 0,
}: FolderTreeProps) {
  const childFolders = folders.filter((f) => f.parent_folder_id === parentId);

  if (childFolders.length === 0 || depth > 3) return null;

  return (
    <div className="mt-1">
      {childFolders.map((folder) => (
        <FolderItem
          key={folder.id}
          folder={folder}
          folders={folders}
          basePath={basePath}
          workspaceId={workspaceId}
          depth={depth}
        />
      ))}
    </div>
  );
}

function FolderItem({
  folder,
  folders,
  basePath,
  workspaceId,
  depth,
}: {
  folder: Folder;
  folders: Folder[];
  basePath: string;
  workspaceId: string;
  depth: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const hasChildren = folders.some((f) => f.parent_folder_id === folder.id);

  return (
    <div>
      <div
        className="flex items-center gap-1 rounded-[var(--radius-sm)] py-1 text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] transition-colors cursor-pointer"
        style={{ paddingLeft: `${depth * 16 + 12}px` }}
      >
        {hasChildren ? (
          <button
            onClick={() => setExpanded(!expanded)}
            className="p-0.5 rounded hover:bg-[var(--bg-border)]"
            aria-label={expanded ? 'Collapse folder' : 'Expand folder'}
          >
            <ChevronRight
              className={cn('h-3.5 w-3.5 transition-transform', expanded && 'rotate-90')}
            />
          </button>
        ) : (
          <span className="w-4" />
        )}
        <Link
          href={`${basePath}/documents?folder=${folder.id}`}
          className="flex items-center gap-2 flex-1 truncate py-0.5"
        >
          {expanded ? (
            <FolderOpen className="h-4 w-4 text-[var(--text-tertiary)]" />
          ) : (
            <FolderIcon className="h-4 w-4 text-[var(--text-tertiary)]" />
          )}
          <span className="truncate">{folder.name}</span>
        </Link>
      </div>
      <AnimatePresence>
        {expanded && hasChildren && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <FolderTree
              folders={folders}
              basePath={basePath}
              workspaceId={workspaceId}
              parentId={folder.id}
              depth={depth + 1}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
