'use client';

import { useRouter } from 'next/navigation';
import { useEditorStore } from '@/store/editorStore';
import { useUIStore } from '@/store/uiStore';
import { usePresenceStore } from '@/store/presenceStore';
import { formatWordCount, getReadingTime, getInitials, getAvatarColor } from '@syncdoc/utils';
import { Button } from '@/components/ui/Button';
import { Tooltip } from '@/components/ui/Tooltip';
import { Avatar } from '@/components/ui/Avatar';
import { Dropdown, DropdownTrigger, DropdownContent, DropdownItem, DropdownSeparator } from '@/components/ui/Dropdown';
import type { Document, Workspace, Profile } from '@syncdoc/types';
import {
  ArrowLeft,
  Share2,
  History,
  Maximize2,
  Minimize2,
  MoreHorizontal,
  FileDown,
  FileText,
  FileCode,
  Printer,
  Copy,
  FolderInput,
  Archive,
  Trash2,
  Sparkles,
  MessageSquare,
} from 'lucide-react';

interface EditorTopbarProps {
  document: Document;
  workspace: Workspace;
  profile: Profile;
}

export function EditorTopbar({ document: doc, workspace, profile }: EditorTopbarProps) {
  const router = useRouter();
  const { wordCount, isSaving, focusMode, toggleFocusMode, connectionStatus } = useEditorStore();
  const { togglePanel, setShareModalOpen } = useUIStore();
  const users = usePresenceStore((s) => s.users);

  const readingTime = getReadingTime(wordCount);
  const presenceUsers = Array.from(users.values()).slice(0, 5);
  const overflowCount = Math.max(0, users.size - 5);

  const connectionDot = {
    connected: 'bg-green-500',
    connecting: 'bg-yellow-500 animate-pulse',
    disconnected: 'bg-red-500',
    synced: 'bg-green-500',
  };

  return (
    <div className="flex h-12 items-center gap-2 border-b border-[var(--bg-border)] bg-[var(--bg-surface)] px-3">
      {/* Back button */}
      <Tooltip content="Back to workspace">
        <button
          onClick={() => router.push(`/workspace/${workspace.slug}/home`)}
          className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-md)] text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)] transition-colors"
          aria-label="Back to workspace"
        >
          <ArrowLeft size={18} />
        </button>
      </Tooltip>

      {/* Saving indicator / connection status */}
      <div className="flex items-center gap-1.5 text-xs text-[var(--text-tertiary)]">
        <div className={`h-1.5 w-1.5 rounded-full ${connectionDot[connectionStatus]}`} />
        {isSaving ? 'Saving...' : connectionStatus === 'connected' ? 'Saved' : connectionStatus}
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Word count & reading time */}
      <Tooltip content={`${wordCount.toLocaleString()} words · ${readingTime} min read`}>
        <span className="hidden text-xs text-[var(--text-tertiary)] sm:block cursor-default">
          {formatWordCount(wordCount)} · {readingTime} min read
        </span>
      </Tooltip>

      {/* Presence avatars */}
      {presenceUsers.length > 0 && (
        <div className="flex items-center -space-x-2 ml-2">
          {presenceUsers.map((user, i) => (
            <Tooltip key={user.user.id} content={`${user.user.name} · ${user.isTyping ? 'Editing' : 'Viewing'}`}>
              <div className="relative">
                <Avatar
                  name={user.user.name}
                  color={user.user.color}
                  src={user.user.avatar_url}
                  size="sm"
                  isTyping={user.isTyping}
                />
              </div>
            </Tooltip>
          ))}
          {overflowCount > 0 && (
            <div className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-[var(--bg-surface)] bg-[var(--bg-elevated)] text-[10px] font-medium text-[var(--text-secondary)]">
              +{overflowCount}
            </div>
          )}
        </div>
      )}

      {/* Comments */}
      <Tooltip content="Comments" shortcut="⌘+Shift+M">
        <button
          onClick={() => togglePanel('comments')}
          className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-md)] text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)] transition-colors"
          aria-label="Toggle comments panel"
        >
          <MessageSquare size={16} />
        </button>
      </Tooltip>

      {/* AI */}
      <Tooltip content="AI assistant">
        <button
          onClick={() => togglePanel('ai')}
          className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-md)] text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)] transition-colors"
          aria-label="Toggle AI panel"
        >
          <Sparkles size={16} />
        </button>
      </Tooltip>

      {/* Revision history */}
      <Tooltip content="Version history">
        <button
          onClick={() => togglePanel('history')}
          className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-md)] text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)] transition-colors"
          aria-label="Toggle version history"
        >
          <History size={16} />
        </button>
      </Tooltip>

      {/* Focus mode */}
      <Tooltip content={focusMode ? 'Exit focus mode' : 'Focus mode'}>
        <button
          onClick={toggleFocusMode}
          className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-md)] text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)] transition-colors"
          aria-label="Toggle focus mode"
        >
          {focusMode ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
        </button>
      </Tooltip>

      {/* Share button */}
      <Button
        variant="primary"
        size="sm"
        onClick={() => setShareModalOpen(true)}
      >
        <Share2 size={14} className="mr-1.5" />
        Share
      </Button>

      {/* More options */}
      <Dropdown>
        <DropdownTrigger asChild>
          <button
            className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-md)] text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)] transition-colors"
            aria-label="More options"
          >
            <MoreHorizontal size={16} />
          </button>
        </DropdownTrigger>
        <DropdownContent align="end">
          <DropdownItem onSelect={() => {/* TODO */}}>
            <FileDown size={14} />
            Export as PDF
          </DropdownItem>
          <DropdownItem onSelect={() => {/* TODO */}}>
            <FileText size={14} />
            Export as DOCX
          </DropdownItem>
          <DropdownItem onSelect={() => {/* TODO */}}>
            <FileCode size={14} />
            Export as Markdown
          </DropdownItem>
          <DropdownItem onSelect={() => window.print()}>
            <Printer size={14} />
            Print
          </DropdownItem>
          <DropdownSeparator />
          <DropdownItem onSelect={() => {/* TODO */}}>
            <Copy size={14} />
            Duplicate
          </DropdownItem>
          <DropdownItem onSelect={() => {/* TODO */}}>
            <FolderInput size={14} />
            Move to folder
          </DropdownItem>
          <DropdownSeparator />
          <DropdownItem onSelect={() => {/* TODO */}}>
            <Archive size={14} />
            Archive
          </DropdownItem>
          <DropdownItem onSelect={() => {/* TODO */}} className="text-red-600 dark:text-red-400">
            <Trash2 size={14} />
            Delete
          </DropdownItem>
        </DropdownContent>
      </Dropdown>
    </div>
  );
}
