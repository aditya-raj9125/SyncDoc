import { createClient } from '@supabase/supabase-js';
import { applyUpdate, encodeStateAsUpdate, Doc } from 'yjs';
import type { Extension } from '@hocuspocus/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Track change counts per document for auto-snapshots
const changeCounts = new Map<string, number>();
const SNAPSHOT_THRESHOLD = 50;

export const databaseExtension: Extension = {
  async onLoadDocument({ documentName, document }) {
    const docId = documentName;

    const { data, error } = await supabase
      .from('documents')
      .select('ydoc_state')
      .eq('id', docId)
      .single();

    if (error) {
      console.error(`[Persistence] Failed to load doc ${docId}:`, error.message);
      return document;
    }

    if (data?.ydoc_state) {
      try {
        const state = Buffer.from(data.ydoc_state, 'base64');
        applyUpdate(document, new Uint8Array(state));
      } catch (e) {
        console.error(`[Persistence] Failed to apply state for doc ${docId}:`, e);
      }
    }

    changeCounts.set(docId, 0);
    return document;
  },

  async onStoreDocument({ documentName, document }) {
    const docId = documentName;
    const state = encodeStateAsUpdate(document);
    const base64State = Buffer.from(state).toString('base64');

    // Persist to documents table
    const { error } = await supabase
      .from('documents')
      .update({
        ydoc_state: base64State,
        last_edited_at: new Date().toISOString(),
      })
      .eq('id', docId);

    if (error) {
      console.error(`[Persistence] Failed to store doc ${docId}:`, error.message);
      return;
    }

    // Auto-snapshot logic
    const count = (changeCounts.get(docId) || 0) + 1;
    changeCounts.set(docId, count);

    if (count >= SNAPSHOT_THRESHOLD) {
      changeCounts.set(docId, 0);
      await createSnapshot(docId, state);
    }
  },

  async onDisconnect({ documentName, document, clientsCount }) {
    // On last user disconnect, force persist
    if (clientsCount <= 1) {
      const docId = documentName;
      const state = encodeStateAsUpdate(document);
      const base64State = Buffer.from(state).toString('base64');

      await supabase
        .from('documents')
        .update({
          ydoc_state: base64State,
          last_edited_at: new Date().toISOString(),
        })
        .eq('id', docId);

      changeCounts.delete(docId);
    }
  },
};

async function createSnapshot(docId: string, state: Uint8Array) {
  const base64Snapshot = Buffer.from(state).toString('base64');

  // Get word count from text content
  const tempDoc = new Doc();
  applyUpdate(tempDoc, state);
  const text = tempDoc.getText('default').toString();
  const wordCount = text.split(/\s+/).filter(Boolean).length;
  tempDoc.destroy();

  const { error } = await supabase.from('document_revisions').insert({
    document_id: docId,
    ydoc_snapshot: base64Snapshot,
    word_count: wordCount,
    label: 'Auto-save',
  });

  if (error) {
    console.error(`[Persistence] Failed to create snapshot for ${docId}:`, error.message);
  }
}
