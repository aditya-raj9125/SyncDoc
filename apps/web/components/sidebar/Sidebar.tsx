'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { toast } from '@/components/ui/Toast';
import { useRouter, usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useUIStore } from '@/store/uiStore';
import { STRINGS } from '@/lib/constants';
import { Avatar } from '@/components/ui/Avatar';
import { Tooltip } from '@/components/ui/Tooltip';
import { DocumentTree } from './FolderTree';
import { NavItem } from './NavItem';
import type { Workspace, Profile, Folder } from '@syncdoc/types';
import {
  Home,
  FileText,
  Star,
  Share2,
  Trash2,
  Archive,
  ChevronsLeft,
  PanelLeft,
  Plus,
  LogOut,
  Sun,
  Moon,
  Users,
  FolderPlus,
  ChevronRight,
  ChevronDown,
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { createClient } from '@/lib/supabase/client';

interface SidebarDoc {
  id: string;
  title: string;
  emoji_icon: string;
  folder_id: string | null;
}

interface SidebarProps {
  workspace: Workspace;
  profile: Profile;
  folders: Folder[];
  memberCount: number;
  userRole: string;
}

const SIDEBAR_WIDTH = 240;

export function Sidebar({ workspace, profile, folders: initialFolders, memberCount, userRole }: SidebarProps) {
  const { sidebarOpen, sidebarWidth, setSidebarWidth, toggleSidebar, activeSection, setActiveSection } =
    useUIStore();
  const [folders, setFolders] = useState<Folder[]>(initialFolders);
  const [documents, setDocuments] = useState<SidebarDoc[]>([]);
  const [docsExpanded, setDocsExpanded] = useState(true);
  const [isResizing, setIsResizing] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [dragOverRoot, setDragOverRoot] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const supabase = createClient();

  const basePath = `/workspace/${workspace.slug}`;

  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch sidebar documents (owned only — not shared, that's a separate nav section)
  useEffect(() => {
    async function fetchDocs() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data, error } = await supabase
          .from('documents')
          .select('id, title, emoji_icon, folder_id')
          .eq('workspace_id', workspace.id)
          .eq('owner_id', user.id)
          .is('deleted_at', null)
          .neq('status', 'archived')
          .order('title', { ascending: true });

        if (error) {
          console.error('Failed to fetch documents:', error);
          return;
        }
        if (data) {
          setDocuments(data as SidebarDoc[]);
        }
      } catch (err) {
        console.error('Error fetching sidebar documents:', err);
      }
    }
    fetchDocs();
  }, [workspace.id]);

  useEffect(() => {
    if (pathname.includes('/home')) setActiveSection('home');
    else if (pathname.includes('/documents')) setActiveSection('documents');
    else if (pathname.includes('/starred')) setActiveSection('starred');
    else if (pathname.includes('/shared')) setActiveSection('shared');
    else if (pathname.includes('/archive')) setActiveSection('archive');
    else if (pathname.includes('/trash')) setActiveSection('trash');
  }, [pathname, setActiveSection]);

  function handleMouseDown() {
    setIsResizing(true);
  }

  useEffect(() => {
    function handleMouseMove(e: MouseEvent) {
      if (!isResizing) return;
      setSidebarWidth(e.clientX);
    }

    function handleMouseUp() {
      setIsResizing(false);
    }

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, setSidebarWidth]);

  // FIX 1: Add will-change only during animation, remove after
  const handleToggleSidebar = useCallback(() => {
    setIsAnimating(true);
    toggleSidebar();
    // Remove will-change after animation completes
    setTimeout(() => setIsAnimating(false), 250);
  }, [toggleSidebar]);

  async function handleLogout() {
    try {
      await supabase.auth.signOut();
      router.push('/login');
      router.refresh();
    } catch (err) {
      console.error('Error signing out:', err);
      toast.error('Failed to sign out. Please try again.');
    }
  }

  async function handleNewDocument() {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        toast.error('You must be signed in to create a document');
        return;
      }

      const { data: doc, error } = await supabase
        .from('documents')
        .insert({
          workspace_id: workspace.id,
          owner_id: user.id,
          title: 'Untitled',
          source_type: 'blank',
        })
        .select('id, title, emoji_icon, folder_id')
        .single();

      if (error) {
        console.error('Error creating document:', JSON.stringify(error));
        toast.error('Failed to create document');
        return;
      }

      if (doc) {
        setDocuments((prev) => [...prev, { id: doc.id, title: doc.title ?? 'Untitled', emoji_icon: doc.emoji_icon ?? '📄', folder_id: null }]);
        router.push(`${basePath}/doc/${doc.id}`);
      }
    } catch (err) {
      console.error('Error creating document:', err);
      toast.error('Something went wrong creating the document');
    }
  }

  async function handleCreateFolder() {
    const name = prompt('Folder name:');
    if (!name?.trim()) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('You must be signed in to create a folder');
        return;
      }

      const { data, error } = await supabase
        .from('folders')
        .insert({ workspace_id: workspace.id, name: name.trim(), created_by: user.id })
        .select()
        .single();

      if (error) {
        console.error('Error creating folder:', error);
        toast.error('Failed to create folder');
        return;
      }

      if (data) {
        setFolders((prev) => [...prev, data]);
        toast.success(`Folder "${name.trim()}" created`);
      }
    } catch (err) {
      console.error('Error creating folder:', err);
      toast.error('Something went wrong creating the folder');
    }
  }

  async function handleMoveDocument(docId: string, folderId: string | null) {
    setDocuments((prev) =>
      prev.map((d) => (d.id === docId ? { ...d, folder_id: folderId } : d))
    );

    const { error } = await supabase
      .from('documents')
      .update({ folder_id: folderId })
      .eq('id', docId);

    if (error) {
      console.error('Failed to move document:', error);
      const { data } = await supabase
        .from('documents')
        .select('id, title, emoji_icon, folder_id')
        .eq('workspace_id', workspace.id)
        .is('deleted_at', null)
        .neq('status', 'archived')
        .order('title', { ascending: true });
      if (data) setDocuments(data as SidebarDoc[]);
    }
  }

  function handleRootDragOver(e: React.DragEvent) {
    if (e.dataTransfer.types.includes('application/syncdoc-doc')) {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      setDragOverRoot(true);
    }
  }

  function handleRootDragLeave() {
    setDragOverRoot(false);
  }

  function handleRootDrop(e: React.DragEvent) {
    e.preventDefault();
    const docId = e.dataTransfer.getData('application/syncdoc-doc');
    if (docId) {
      handleMoveDocument(docId, null);
    }
    setDragOverRoot(false);
  }

  const workspaceInitial = workspace.name[0]?.toUpperCase() || 'W';

  return (
    <>
      {/* FIX 1: Fixed-width wrapper with overflow hidden — sidebar content never reflows */}
      {/* The toggle button is OUTSIDE the animated container */}
      <motion.div
        animate={{ width: sidebarOpen ? sidebarWidth : 0 }}
        transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
        style={{
          flexShrink: 0,
          overflow: 'hidden',
          willChange: isAnimating ? 'width' : 'auto',
        }}
        className="relative h-full no-print"
      >
        {/* Inner div is always full sidebar width — never changes, no reflow */}
        <div
          ref={sidebarRef}
          className="flex h-full flex-col bg-[var(--bg-surface)] border-r border-[var(--bg-border)]"
          style={{ width: sidebarWidth, minWidth: sidebarWidth }}
        >
          {/* ── Workspace Header ── */}
          <div className="flex items-center justify-between px-3 pt-4 pb-3">
            {/* FIX 11: Square workspace avatar (not circle) */}
            <button
              onClick={() => router.push(`${basePath}/home`)}
              className="flex items-center gap-2 rounded-[6px] px-1.5 py-1 hover:bg-[var(--bg-elevated)] transition-colors truncate flex-1 min-w-0"
            >
              <div
                className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-[8px] bg-[var(--brand-primary)] text-white text-sm font-bold shadow-sm"
              >
                {workspaceInitial}
              </div>
              <span className="text-sm font-semibold truncate text-[var(--text-primary)] flex-1 min-w-0 text-left">
                {workspace.name}
              </span>
              {/* FIX 11: Chevron-down to indicate workspace switcher */}
              <ChevronDown className="h-3.5 w-3.5 flex-shrink-0 text-[var(--text-tertiary)]" />
            </button>

            {/* Collapse button — INSIDE the wrapper but positioned at edge */}
            <Tooltip content="Collapse sidebar">
              <button
                onClick={handleToggleSidebar}
                className="ml-1 flex-shrink-0 rounded-[6px] p-1.5 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] transition-colors"
                aria-label="Collapse sidebar"
              >
                <ChevronsLeft className="h-4 w-4" />
              </button>
            </Tooltip>
          </div>

          {/* ── Navigation ── */}
          <nav className="flex-1 overflow-y-auto px-2 py-1">
            <div className="space-y-0.5">
              <NavItem
                icon={<Home className="h-4 w-4" />}
                label={STRINGS.workspace.home}
                active={activeSection === 'home'}
                href={`${basePath}/home`}
              />
              <NavItem
                icon={<FileText className="h-4 w-4" />}
                label={STRINGS.workspace.allDocuments}
                active={activeSection === 'documents'}
                href={`${basePath}/documents`}
              />
              <NavItem
                icon={<Star className="h-4 w-4" />}
                label={STRINGS.workspace.starred}
                active={activeSection === 'starred'}
                href={`${basePath}/starred`}
              />
              {/* FIX 2: Exactly ONE "Shared with me" nav item — no duplicate section below */}
              <NavItem
                icon={<Share2 className="h-4 w-4" />}
                label={STRINGS.workspace.sharedWithMe}
                active={activeSection === 'shared'}
                href={`${basePath}/shared`}
              />
              <NavItem
                icon={<Archive className="h-4 w-4" />}
                label="Archive"
                active={activeSection === 'archive'}
                href={`${basePath}/archive`}
              />
              <NavItem
                icon={<Trash2 className="h-4 w-4" />}
                label={STRINGS.workspace.trash}
                active={activeSection === 'trash'}
                href={`${basePath}/trash`}
              />
            </div>

            {/* ── DOCUMENTS section ── */}
            <div className="mt-5">
              {/* FIX 11: Section label in text-label style */}
              <div
                onDragOver={handleRootDragOver}
                onDragLeave={handleRootDragLeave}
                onDrop={handleRootDrop}
                className={cn(
                  'flex items-center justify-between px-2 mb-1 rounded-[6px] transition-all',
                  dragOverRoot && 'bg-[var(--brand-primary)]/10 ring-1 ring-[var(--brand-primary)] ring-inset',
                )}
              >
                <button
                  onClick={() => setDocsExpanded(!docsExpanded)}
                  className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors"
                >
                  <ChevronRight className={cn('h-3 w-3 transition-transform duration-150', docsExpanded && 'rotate-90')} />
                  Documents
                </button>
                <div className="flex items-center gap-0.5">
                  <Tooltip content="New folder">
                    <button
                      onClick={handleCreateFolder}
                      className="rounded-[4px] p-1 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] transition-colors"
                      aria-label="New folder"
                    >
                      <FolderPlus className="h-3.5 w-3.5" />
                    </button>
                  </Tooltip>
                  <Tooltip content="New document">
                    <button
                      onClick={handleNewDocument}
                      className="rounded-[4px] p-1 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] transition-colors"
                      aria-label="New document"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </Tooltip>
                </div>
              </div>

              <AnimatePresence>
                {docsExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.15, ease: [0.4, 0, 0.2, 1] }}
                    className="overflow-hidden"
                  >
                    {(folders.length > 0 || documents.length > 0) ? (
                      <DocumentTree
                        folders={folders}
                        documents={documents}
                        basePath={basePath}
                        workspaceId={workspace.id}
                        onFoldersChange={setFolders}
                        onDocumentsChange={setDocuments}
                        onMoveDocument={handleMoveDocument}
                        onRemoveDocument={(id) => setDocuments((prev) => prev.filter((d) => d.id !== id))}
                      />
                    ) : (
                      <p className="px-3 py-2 text-xs text-[var(--text-tertiary)]">No documents yet</p>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </nav>

          {/* ── Bottom Section — FIX 11 ── */}
          <div className="border-t border-[var(--bg-border)] px-2 py-3 space-y-1">
            {/* Members count */}
            <div className="flex items-center gap-2 px-2 py-1 text-xs text-[var(--text-tertiary)]">
              <Users className="h-3.5 w-3.5 flex-shrink-0" />
              <span className="whitespace-nowrap">{memberCount} {STRINGS.workspace.members}</span>
            </div>

            {/* Dark mode toggle */}
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="flex w-full items-center gap-2 rounded-[6px] px-2 py-2 text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] transition-colors"
              aria-label="Toggle dark mode"
            >
              {mounted ? (
                <AnimatePresence mode="wait">
                  {theme === 'dark' ? (
                    <motion.div key="sun" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.15 }}>
                      <Sun className="h-4 w-4 flex-shrink-0" />
                    </motion.div>
                  ) : (
                    <motion.div key="moon" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.15 }}>
                      <Moon className="h-4 w-4 flex-shrink-0" />
                    </motion.div>
                  )}
                </AnimatePresence>
              ) : (
                <Sun className="h-4 w-4 flex-shrink-0" />
              )}
              <span className="whitespace-nowrap text-[13px]">
                {mounted ? (theme === 'dark' ? 'Light mode' : 'Dark mode') : 'Toggle theme'}
              </span>
            </button>

            {/* User profile row — FIX 11: hover state as user menu trigger */}
            <div className="flex items-center gap-2 rounded-[6px] px-2 py-2 hover:bg-[var(--bg-elevated)] transition-colors cursor-pointer group">
              <Avatar
                name={profile.display_name}
                src={profile.avatar_url}
                color={profile.avatar_color}
                size="sm"
              />
              <span className="flex-1 truncate text-[13px] font-medium text-[var(--text-primary)] whitespace-nowrap">
                {profile.display_name}
              </span>
              <Tooltip content="Sign out">
                <button
                  onClick={handleLogout}
                  className="rounded-[4px] p-1 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] opacity-0 group-hover:opacity-100 hover:bg-[var(--bg-elevated)] transition-all"
                  aria-label="Sign out"
                >
                  <LogOut className="h-3.5 w-3.5" />
                </button>
              </Tooltip>
            </div>
          </div>

          {/* Resize handle */}
          <div
            className={cn(
              'absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-[var(--brand-primary)] transition-colors z-10',
              isResizing && 'bg-[var(--brand-primary)]',
            )}
            onMouseDown={handleMouseDown}
          />
        </div>
      </motion.div>

      {/* Expand button — OUTSIDE the animated container, always visible when collapsed */}
      {!sidebarOpen && (
        <Tooltip content="Expand sidebar" side="right">
          <motion.button
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.15 }}
            onClick={handleToggleSidebar}
            className="fixed left-4 top-4 z-[60] flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--bg-surface)] border border-[var(--bg-border)] text-[var(--text-tertiary)] shadow-xl hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)] transition-all"
            aria-label="Expand sidebar"
          >
            <PanelLeft className="h-4 w-4" />
          </motion.button>
        </Tooltip>
      )}
    </>
  );
}
