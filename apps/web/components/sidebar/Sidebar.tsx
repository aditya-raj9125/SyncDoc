'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useUIStore } from '@/store/uiStore';
import { STRINGS } from '@/lib/constants';
import { Avatar } from '@/components/ui/Avatar';
import { Tooltip } from '@/components/ui/Tooltip';
import { FolderTree } from './FolderTree';
import { NavItem } from './NavItem';
import type { Workspace, Profile, Folder } from '@syncdoc/types';
import {
  Home,
  FileText,
  Star,
  Share2,
  Trash2,
  Settings,
  ChevronsLeft,
  PanelLeft,
  Plus,
  LogOut,
  Sun,
  Moon,
  Users,
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { createClient } from '@/lib/supabase/client';

interface SidebarProps {
  workspace: Workspace;
  profile: Profile;
  folders: Folder[];
  memberCount: number;
  userRole: string;
}

export function Sidebar({ workspace, profile, folders, memberCount, userRole }: SidebarProps) {
  const { sidebarOpen, sidebarWidth, setSidebarWidth, toggleSidebar, activeSection, setActiveSection } =
    useUIStore();
  const [isResizing, setIsResizing] = useState(false);
  const [mounted, setMounted] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const supabase = createClient();

  const basePath = `/workspace/${workspace.slug}`;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (pathname.includes('/home')) setActiveSection('home');
    else if (pathname.includes('/documents')) setActiveSection('documents');
    else if (pathname.includes('/starred')) setActiveSection('starred');
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
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  }

  async function handleNewDocument() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

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

    if (!error && doc) {
      router.push(`${basePath}/doc/${doc.id}`);
    }
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
            className="relative flex h-full flex-col overflow-hidden border-r-0 bg-[var(--bg-surface)] shadow-sm"
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

              {/* New document button */}
              <div className="px-3 py-2">
                <button
                  onClick={handleNewDocument}
                  className="flex w-full items-center gap-2 rounded-[var(--radius-md)] px-3 py-2 text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  {STRINGS.workspace.newDocument}
                </button>
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
                    active={false}
                    href={`${basePath}/documents`}
                  />
                  <NavItem
                    icon={<Trash2 className="h-4 w-4" />}
                    label={STRINGS.workspace.trash}
                    active={activeSection === 'trash'}
                    href={`${basePath}/trash`}
                  />
                </div>

                {/* Folder tree */}
                {folders.length > 0 && (
                  <div className="mt-6">
                    <span className="px-3 text-[10px] font-medium uppercase tracking-wider text-[var(--text-tertiary)]">
                      Folders
                    </span>
                    <FolderTree folders={folders} basePath={basePath} workspaceId={workspace.id} />
                  </div>
                )}
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
