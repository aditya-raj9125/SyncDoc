# SyncDoc — Bug Fix & Production Hardening Prompt for Antigravity

## Role Context

You are a senior full-stack engineer with deep expertise in Next.js 14, Supabase, Yjs/Hocuspocus, and Tiptap. You have studied how Google Docs, Notion, and Linear handle real-time sync, optimistic UI, and permission systems at scale. You write clean, typed, well-structured code with no shortcuts. Every fix below must be production-quality — no hacks, no workarounds that create new bugs.

The screenshots provided show: Image 1 — the current working editor with dark theme, sidebar navigation including Home, All Documents, Starred, Shared with me, Archive, Trash, and a document open called "dEMO". Image 2 — a broken PDF export where content is clipped and cut off at the right edge, showing the export pipeline is not correctly computing page dimensions or margins.

---

## FIX 1 — Sidebar Collapse Animation Lag and Fuzziness

**Problem:** The sidebar collapse and expand has visible lag and fuzziness — likely caused by animating `width` on a DOM element (which triggers layout reflow on every frame), combined with child content not being hidden during transition causing text to wrap and reflow mid-animation.

**What to fix:**

Never animate `width` directly on the sidebar container. Instead, use a CSS `transform: translateX()` approach combined with `overflow: hidden` on a fixed-width wrapper. The sidebar must always be rendered at its full 240px width in the DOM — what changes is its translated position and the wrapper's clipping. This is exactly how Linear and Notion implement their sidebar — the content never reflows because the layout width never changes during animation.

The implementation must use a wrapper div set to `width: 240px; overflow: hidden; flex-shrink: 0` with a CSS transition on `width: 0` to `width: 240px` — but only if your current architecture makes the transform approach impractical. If using Framer Motion, use `motion.div` with `animate={{ width: collapsed ? 0 : 240 }}` and `transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}` — the cubic-bezier easing eliminates the fuzziness by removing the linear interpolation that causes perceived jank.

The sidebar toggle button must be outside the animated container so it never moves during the animation. Add `will-change: transform` to the sidebar element only during the transition (add class on toggle start, remove on `transitionend` event) — never set `will-change` permanently as it wastes GPU memory. All sidebar child text must have `white-space: nowrap; overflow: hidden` so text never wraps mid-animation. Folder tree items must have `opacity` transition in addition to the width so they fade out cleanly rather than being hard-clipped.

---

## FIX 2 — Duplicate "Shared with Me" Sections in Sidebar

**Problem:** Two "Shared with me" sections appear in the sidebar — one functional, one broken. This is a component registration or routing issue where the sidebar nav items array has a duplicate entry, or there are two separate components both rendering a "Shared with me" nav item.

**What to fix:**

Audit the sidebar navigation configuration — wherever the nav items array is defined (likely a constants file or directly in `Sidebar.tsx`), find and remove the duplicate entry. There must be exactly one nav item object with the route pointing to the shared-with-me page.

Beyond the duplicate fix, also audit the shared-with-me page's data query. The query must fetch documents from `document_permissions` where `user_id = currentUser.id` AND the document's `owner_id != currentUser.id` AND `deleted_at IS NULL`. If the current query is a JOIN that produces duplicate rows due to multiple permission records for the same document, add a `DISTINCT ON (documents.id)` or use `.select('*, documents!inner(*)')` with proper deduplication. Never show a document twice in the shared-with-me list even if the user has multiple permission records for it.

---

## FIX 3 — Unique Random Share Links Per Access Level

**Problem:** All three access types (view, comment, edit) generate the same share link. This is a security flaw — changing someone's access from edit to view doesn't revoke the old link.

**What to fix:**

The database schema must have three separate token columns on the `documents` table — or better, move to a dedicated `share_links` table with one row per access level per document. The recommended architecture matching how Notion handles this:

Create a `share_links` table with columns: `id UUID PRIMARY KEY`, `document_id UUID REFERENCES documents(id) ON DELETE CASCADE`, `access_level TEXT CHECK (access_level IN ('view', 'comment', 'edit'))`, `token TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex')`, `created_by UUID REFERENCES profiles(id)`, `is_active BOOLEAN DEFAULT TRUE`, `created_at TIMESTAMPTZ DEFAULT NOW()`, with a UNIQUE constraint on `(document_id, access_level)`. The token is generated using `gen_random_bytes(32)` which produces a 64-character hex string — cryptographically random, not rule-based, not guessable, not derived from the document ID or access level in any way.

The share modal's "Share link" tab must call a Supabase function that does an `UPSERT` into `share_links` for the selected access level — creating the token if it doesn't exist, returning the existing one if it does. Display the link as `https://syncdoc.app/share/[token]`. The token itself reveals nothing about the access level or document — it is purely random. When the `/share/[token]` route resolves, it looks up the `share_links` table to find the associated document and access level.

"Disable link" for a specific access level must set `is_active = FALSE` on that specific row AND regenerate a new token immediately (so the old URL is permanently dead). The new token is shown in the UI. Each access level has its own independent "disable link" and "copy link" button in the share modal.

---

## FIX 4 — Share Modal Opening Animation Jank (Bottom-Right Corner Flash)

**Problem:** The share modal briefly appears in the bottom-right corner before snapping to center — a classic React portal positioning race condition where the modal renders before the CSS centering styles are applied.

**What to fix:**

The root cause is almost always one of: the modal renders outside a portal (so it inherits relative positioning from a parent), or the initial render has no transform/opacity applied and the first paint happens before the animation starts.

The fix requires three things done together. First, ensure the modal renders into a React portal attached to `document.body` using `ReactDOM.createPortal`. Second, the modal overlay must have `position: fixed; inset: 0; display: flex; align-items: center; justify-content: center` — never use absolute positioning for modal overlays. Third, the modal must start invisible — set initial state to `opacity: 0; transform: scale(0.96)` and animate to `opacity: 1; transform: scale(1)` using Framer Motion's `AnimatePresence` with `initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }} transition={{ duration: 0.15, ease: 'easeOut' }}`. The key point is that the initial state is set before the first paint, so the modal is never visible in the wrong position. Never use `useEffect` to set a "mounted" class for the animation — that always causes the flicker you're seeing.

---

## FIX 5 — Shared Users Can Edit Document Title

**Problem:** Recipients of a shared document cannot rename the document title even when they have edit access.

**What to fix:**

The document title input's `readOnly` or `disabled` prop is currently controlled by an `isOwner` check. Replace every ownership check on the title input with an `effectivePermission` check. The title must be editable when `effectivePermission === 'edit'` regardless of whether the user is the owner.

Title changes must sync via Yjs awareness — not via a direct Supabase update from each client. The title should be stored in a Yjs shared type (a `Y.Text` named `'title'`) so that simultaneous title edits from multiple users converge via CRDT. The title input's `onChange` handler must update the Yjs shared text, and a Yjs observer must update the Supabase `documents.title` column (debounced 2 seconds) via the Hocuspocus server-side persistence hook — never directly from the client for title updates, to avoid race conditions between multiple editors.

The document title update must also propagate to the sidebar in real time for all users who have the document visible in their sidebar (All Documents, Shared with me). Implement this via a Supabase Realtime subscription on `documents` table filtered to `id = [docId]` — when `title` changes, all subscribed clients update their local document list state in Zustand without a page reload.

---

## FIX 6, 7, 8 — PDF and DOCX Export Complete Rewrite

**Problem:** PDF export produces a clipped, incorrectly sized document (as seen in the screenshot — content is cut off and the page is the wrong dimensions). DOCX export throws `saveAs is not a function`. Both exporters are broken.

**Architecture decision — use the Print-to-PDF pipeline as the foundation:**

Since Print is confirmed working, build both PDF and DOCX export on top of a clean, reliable pipeline. Here is the exact architecture to implement:

**PDF Export:** Create a dedicated export route at `/workspace/[slug]/doc/[docId]/export/pdf` that is a Next.js page rendering only the document content — no sidebar, no topbar, no chrome — with print-optimized CSS. This page uses `@media print` styles: `@page { size: A4; margin: 2cm; }`, body width 100%, no fixed-width containers, all images `max-width: 100%`. The export is triggered by: the client opens this route in a hidden iframe, calls `iframe.contentWindow.print()`, and the browser's print-to-PDF dialog opens with the content perfectly formatted. For programmatic PDF generation (no dialog), use `html2canvas` + `jsPDF` as follows: serialize the Tiptap editor's HTML content from the Yjs state, render it into a hidden off-screen div with the same editor CSS applied, use `html2canvas` to capture it at 2x pixel ratio, then use `jsPDF` with A4 dimensions (210mm × 297mm), calculate the correct number of pages by dividing the total canvas height by the page height ratio, and use `pdf.addImage` for each page slice. This approach is immune to the clipping bug because it correctly paginates.

**DOCX Export:** The `saveAs is not a function` error means `file-saver` is either not installed, not imported correctly, or being called in a server context. Fix: install `file-saver` and `@types/file-saver` via pnpm. Import it as `import { saveAs } from 'file-saver'` — not as a default import. The DOCX generation must use the `docx` npm package to convert ProseMirror JSON (obtained from the Yjs document via `prosemirrorJSONToYDoc` deserialization) into a proper DOCX structure. Walk the ProseMirror node tree recursively: `heading` nodes → `docx.Paragraph` with `HeadingLevel.HEADING_1/2/3`; `paragraph` nodes → `docx.Paragraph`; `bold`/`italic`/`underline` marks → `docx.TextRun` with `bold: true` / `italics: true` / `underline: {}`; `bulletList` → `docx.Paragraph` with `bullet: { level: 0 }`; `table` nodes → `docx.Table`. Generate the blob with `docx.Packer.toBlob(doc)` then call `saveAs(blob, 'filename.docx')`. Wrap the entire export function in a try/catch that surfaces a specific error toast if any node type is unhandled.

Both export functions must be in `lib/export/toPdf.ts` and `lib/export/toDocx.ts` as pure async functions that accept the Tiptap editor instance and document title as arguments. They must never be called server-side — add a guard `if (typeof window === 'undefined') return` at the top of each.

---

## FIX 9 — All Documents Section Shows Shared Documents With Owner Name

**Problem:** The All Documents section only shows documents the user owns, excluding documents shared with them.

**What to fix:**

The All Documents query must use a UNION pattern: fetch documents where `owner_id = currentUser.id` UNION fetch documents where a `document_permissions` row exists for `user_id = currentUser.id`. In Supabase this is best implemented as a database view or a single query using an OR condition with a join: `SELECT documents.*, profiles.display_name as owner_name FROM documents LEFT JOIN profiles ON documents.owner_id = profiles.id WHERE (documents.owner_id = auth.uid() OR EXISTS (SELECT 1 FROM document_permissions WHERE document_id = documents.id AND user_id = auth.uid())) AND documents.deleted_at IS NULL ORDER BY documents.last_edited_at DESC`.

In the document card UI, add an owner attribution line below the document title: show the owner's avatar (16px) + display name in `text-xs text-secondary` style — but only show this line when the document is not owned by the current user. For owned documents, show nothing (no "You" label — that's redundant and clutters the UI). This is exactly how Google Drive's "All files" view works.

---

## FIX 10 — Word File Upload (.doc, .docx) With Editable Content

**Problem:** Word file upload may not be wired up or may not correctly convert .doc/.docx to editable Tiptap content.

**What to fix:**

The file upload input `accept` attribute must include `.doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document`. Note that `.doc` (old binary Word format) requires a different parser than `.docx` (OOXML). Use `mammoth.js` for both — it handles both formats. Call `mammoth.convertToHtml({ arrayBuffer })` client-side (mammoth runs in the browser — no Edge Function needed for the conversion itself). Take the resulting HTML and use Tiptap's `generateJSON` with `DOMParser` to convert HTML to ProseMirror JSON, then initialize the Yjs document with this content using `prosemirrorJSONToYDoc`. This means the uploaded Word file is immediately editable in the collaborative editor with full CRDT sync.

Preserve heading hierarchy from the Word doc — mammoth maps Word's "Heading 1" style to `<h1>`, which Tiptap's Heading extension then picks up correctly. Bold, italic, underline, bullet lists, and numbered lists are all preserved through the HTML intermediate format. Tables are preserved as Tiptap table nodes.

Show a progress indicator with three stages: "Reading file..." (FileReader progress), "Converting..." (mammoth processing), "Opening editor..." (Yjs initialization). Each stage shown as a step in a small progress stepper component, not just a spinner.

---

## FIX 11 — Dashboard UI/UX Professional Redesign

**Problem:** The current dashboard header and sidebar need to be more professional, neat, and clean.

**What to fix:**

Looking at the screenshot, the current UI has a good dark foundation but needs refinement in the following specific areas:

**Sidebar refinements:** The workspace name "Aditya Workspace" at the top needs a proper workspace avatar — a square rounded logo mark (32px, `border-radius: 8px`) filled with the first letter of the workspace name in the brand color, not just the "A" circle that looks like a user avatar. Add a subtle chevron-down next to the workspace name to indicate it's a switcher. The nav items (Home, All Documents, Starred, Shared with me, Archive, Trash) need consistent 36px height, 8px horizontal padding, 6px border-radius, with a left accent bar (3px wide, brand color) on the active item instead of the current full-background highlight which feels heavy. Add hover states that are lighter — `bg-opacity-8` of the brand color, not a solid fill. The "DOCUMENTS" section label needs to be in the `text-label` style (10px, uppercase, letter-spacing 0.08em, secondary text color) with consistent spacing. The sidebar bottom section (1 members, Light mode, ADITYA RAJ) needs a proper divider line above it and the user row should be a proper user menu trigger with a hover state.

**Topbar refinements:** The current topbar shown in the screenshot has the back arrow, star icon, connecting status, word count, and Share button — but they feel scattered. Implement a proper topbar with three zones: left zone (back button + breadcrumb showing folder path → document title), center zone (connection status indicator as a small pill — not raw text), right zone (word count + presence avatars + Share button + more options menu). The "connecting" yellow dot + text must be a refined status pill: 6px dot + "Syncing" text in `text-xs` — not the current large text that looks like debug output. The Share button must have a proper icon + label, filled with brand color, with a keyboard shortcut tooltip.

**General polish:** Add a 1px border on the right edge of the sidebar (`border-right: 1px solid var(--bg-border)`) instead of relying on background color contrast alone. Add `letter-spacing: -0.01em` to all heading text. The document title in the editor ("dEMO" in the screenshot) at 48px looks good but needs the emoji icon to its left to be slightly smaller (32px) and vertically centered with the title baseline, not top-aligned.

---

## FIX 12 — Real-Time Sync Across Entire Application (Rename, Folder Moves, All State)

**Problem:** Changes like renaming a document, moving a folder, starring a document, or any metadata change are not reflected until page reload. This is the most critical systemic issue.

**Architecture to implement — Supabase Realtime + Zustand optimistic store:**

This requires a unified real-time state management architecture. Here is the exact pattern to implement, modeled on how Notion handles it:

**Step 1 — Zustand as the single source of truth for all workspace state.** Create a `workspaceStore` in Zustand that holds: `documents: Document[]`, `folders: Folder[]`, `sharedDocuments: Document[]`, `starredDocumentIds: Set<string>`. All UI components read from this store — never fetch directly in components. On initial load, the workspace layout server component fetches all data and passes it as initial state to the Zustand store via a `WorkspaceStoreInitializer` client component.

**Step 2 — Optimistic updates for every mutation.** Every action (rename, move, star, delete, share) must follow this pattern: immediately update the Zustand store (optimistic), fire the Supabase mutation in the background, on success do nothing (store is already correct), on failure roll back the store to the previous state and show an error toast. This means the UI responds in 0ms — no waiting for network. This is the standard pattern used by Linear, Notion, and Vercel's dashboard.

**Step 3 — Supabase Realtime subscriptions for cross-client sync.** In the workspace layout (which persists across all route navigations), establish Supabase Realtime channel subscriptions on workspace mount and clean them up on workspace unmount. Subscribe to: `documents` table filtered to `workspace_id = [workspaceId]` for INSERT, UPDATE, DELETE events; `document_permissions` table filtered to `user_id = currentUser.id` for INSERT events (new shares); `folders` table filtered to `workspace_id = [workspaceId]` for all events; `user_document_preferences` table filtered to `user_id = currentUser.id` for star/pin changes.

Each Realtime event handler must apply the change to the Zustand store using the MERGE pattern — not a full refetch. On `UPDATE` event for a document rename: find the document in the store by ID and update only its `title` field. On `INSERT` event for a new shared document: add it to `sharedDocuments` array and show a toast "Someone shared a document with you." On `DELETE` event: remove from the relevant array. This means the entire application stays in sync across all tabs and all users with zero polling and zero page reloads.

**Step 4 — Document title sync specifically.** Document title changes must propagate via two channels simultaneously: Yjs awareness (for users currently inside the same document — they see the title change in real time as the other person types) and Supabase Realtime (for users in the sidebar or on the All Documents page — they see the document title update in the sidebar without being in the document). The Hocuspocus server's `onChange` hook must debounce title extraction from the Yjs state and write it to `documents.title` in Supabase — this then triggers the Realtime event that all sidebar subscribers receive.

**Step 5 — Connection state management.** The Supabase Realtime channel must handle `CHANNEL_ERROR` and `TIMED_OUT` states by attempting reconnection with exponential backoff (1s, 2s, 4s, 8s, max 30s). During reconnection, show the amber "Reconnecting..." banner. On successful reconnect, do a single full-refresh of the workspace store data to catch any changes missed during the disconnect window, then resume Realtime subscriptions.

---

## Performance Audit — Final Pass After All Fixes

After implementing all fixes above, apply the following performance hardening pass across the entire project:

**Database:** Run `EXPLAIN ANALYZE` on the three most frequent queries — All Documents list, Shared with me list, and document permission check. Ensure all have index scan plans, not sequential scans. Add any missing indexes identified.

**Bundle:** Run `next build` and check the bundle analyzer output. Any chunk above 100KB that is loaded on the initial workspace route must be converted to a dynamic import. Specifically: the Tiptap editor bundle, the Yjs bundle, and the export libraries (jsPDF, docx, file-saver) must all be dynamic imports loaded only when the editor route or export action is triggered.

**Supabase queries:** Every page's data fetching must use `Promise.all` for parallel queries. Zero sequential awaited Supabase calls where the second call doesn't depend on the first call's result.

**React renders:** Add `React.memo` to the sidebar nav items list, document cards, and presence avatars — these re-render on every Zustand store update otherwise. Use `useCallback` on all event handlers passed to memoized components. Use `useMemo` for derived data like filtered document lists and sorted folder trees.

**WebSocket connection:** The Hocuspocus provider must not be initialized until the editor route is active. It must be destroyed (`.destroy()`) when navigating away from the editor. Never keep WebSocket connections open in the background on non-editor pages — this wastes server connections and causes the "connecting" state flash seen in the screenshot.