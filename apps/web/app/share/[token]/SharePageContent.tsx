'use client';

import { useEffect, useState, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import { getExtensions } from '@/lib/tiptap/extensions';
import { createProvider, destroyProvider } from '@/lib/yjs/provider';
import { createBrowserClient } from '@/lib/supabase/client';
import Collaboration from '@tiptap/extension-collaboration';
import CollaborationCursor from '@tiptap/extension-collaboration-cursor';
import * as Y from 'yjs';
import { FileText, LogIn } from 'lucide-react';

interface SharePageContentProps {
  document: {
    id: string;
    title: string;
    emoji_icon?: string;
    content?: Record<string, unknown>;
  };
  accessLevel: string;
  isAuthenticated: boolean;
  token: string;
}

const CURSOR_COLORS = [
  '#958DF1', '#F98181', '#FBBC88', '#FAF594', '#70CFF8',
  '#94FADB', '#B9F18D', '#E8A0BF', '#FFC078', '#8CE99A',
];

export function SharePageContent({
  document,
  accessLevel,
  isAuthenticated,
  token,
}: SharePageContentProps) {
  const canEdit = accessLevel === 'edit';
  const isReadonly = !canEdit;
  const supabase = createBrowserClient();

  const [ydoc, setYdoc] = useState<Y.Doc | null>(null);
  const [hocusProvider, setHocusProvider] = useState<any>(null);
  const [userName, setUserName] = useState('Guest');

  // Random names for guests
  const GUEST_NAMES = ['Phoenix', 'Luna', 'Atlas', 'Nova', 'Storm', 'Echo', 'River', 'Sage', 'Aero', 'Zephyr'];

  // Initialize Yjs provider for collaborative editing
  useEffect(() => {
    if (!canEdit) return; // Read-only users don't need Yjs

    let mounted = true;

    async function initProvider() {
      // For guests, we don't have a token, but Hocuspocus may allow anonymous connection
      const { data: { session } } = await supabase.auth.getSession();
      const jwtToken = session?.access_token || '';

      if (session?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('display_name')
          .eq('id', session.user.id)
          .single();
        if (profile && mounted) {
          setUserName(profile.display_name || 'Guest');
        }
      } else {
        // Generate random guest name
        const randomName = `Guest ${GUEST_NAMES[Math.floor(Math.random() * GUEST_NAMES.length)]}`;
        setUserName(randomName);
      }

      const { provider, ydoc: yDoc } = createProvider({
        documentId: document.id,
        token: jwtToken || null,
        onStatus(status) {
          console.log('[SharePage] Connection status:', status);
        },
        onSynced() {
          console.log('[SharePage] Yjs synced for', document.id);
        },
      });

      if (mounted) {
        setYdoc(yDoc);
        setHocusProvider(provider);
      }
    }

    initProvider();

    return () => {
      mounted = false;
      destroyProvider(document.id);
      setHocusProvider(null);
    };
  }, [document.id, canEdit]);

  // Build extensions — with Yjs if collaborative, without if read-only
  const extensions = (canEdit && ydoc && hocusProvider)
    ? [
        ...getExtensions(),
        Collaboration.configure({
          document: ydoc,
        }),
        CollaborationCursor.configure({
          provider: hocusProvider,
          user: {
            name: userName,
            color: CURSOR_COLORS[Math.floor(Math.random() * CURSOR_COLORS.length)],
          },
        }),
      ]
    : getExtensions();

  const editor = useEditor(
    {
      immediatelyRender: false,
      extensions,
      content: (canEdit && ydoc) ? undefined : (document.content || { type: 'doc', content: [] }),
      editable: !isReadonly,
      editorProps: {
        attributes: {
          class: 'prose prose-stone max-w-none focus:outline-none',
        },
      },
    },
    [ydoc, hocusProvider] // Recreate when provider changes
  );

  return (
    <div className="min-h-screen bg-[var(--bg-canvas)]">
      {/* Top banner */}
      {!isAuthenticated && (
        <div className="sticky top-0 z-50 flex items-center justify-between border-b border-[var(--bg-border)] bg-[var(--bg-surface)] px-4 py-2">
          <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
            <FileText size={16} />
            <span>You&apos;re viewing a shared document</span>
          </div>
          <a
            href={`/login?next=/share/${token}`}
            className="flex items-center gap-1.5 rounded-[var(--radius-md)] bg-[var(--brand-primary)] px-3 py-1.5 text-sm text-white hover:bg-[var(--brand-primary-hover)] transition-colors"
          >
            <LogIn size={14} />
            Sign in to collaborate
          </a>
        </div>
      )}

      {isAuthenticated && isReadonly && (
        <div className="sticky top-0 z-50 flex items-center justify-center border-b border-[var(--bg-border)] bg-[var(--bg-elevated)] px-4 py-2">
          <span className="text-sm text-[var(--text-secondary)]">
            View only — you can read but not edit this document
          </span>
        </div>
      )}

      {isAuthenticated && canEdit && (
        <div className="sticky top-0 z-50 flex items-center justify-center border-b border-[var(--bg-border)] bg-[var(--bg-elevated)] px-4 py-2">
          <span className="text-sm text-green-600">
            ✓ You have edit access — changes sync in real time
          </span>
        </div>
      )}

      {/* Document */}
      <div className="mx-auto max-w-[800px] px-6 py-12 md:px-[120px]">
        <h1
          className="mb-8 text-[48px] font-normal leading-[1.1] text-[var(--text-primary)]"
          style={{ fontFamily: "'Instrument Serif', serif" }}
        >
          {document.emoji_icon && (
            <span className="mr-3">{document.emoji_icon}</span>
          )}
          {document.title || 'Untitled'}
        </h1>

        {editor && (
          <EditorContent
            editor={editor}
            className="syncdoc-editor"
          />
        )}
      </div>
    </div>
  );
}
