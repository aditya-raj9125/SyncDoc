// App-level type definitions that complement @syncdoc/types

import type { Editor } from '@tiptap/react';
import type { Document, Profile, Workspace, Comment } from '@syncdoc/types';

// ---- Editor Types ----

export interface EditorContext {
  editor: Editor;
  document: Document;
  workspace: Workspace;
  profile: Profile;
  isReadOnly: boolean;
}

export interface SlashCommandItem {
  title: string;
  description: string;
  icon: React.ReactNode;
  command: (editor: Editor) => void;
  aliases?: string[];
  group: 'basic' | 'media' | 'advanced' | 'ai';
}

export interface ToolbarAction {
  id: string;
  label: string;
  icon: React.ReactNode;
  isActive?: boolean;
  onClick: () => void;
  shortcut?: string;
}

// ---- Collaboration Types ----

export interface CursorPosition {
  anchor: number;
  head: number;
}

export interface RemoteUser {
  clientId: number;
  id: string;
  name: string;
  color: string;
  avatarUrl: string | null;
  cursor: CursorPosition | null;
  isTyping: boolean;
  lastActive: number;
}

// ---- Comment Types ----

export interface CommentWithProfile extends Comment {
  profiles?: Profile;
  replies?: CommentWithProfile[];
}

export interface CommentAnchor {
  from: number;
  to: number;
  text: string;
}

// ---- AI Types ----

export interface AiMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface AiAction {
  label: string;
  prompt: string;
  icon?: React.ReactNode;
}

// ---- Export Types ----

export type ExportFormat = 'pdf' | 'docx' | 'markdown' | 'html';

export interface ExportOptions {
  format: ExportFormat;
  includeComments?: boolean;
  includeMetadata?: boolean;
}

// ---- Sharing Types ----

export interface ShareSettings {
  isPublic: boolean;
  allowEditing: boolean;
  requireAuth: boolean;
  expiresAt: string | null;
}

// ---- Keyboard Shortcuts ----

export interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  description: string;
  action: () => void;
}

// ---- Search Types ----

export interface SearchResult {
  documentId: string;
  title: string;
  snippet: string;
  score: number;
}

export interface CommandAction {
  id: string;
  label: string;
  description?: string;
  icon?: React.ReactNode;
  shortcut?: string;
  action: () => void;
  category: 'navigation' | 'editor' | 'document' | 'workspace';
}
