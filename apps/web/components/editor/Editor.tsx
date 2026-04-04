'use client';

import { useEffect, useCallback, useRef, useState, KeyboardEvent } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import { getExtensions } from '@/lib/tiptap/extensions';
import { useEditorStore } from '@/store/editorStore';
import { createBrowserClient } from '@/lib/supabase/client';
import { createProvider, destroyProvider } from '@/lib/yjs/provider';
import { usePresenceStore } from '@/store/presenceStore';
import { debounce } from '@syncdoc/utils';
import { FloatingToolbar } from './FloatingToolbar';
import { SlashCommandMenu } from './SlashCommandMenu';
import type { Document, Workspace, Profile } from '@syncdoc/types';
import type { AccessLevel } from '@/lib/permissions';
import { motion, AnimatePresence } from 'framer-motion';
import Collaboration from '@tiptap/extension-collaboration';
import CollaborationCursor from '@tiptap/extension-collaboration-cursor';
import * as Y from 'yjs';
import {
  ImagePlus,
  Smile,
  X,
} from 'lucide-react';

interface EditorProps {
  document: Document;
  workspace: Workspace;
  profile: Profile;
  accessLevel: AccessLevel;
}

const COVER_GRADIENTS = [
  'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
  'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
  'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
  'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)',
  'linear-gradient(135deg, #fccb90 0%, #d57eeb 100%)',
  'linear-gradient(135deg, #e0c3fc 0%, #8ec5fc 100%)',
  'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
  'linear-gradient(135deg, #667eea 0%, #38f9d7 100%)',
];

const EMOJI_PRESETS = [
  '📄', '📝', '📋', '📌', '📎', '📐', '📊', '📈',
  '🎯', '🚀', '💡', '🔥', '⭐', '💎', '🎨', '🏆',
  '📚', '🗂️', '📁', '🗒️', '✏️', '🖊️', '📖', '📘',
  '🤖', '🧠', '💻', '⚡', '🌟', '🎉', '✅', '🔧',
];

// Random colors for collaboration cursors
const CURSOR_COLORS = [
  '#958DF1', '#F98181', '#FBBC88', '#FAF594', '#70CFF8',
  '#94FADB', '#B9F18D', '#E8A0BF', '#FFC078', '#8CE99A',
];

function getRandomColor() {
  return CURSOR_COLORS[Math.floor(Math.random() * CURSOR_COLORS.length)];
}

export function Editor({ document: doc, workspace, profile, accessLevel }: EditorProps) {
  const {
    title,
    emojiIcon,
    coverImageUrl,
    setTitle,
    setEmojiIcon,
    setCoverImageUrl,
    setWordCount,
    setCharacterCount,
    setSaving,
    setConnectionStatus,
  } = useEditorStore();

  const titleRef = useRef<HTMLTextAreaElement>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showCoverPicker, setShowCoverPicker] = useState(false);
  const [showHoverControls, setShowHoverControls] = useState(false);
  const ydocRef = useRef<Y.Doc | null>(null);
  const supabase = createBrowserClient();

  const canEdit = accessLevel === 'edit' || accessLevel === 'owner';

  // Initialize Yjs provider
  const [ydoc, setYdoc] = useState<Y.Doc | null>(null);
  const [hocusProvider, setHocusProvider] = useState<any>(null);

  useEffect(() => {
    let mounted = true;

    async function initProvider() {
      // Get fresh JWT from Supabase session
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token || '';

      const { provider, ydoc: yDoc } = createProvider({
        documentId: doc.id,
        token,
        onStatus(status) {
          if (mounted) setConnectionStatus(status);
        },
        onSynced() {
          console.log('[Editor] Yjs synced for', doc.id);
        },
      });

      if (mounted) {
        ydocRef.current = yDoc;
        setYdoc(yDoc);
        setHocusProvider(provider);
      }
    }

    initProvider();

    return () => {
      mounted = false;
      destroyProvider(doc.id);
      ydocRef.current = null;
      setHocusProvider(null);
    };
  }, [doc.id]);

  // Sync awareness with presence store
  useEffect(() => {
    if (!hocusProvider) return;

    const handleAwarenessUpdate = () => {
      const awarenessData = hocusProvider.awareness.getStates();
      usePresenceStore.getState().setUsers(awarenessData);
      usePresenceStore.getState().setLocalClientId(hocusProvider.awareness.clientID);
    };

    hocusProvider.awareness.on('update', handleAwarenessUpdate);
    // Initial sync
    handleAwarenessUpdate();

    return () => {
      hocusProvider.awareness.off('update', handleAwarenessUpdate);
    };
  }, [hocusProvider]);

  // Debounced save for title
  const debouncedSaveTitle = useCallback(
    debounce(async (newTitle: string) => {
      setSaving(true);
      await supabase
        .from('documents')
        .update({ title: newTitle, last_edited_at: new Date().toISOString() })
        .eq('id', doc.id);
      setSaving(false);
    }, 2000),
    [doc.id]
  );

  // Build extensions with Yjs collaboration
  const extensions = (ydoc && hocusProvider)
    ? [
        ...getExtensions(),
        Collaboration.configure({
          document: ydoc,
        }),
        CollaborationCursor.configure({
          provider: hocusProvider,
          user: {
            id: profile.id,
            name: profile.display_name || 'Anonymous',
            color: profile.avatar_color || getRandomColor(),
            avatar_url: profile.avatar_url,
            user: profile,
          },
        }),
      ]
    : getExtensions();

  const editor = useEditor(
    {
      immediatelyRender: false,
      extensions,
      editable: canEdit,
      editorProps: {
        attributes: {
          class: 'tiptap-content outline-none',
        },
      },
      onUpdate: ({ editor }) => {
        const text = editor.getText();
        const words = text.split(/\s+/).filter(Boolean).length;
        setWordCount(words);
        setCharacterCount(text.length);
      },
    },
    [ydoc, hocusProvider] // Recreate editor when ydoc or provider changes
  );

  // Update editable state when accessLevel changes
  useEffect(() => {
    if (editor) {
      editor.setEditable(canEdit);
    }
  }, [editor, canEdit]);

  // Title input handlers
  const handleTitleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newTitle = e.target.value;
    setTitle(newTitle);
    debouncedSaveTitle(newTitle);

    // Auto-resize textarea
    if (titleRef.current) {
      titleRef.current.style.height = 'auto';
      titleRef.current.style.height = `${titleRef.current.scrollHeight}px`;
    }
  };

  const handleTitleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      editor?.commands.focus('start');
    }
  };

  // Save emoji
  const handleEmojiSelect = async (emoji: string) => {
    setEmojiIcon(emoji);
    setShowEmojiPicker(false);
    await supabase
      .from('documents')
      .update({ emoji_icon: emoji })
      .eq('id', doc.id);
  };

  // Save cover
  const handleCoverSelect = async (gradient: string) => {
    setCoverImageUrl(gradient);
    setShowCoverPicker(false);
    await supabase
      .from('documents')
      .update({ cover_image_url: gradient })
      .eq('id', doc.id);
  };

  const handleRemoveCover = async () => {
    setCoverImageUrl(null);
    setShowCoverPicker(false);
    await supabase
      .from('documents')
      .update({ cover_image_url: null })
      .eq('id', doc.id);
  };

  // Auto-resize title on mount
  useEffect(() => {
    if (titleRef.current) {
      titleRef.current.style.height = 'auto';
      titleRef.current.style.height = `${titleRef.current.scrollHeight}px`;
    }
  }, [title]);

  return (
    <div className="min-h-full bg-[var(--bg-canvas)]">
      {/* Cover Image */}
      <AnimatePresence>
        {coverImageUrl && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 200, opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="relative w-full overflow-hidden"
          >
            <div
              className="h-full w-full"
              style={{
                background: coverImageUrl.startsWith('linear-gradient')
                  ? coverImageUrl
                  : undefined,
                backgroundImage: coverImageUrl.startsWith('http')
                  ? `url(${coverImageUrl})`
                  : undefined,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            />
            {/* Bottom fade */}
            <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[var(--bg-canvas)] to-transparent" />
            {/* Cover actions */}
            {canEdit && (
              <div className="absolute right-4 top-4 flex gap-2 opacity-0 transition-opacity hover:opacity-100 group-hover:opacity-100">
                <button
                  onClick={() => setShowCoverPicker(true)}
                  className="rounded-[var(--radius-md)] bg-[var(--bg-surface)]/80 px-3 py-1.5 text-xs font-medium text-[var(--text-secondary)] backdrop-blur-sm hover:bg-[var(--bg-surface)]"
                >
                  Change cover
                </button>
                <button
                  onClick={handleRemoveCover}
                  className="rounded-[var(--radius-md)] bg-[var(--bg-surface)]/80 px-3 py-1.5 text-xs font-medium text-[var(--text-secondary)] backdrop-blur-sm hover:bg-[var(--bg-surface)]"
                >
                  Remove
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Editor canvas — max 800px, centered */}
      <div className="mx-auto max-w-[800px] px-6 pb-40 pt-20 md:px-[120px]">
        {/* Hover controls: Add cover / Add icon */}
        {canEdit && (
          <div
            className="relative mb-4"
            onMouseEnter={() => setShowHoverControls(true)}
            onMouseLeave={() => setShowHoverControls(false)}
          >
            <AnimatePresence>
              {showHoverControls && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex gap-2 mb-2"
                >
                  {!coverImageUrl && (
                    <button
                      onClick={() => setShowCoverPicker(true)}
                      className="flex items-center gap-1.5 rounded-[var(--radius-md)] px-2 py-1 text-xs text-[var(--text-tertiary)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-secondary)]"
                    >
                      <ImagePlus size={14} />
                      Add cover
                    </button>
                  )}
                  <button
                    onClick={() => setShowEmojiPicker(true)}
                    className="flex items-center gap-1.5 rounded-[var(--radius-md)] px-2 py-1 text-xs text-[var(--text-tertiary)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-secondary)]"
                  >
                    <Smile size={14} />
                    Add icon
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Emoji + Title */}
        <div className="relative mb-4">
          <div className="flex items-start gap-3">
            {/* Emoji icon */}
            <button
              onClick={() => canEdit && setShowEmojiPicker(!showEmojiPicker)}
              className="mt-1 flex-shrink-0 text-[28px] leading-none hover:opacity-80 transition-opacity"
              aria-label="Change document icon"
              disabled={!canEdit}
            >
              {emojiIcon}
            </button>

            {/* Title textarea */}
            <textarea
              ref={titleRef}
              value={title}
              onChange={handleTitleChange}
              onKeyDown={handleTitleKeyDown}
              placeholder="Untitled"
              rows={1}
              readOnly={!canEdit}
              className="w-full resize-none overflow-hidden bg-transparent font-serif text-[48px] font-normal leading-[1.2] tracking-tight text-[var(--text-primary)] placeholder:text-[var(--text-placeholder)] outline-none"
              style={{ fontFamily: 'var(--font-serif)' }}
            />
          </div>

          {/* Emoji picker dropdown */}
          <AnimatePresence>
            {showEmojiPicker && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute left-0 top-full z-50 mt-1 rounded-[var(--radius-lg)] border border-[var(--bg-border)] bg-[var(--bg-surface)] p-3 shadow-[var(--shadow-lg)]"
              >
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs font-medium text-[var(--text-secondary)]">Pick an icon</span>
                  <button onClick={() => setShowEmojiPicker(false)} className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)]">
                    <X size={14} />
                  </button>
                </div>
                <div className="grid grid-cols-8 gap-1">
                  {EMOJI_PRESETS.map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => handleEmojiSelect(emoji)}
                      className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] text-lg hover:bg-[var(--bg-elevated)] transition-colors"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Cover picker dropdown */}
          <AnimatePresence>
            {showCoverPicker && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute left-0 top-full z-50 mt-1 rounded-[var(--radius-lg)] border border-[var(--bg-border)] bg-[var(--bg-surface)] p-4 shadow-[var(--shadow-lg)]"
              >
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-xs font-medium text-[var(--text-secondary)]">Choose a cover</span>
                  <button onClick={() => setShowCoverPicker(false)} className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)]">
                    <X size={14} />
                  </button>
                </div>
                <div className="grid grid-cols-5 gap-2">
                  {COVER_GRADIENTS.map((gradient, i) => (
                    <button
                      key={i}
                      onClick={() => handleCoverSelect(gradient)}
                      className="h-12 w-16 rounded-[var(--radius-md)] border border-[var(--bg-border)] transition-transform hover:scale-105"
                      style={{ background: gradient }}
                    />
                  ))}
                </div>
                {coverImageUrl && (
                  <button
                    onClick={handleRemoveCover}
                    className="mt-3 w-full rounded-[var(--radius-md)] px-3 py-1.5 text-xs text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)]"
                  >
                    Remove cover
                  </button>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Tiptap editor content */}
        {editor && <FloatingToolbar editor={editor} />}
        <EditorContent
          editor={editor}
          className="tiptap-editor prose prose-stone dark:prose-invert max-w-none text-[17px] leading-[1.75] tracking-[-0.01em]"
        />
      </div>
    </div>
  );
}
