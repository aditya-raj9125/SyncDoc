'use client';

import { useState, useRef, useEffect } from 'react';
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

export function Sidebar({ workspace, profile, folders: initialFolders, memberCount, userRole }: SidebarProps) {
  const { sidebarOpen, sidebarWidth, setSidebarWidth, toggleSidebar, activeSection, setActiveSection } =
    useUIStore();
  const [folders, setFolders] = useState<Folder[]>(initialFolders);
  const [documents, setDocuments] = useState<SidebarDoc[]>([]);
  const [sharedDocuments, setSharedDocuments] = useState<SidebarDoc[]>([]);
  const [docsExpanded, setDocsExpanded] = useState(true);
  const [sharedExpanded, setSharedExpanded] = useState(true);
  const [isResizing, setIsResizing] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [dragOverRoot, setDragOverRoot] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const supabase = createClient();

  const basePath = `/workspace/${workspace.slug}`;

  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch sidebar documents
  useEffect(() => {
    async function fetchDocs() {
      try {
        const { data, error } = await supabase
          .from('documents')
          .select('id, title, emoji_icon, folder_id')
          .eq('workspace_id', workspace.id)
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

  // Fetch shared documents
  useEffect(() => {
    async function fetchSharedDocs() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Parallelize both queries
        const [permResult, inviteResult] = await Promise.all([
          supabase
            .from('document_permissions')
            .select('document_id, documents(id, title, emoji_icon)')
            .eq('user_id', user.id),
          supabase
            .from('share_invitations')
            .select('document_id, documents(id, title, emoji_icon)')
            .eq('invited_email', user.email || ''),
        ]);

        if (permResult.error) console.error('Error fetching permitted docs:', permResult.error);
        if (inviteResult.error) console.error('Error fetching invited docs:', inviteResult.error);

        const allShared = [
          ...(permResult.data?.map(p => p.documents) || []),
          ...(inviteResult.data?.map(i => i.documents) || [])
        ].filter(Boolean) as unknown as SidebarDoc[];

        // De-duplicate
        const uniqueShared = Array.from(new Map(allShared.map(d => [d.id, d])).values());
        setSharedDocuments(uniqueShared);
      } catch (err) {
        console.error('Error fetching shared documents:', err);
      }
    }
    fetchSharedDocs();
  }, [workspace.id, profile.id]);

  useEffect(() => {
    if (pathname.includes('/home')) setActiveSection('home');
    else if (pathname.includes('/documents')) setActiveSection('documents');
    else if (pathname.includes('/starred')) setActiveSection('starred');
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
        .select()
        .single();

      if (error) {
        console.error('Error creating document:', error);
        toast.error('Failed to create document');
        return;
      }

      if (doc) {
        setDocuments((prev) => [...prev, { id: doc.id, title: doc.title, emoji_icon: doc.emoji_icon, folder_id: null }]);
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

  // Drag-and-drop: move document to a folder (or root)
  async function handleMoveDocument(docId: string, folderId: string | null) {
    // Optimistic update
    setDocuments((prev) =>
      prev.map((d) => (d.id === docId ? { ...d, folder_id: folderId } : d))
    );

    // Persist to DB
    const { error } = await supabase
      .from('documents')
      .update({ folder_id: folderId })
      .eq('id', docId);

    if (error) {
      console.error('Failed to move document:', error);
      // Revert on error — refetch
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

  // Drop-to-root handler (on the "DOCUMENTS" header)
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

  return (
    <>
      <AnimatePresence initial={false}>
        {sidebarOpen && (
          <motion.aside
            ref={sidebarRef}
            initial={{ width: 0 }}
            animate={{ width: sidebarWidth }}
            exit={{ width: 0 }}
            transition={{ duration: 0.2 }}
            className="relative flex h-full flex-col overflow-hidden border-r-0 bg-[var(--bg-surface)] shadow-sm no-print"
            style={{ minWidth: sidebarOpen ? 180 : 0 }}
          >
            <div className="flex flex-col h-full" style={{ width: sidebarWidth }}>
              {/* Workspace header */}
              <div className="flex items-center justify-between px-4 pt-4 pb-2">
                <button
                  onClick={() => router.push(`${basePath}/home`)}
                  className="flex items-center gap-2 rounded-[var(--radius-md)] px-1 py-1 hover:bg-[var(--bg-elevated)] transition-colors truncate"
                >
                  <div className="flex h-6 w-6 items-center justify-center rounded-[var(--radius-sm)] bg-[var(--brand-primary)] text-white text-xs font-bold">
                    {workspace.name[0]?.toUpperCase()}
                  </div>
                  <span className="text-sm font-semibold truncate">{workspace.name}</span>
                </button>
                <Tooltip content="Collapse sidebar">
                  <button
                    onClick={toggleSidebar}
                    className="rounded-[var(--radius-sm)] p-1 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] transition-colors"
                    aria-label="Collapse sidebar"
                  >
                    <ChevronsLeft className="h-4 w-4" />
                  </button>
                </Tooltip>
              </div>


              {/* Navigation */}
              <nav className="flex-1 overflow-y-auto px-3 py-1">
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

                {/* ── SHARED WITH ME section ── */}
                {sharedDocuments.length > 0 && (
                  <div className="mt-6">
                    <button
                      onClick={() => setSharedExpanded(!sharedExpanded)}
                      className="flex items-center gap-1 px-3 mb-1 text-[10px] font-medium uppercase tracking-wider text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors"
                    >
                      <ChevronRight className={cn('h-3 w-3 transition-transform duration-150', sharedExpanded && 'rotate-90')} />
                      Shared with me
                    </button>
                    <AnimatePresence>
                      {sharedExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.15 }}
                          className="space-y-0.5"
                        >
                          {sharedDocuments.map((doc) => (
                            <NavItem
                              key={doc.id}
                              icon={<span className="text-sm">{doc.emoji_icon}</span>}
                              label={doc.title}
                              href={`${basePath}/doc/${doc.id}`}
                              active={pathname.includes(doc.id)}
                              className="pl-6"
                            />
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}

                {/* ── DOCUMENTS section ── */}
                <div className="mt-6">
                  {/* Section header — also a drop target to move docs to root */}
                  <div
                    onDragOver={handleRootDragOver}
                    onDragLeave={handleRootDragLeave}
                    onDrop={handleRootDrop}
                    className={cn(
                      'flex items-center justify-between px-3 mb-1 rounded-[var(--radius-sm)] transition-all',
                      dragOverRoot && 'bg-[var(--brand-primary)]/10 ring-1 ring-[var(--brand-primary)] ring-inset',
                    )}
                  >
                    <button
                      onClick={() => setDocsExpanded(!docsExpanded)}
                      className="flex items-center gap-1 text-[10px] font-medium uppercase tracking-wider text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors"
                    >
                      <ChevronRight className={cn('h-3 w-3 transition-transform duration-150', docsExpanded && 'rotate-90')} />
                      Documents
                    </button>
                    <div className="flex items-center gap-1">
                      <Tooltip content="New folder">
                        <button
                          onClick={handleCreateFolder}
                          className="rounded-[var(--radius-sm)] p-0.5 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] transition-colors"
                          aria-label="New folder"
                        >
                          <FolderPlus className="h-3.5 w-3.5" />
                        </button>
                      </Tooltip>
                      <Tooltip content="New document">
                        <button
                          onClick={handleNewDocument}
                          className="rounded-[var(--radius-sm)] p-0.5 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] transition-colors"
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
                        transition={{ duration: 0.15 }}
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

              {/* Bottom section */}
              <div className="border-t border-[var(--bg-border)] px-3 py-3 space-y-2">
                {/* Members */}
                <div className="flex items-center gap-2 px-3 py-1 text-xs text-[var(--text-tertiary)]">
                  <span className="flex h-3.5 w-3.5 items-center justify-center">
                   <Users className="h-2.5 w-2.5" />
                  </span>
                  {memberCount} {STRINGS.workspace.members}
                </div>

                {/* Dark mode toggle */}
                <button
                  onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                  className="flex w-full items-center gap-2 rounded-[var(--radius-md)] px-3 py-2 text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] transition-colors"
                  aria-label="Toggle dark mode"
                >
                  {mounted ? (
                    <AnimatePresence mode="wait">
                      {theme === 'dark' ? (
                        <motion.div key="sun" initial={{ rotate: -90 }} animate={{ rotate: 0 }} exit={{ rotate: 90 }}>
                          <Sun className="h-4 w-4" />
                        </motion.div>
                      ) : (
                        <motion.div key="moon" initial={{ rotate: 90 }} animate={{ rotate: 0 }} exit={{ rotate: -90 }}>
                          <Moon className="h-4 w-4" />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  ) : (
                    <Sun className="h-4 w-4" />
                  )}
                  {mounted ? (theme === 'dark' ? 'Light mode' : 'Dark mode') : 'Toggle theme'}
                </button>

                {/* User profile */}
                <div className="flex items-center gap-2 rounded-[var(--radius-md)] px-2 py-2">
                  <Avatar
                    name={profile.display_name}
                    src={profile.avatar_url}
                    color={profile.avatar_color}
                    size="sm"
                  />
                  <span className="flex-1 truncate text-sm font-medium">
                    {profile.display_name}
                  </span>
                  <Tooltip content="Sign out">
                    <button
                      onClick={handleLogout}
                      className="rounded-[var(--radius-sm)] p-1 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] transition-colors"
                      aria-label="Sign out"
                    >
                      <LogOut className="h-3.5 w-3.5" />
                    </button>
                  </Tooltip>
                </div>
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
          </motion.aside>
        )}
      </AnimatePresence>

      {!sidebarOpen && (
        <Tooltip content="Expand sidebar" side="right">
          <motion.button
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            onClick={toggleSidebar}
            className="fixed left-4 top-4 z-[60] flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--bg-surface)] border border-[var(--bg-border)] text-[var(--text-tertiary)] shadow-xl hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)] transition-all group"
            aria-label="Expand sidebar"
          >
            <PanelLeft className="h-4 w-4" />
            <div className="absolute left-[110%] hidden whitespace-nowrap rounded-md bg-[var(--bg-surface)] px-2 py-1 text-xs font-medium text-[var(--text-primary)] opacity-0 shadow-xl transition-all group-hover:block group-hover:opacity-100">
              Expand Workspace
            </div>
          </motion.button>
        </Tooltip>
      )}
    </>
  );
}
