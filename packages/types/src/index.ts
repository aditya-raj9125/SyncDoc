// ============================================
// SyncDoc — Shared Types
// ============================================

// ---- Database Models ----

export interface Profile {
  id: string;
  display_name: string;
  avatar_url: string | null;
  avatar_color: string;
  bio: string | null;
  created_at: string;
  updated_at: string;
}

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  owner_id: string;
  plan: WorkspacePlan;
  created_at: string;
}

export type WorkspacePlan = 'free' | 'pro' | 'enterprise';

export interface WorkspaceMember {
  workspace_id: string;
  user_id: string;
  role: WorkspaceRole;
  joined_at: string;
}

export type WorkspaceRole = 'owner' | 'admin' | 'member' | 'viewer';

export interface Folder {
  id: string;
  workspace_id: string;
  parent_folder_id: string | null;
  name: string;
  created_by: string | null;
  created_at: string;
  position: number;
}

export interface Document {
  id: string;
  workspace_id: string;
  folder_id: string | null;
  title: string;
  emoji_icon: string;
  cover_image_url: string | null;
  owner_id: string | null;
  ydoc_state: Uint8Array | null;
  word_count: number;
  character_count: number;
  is_public: boolean;
  public_access: PublicAccessLevel;
  share_token: string;
  status: DocumentStatus;
  original_filename: string | null;
  last_edited_by: string | null;
  last_edited_at: string;
  created_at: string;
  deleted_at: string | null;
  position: number;
}

export type PublicAccessLevel = 'none' | 'view' | 'comment' | 'edit';
export type DocumentStatus = 'draft' | 'published' | 'archived';
export type SourceType = 'blank' | 'uploaded' | 'template';

export interface DocumentPermission {
  document_id: string;
  user_id: string;
  access: AccessLevel;
  granted_by: string | null;
  granted_at: string;
}

export type AccessLevel = 'view' | 'comment' | 'edit' | 'owner';

export interface DocumentRevision {
  id: string;
  document_id: string;
  ydoc_snapshot: Uint8Array;
  title: string | null;
  created_by: string | null;
  created_at: string;
  label: string | null;
  delta_size_bytes: number | null;
}

export interface Comment {
  id: string;
  document_id: string;
  author_id: string | null;
  parent_comment_id: string | null;
  thread_id: string | null;
  anchor_from: number | null;
  anchor_to: number | null;
  quoted_text: string | null;
  body: string;
  resolved: boolean;
  resolved_by: string | null;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface DocumentLink {
  id: string;
  source_document_id: string;
  target_document_id: string;
  link_type: LinkType;
  created_at: string;
}

export type LinkType = 'mention' | 'embed' | 'backlink';

export interface ShareInvitation {
  id: string;
  document_id: string;
  invited_email: string;
  access: Exclude<AccessLevel, 'owner'>;
  invited_by: string | null;
  token: string;
  accepted: boolean;
  expires_at: string;
  created_at: string;
}

// ---- Presence / Awareness ----

export interface AwarenessUser {
  id: string;
  name: string;
  color: string;
  avatar_url: string | null;
  user?: Profile; // Reference to the full profile
}

export interface AwarenessCursor {
  anchor: number;
  head: number;
}

export interface AwarenessState {
  user: AwarenessUser;
  cursor: AwarenessCursor | null;
  isTyping: boolean;
  lastSeen: number;
}

// ---- AI ----

export type AiAction =
  | 'improve'
  | 'fix_grammar'
  | 'make_shorter'
  | 'make_longer'
  | 'change_tone'
  | 'translate'
  | 'explain'
  | 'summarize'
  | 'custom';

export interface AiRequest {
  action: AiAction;
  prompt?: string;
  selectedText?: string;
  documentContext?: string;
  targetLanguage?: string;
}

export interface AiStreamChunk {
  type: 'text' | 'done' | 'error';
  content: string;
}

// ---- UI State ----

export interface EditorState {
  documentId: string | null;
  isLoading: boolean;
  isSaving: boolean;
  isOffline: boolean;
  connectionStatus: ConnectionStatus;
  wordCount: number;
  characterCount: number;
  focusMode: boolean;
}

export type ConnectionStatus = 'connected' | 'connecting' | 'disconnected' | 'synced';

export interface SidebarState {
  isOpen: boolean;
  width: number;
  activeSection: SidebarSection;
}

export type SidebarSection =
  | 'home'
  | 'documents'
  | 'starred'
  | 'shared'
  | 'archive'
  | 'trash';



// ---- API Response Types ----

export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
}

export interface PaginatedResponse<T> {
  data: T[];
  count: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

// ---- Document with relations ----

export interface DocumentWithMeta extends Document {
  owner?: Profile;
  last_editor?: Profile;
  permissions?: DocumentPermission[];
  folder?: Folder;
}

export interface CommentWithAuthor extends Comment {
  author?: Profile;
  replies?: CommentWithAuthor[];
}

export interface RevisionWithAuthor extends DocumentRevision {
  author?: Profile;
}

// ---- Constants ----

export const AVATAR_COLORS = [
  '#6366f1', // indigo
  '#ec4899', // pink
  '#10b981', // emerald
  '#f59e0b', // amber
  '#3b82f6', // blue
  '#8b5cf6', // violet
  '#ef4444', // red
  '#14b8a6', // teal
] as const;

export const MAX_TITLE_LENGTH = 500;
export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB
export const MAX_IMAGE_SIZE_BYTES = 2 * 1024 * 1024; // 2MB
export const MAX_DOC_SIZE_BYTES = 10 * 1024 * 1024; // 10MB Yjs state
export const AWARENESS_THROTTLE_MS = 100;
export const AWARENESS_HIGH_LOAD_THROTTLE_MS = 500;
export const AUTOSAVE_INTERVAL_MS = 30_000;
export const REVISION_INTERVAL_CHANGES = 50;
export const AI_RATE_LIMIT_FREE = 10;
export const AI_RATE_LIMIT_PRO = 100;
export const INVITE_EXPIRY_DAYS = 7;
export const TRASH_RETENTION_DAYS = 30;
export const MAX_FOLDER_DEPTH = 4;
export const MAX_PRESENCE_VISIBLE = 5;
export const RECONNECT_BACKOFF = [1000, 2000, 4000, 8000, 30000] as const;
