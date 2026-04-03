'use client';

import { useState, useCallback, useEffect } from 'react';
import { useEditor as useTiptapEditor, type Editor } from '@tiptap/react';
import { getExtensions } from '@/lib/tiptap/extensions';
import { useEditorStore } from '@/store/editorStore';
import { createBrowserClient } from '@/lib/supabase/client';
import { debounce } from '@syncdoc/utils';
import type { Document } from '@syncdoc/types';

interface UseEditorOptions {
  document: Document;
  editable?: boolean;
}

export function useEditor({ document: doc, editable = true }: UseEditorOptions) {
  const {
    setWordCount,
    setCharacterCount,
    setSaving,
  } = useEditorStore();

  const supabase = createBrowserClient();

  const debouncedSave = useCallback(
    debounce(async (json: Record<string, unknown>) => {
      setSaving(true);
      await supabase
        .from('documents')
        .update({
          content: json,
          last_edited_at: new Date().toISOString(),
        })
        .eq('id', doc.id);
      setSaving(false);
    }, 3000),
    [doc.id]
  );

  const editor = useTiptapEditor({
    immediatelyRender: false,
    extensions: getExtensions(),
    content: '<p></p>',
    editable,
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

      if (editable) {
        debouncedSave(editor.getJSON());
      }
    },
  });

  return editor;
}
