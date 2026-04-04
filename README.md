<p align="center">
  <h1 align="center">SyncDoc</h1>
  <p align="center">A production-grade, real-time collaborative document editor — built with Next.js 14, Tiptap, Yjs, and Supabase.</p>
</p>

> [!IMPORTANT]
> **Test Accounts for Judges:**
> - **Account 1:** `test@gmail.com` / `test`
> - **Account 2:** `test2@gmail.com` / `test`

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-14-black?logo=next.js" alt="Next.js" />
  <img src="https://img.shields.io/badge/TypeScript-Strict-blue?logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Supabase-PostgreSQL-3ecf8e?logo=supabase" alt="Supabase" />
  <img src="https://img.shields.io/badge/Tiptap-v2-6366f1" alt="Tiptap" />
  <img src="https://img.shields.io/badge/Yjs-CRDT-orange" alt="Yjs" />
  <img src="https://img.shields.io/badge/License-MIT-green" alt="License" />
</p>

---

## Overview

SyncDoc is a Notion-style collaborative document editor that supports real-time multiplayer editing, AI assistance, rich block-based content, and workspace management. It is designed as a full-stack monorepo with production deployment in mind.

### Key Features

- **Real-Time Collaboration** — CRDT-powered multiplayer editing with live cursors and presence indicators via Yjs + Hocuspocus
- **Rich Block Editor** — 20+ Tiptap extensions: headings, lists, tables, code blocks (syntax-highlighted), callouts, images, task lists, mentions
- **AI Assistant** — Powered by Anthropic Claude: summarize, rewrite, continue writing, translate, and more — with streaming responses
- **Workspace Management** — Multi-workspace support with role-based access (owner, admin, member, viewer) and folder organization
- **Sharing & Permissions** — Granular document permissions, shareable links, email invitations, and public read-only pages
- **Comments & Threads** — Inline commenting with threads, replies, and resolution
- **Version History** — Automatic snapshots with visual diff, preview, and one-click restore
- **Import & Export** — DOCX/PDF/Markdown import via Edge Functions; PDF, DOCX, Markdown, and HTML export
- **Offline Support** — IndexedDB persistence with automatic sync on reconnect
- **Command Palette** — Cmd+K global search across documents and actions
- **Dark Mode** — System-aware with manual toggle
- **Keyboard Shortcuts** — Full set of editor, navigation, and workspace shortcuts

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | Next.js 14 (App Router), React 18, TypeScript (strict) |
| **Editor** | Tiptap v2, ProseMirror |
| **Real-Time Sync** | Yjs (CRDT), Hocuspocus WebSocket server |
| **Database** | Supabase (PostgreSQL, Auth, Storage, Realtime, Edge Functions) |
| **State Management** | Zustand |
| **Styling** | Tailwind CSS, CSS Custom Properties design system |
| **Animations** | Framer Motion |
| **AI** | Anthropic Claude (claude-sonnet-4-6) |
| **Email** | Resend |
| **Monorepo** | Turborepo, pnpm workspaces |
| **Deployment** | Vercel (frontend), Railway (Hocuspocus), Supabase (hosted) |
| **CI/CD** | GitHub Actions |

---

## Project Structure

```
syncdoc/
├── apps/
│   ├── web/                     # Next.js 14 frontend
│   │   ├── app/                 # App Router pages & API routes
│   │   ├── components/          # React components (editor, ui, sidebar, etc.)
│   │   ├── hooks/               # Custom React hooks
│   │   ├── lib/                 # Supabase clients, Yjs provider, Tiptap config, exports
│   │   ├── store/               # Zustand stores (editor, presence, ui)
│   │   ├── styles/              # Global, editor, and print styles
│   │   └── types/               # App-level type definitions
│   │
│   └── hocuspocus/              # WebSocket collaboration server
│       ├── src/                 # Server, auth, persistence, awareness
│       └── Dockerfile           # Container deployment
│
├── packages/
│   ├── types/                   # Shared TypeScript types (@syncdoc/types)
│   └── utils/                   # Shared utilities (@syncdoc/utils)
│
├── supabase/
│   ├── migrations/              # SQL migrations (schema, RLS, storage, extras)
│   ├── functions/               # Edge Functions (AI, email, upload, PDF export)
│   └── seed.sql                 # Templates and demo data
│
├── .github/workflows/           # CI/CD (test on PR, deploy on push)
├── turbo.json                   # Turborepo pipeline config
├── pnpm-workspace.yaml          # Workspace definition
└── .env.example                 # Environment variable template
```

---

## Prerequisites

- **Node.js** 18+ (LTS recommended)
- **pnpm** 8+ (`npm install -g pnpm`)
- **Supabase CLI** (`npm install -g supabase`)
- A [Supabase](https://supabase.com) project (free tier works)
- *(Optional)* An [Anthropic](https://console.anthropic.com) API key for AI features
- *(Optional)* A [Resend](https://resend.com) API key for email invitations

---

## Getting Started

### 1. Clone & Install

```bash
git clone https://github.com/your-org/syncdoc.git
cd syncdoc
pnpm install
```

### 2. Configure Environment

```bash
cp .env.example .env.local
```

Fill in `.env.local` with your credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_JWT_SECRET=your-jwt-secret
NEXT_PUBLIC_HOCUSPOCUS_URL=ws://localhost:1234
ANTHROPIC_API_KEY=sk-ant-...
RESEND_API_KEY=re_...
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Set Up Supabase

```bash
# Link your project
supabase link --project-ref your-project-ref

# Run migrations
supabase db push

# Seed initial data (templates, demo content)
supabase db seed

# Deploy Edge Functions
supabase functions deploy ai-completion
supabase functions deploy send-invite-email
supabase functions deploy process-upload
supabase functions deploy export-pdf
```

### 4. Start Development

```bash
# Start both the Next.js frontend and Hocuspocus server
pnpm dev
```

This runs:
- **Next.js** on `http://localhost:3000`
- **Hocuspocus** on `ws://localhost:1234`

### 5. Run Individually (Optional)

```bash
# Frontend only
pnpm --filter web dev

# Hocuspocus server only
pnpm --filter hocuspocus dev

# Build all
pnpm build

# Type-check all
pnpm typecheck

# Lint all
pnpm lint
```

---

## Database Schema

SyncDoc uses 11 tables with Row-Level Security (RLS):

| Table | Purpose |
|---|---|
| `profiles` | User display names, avatars, colors |
| `workspaces` | Multi-tenant workspace containers |
| `workspace_members` | Membership + role (owner/admin/member/viewer) |
| `folders` | Hierarchical folder organization |
| `documents` | Documents with JSON content, metadata, soft-delete |
| `document_permissions` | Per-document access control |
| `document_revisions` | Auto-snapshots for version history |
| `comments` | Inline comments with threading |
| `templates` | System + user document templates |
| `document_links` | Inter-document references |
| `share_invitations` | Email-based invite tokens |

---

## Deployment

### Vercel (Frontend)

```bash
vercel --prod
```

`vercel.json` is pre-configured in `apps/web/`.

### Railway (Hocuspocus)

The `apps/hocuspocus/` directory includes a `Dockerfile` and `railway.toml` for one-click deployment. Set `PORT=1234` in Railway environment variables.

### Supabase

Use Supabase's hosted platform. Migrations are applied via `supabase db push`. Edge Functions are deployed individually.

### CI/CD

- **`test.yml`** — Runs type-checking, linting, and tests on every pull request
- **`deploy.yml`** — Deploys to Vercel and Railway on push to `main`

---

## Environment Variables Reference

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anonymous key |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Supabase service role key (server-only) |
| `SUPABASE_JWT_SECRET` | Yes | JWT secret for Hocuspocus auth |
| `NEXT_PUBLIC_HOCUSPOCUS_URL` | Yes | WebSocket URL for collaboration server |
| `ANTHROPIC_API_KEY` | No | Anthropic API key for AI features |
| `RESEND_API_KEY` | No | Resend API key for email invitations |
| `NEXT_PUBLIC_APP_URL` | Yes | Public app URL |

---

## Scripts

| Command | Description |
|---|---|
| `pnpm dev` | Start all apps in development mode |
| `pnpm build` | Build all apps and packages |
| `pnpm lint` | Lint all packages |
| `pnpm typecheck` | Run TypeScript type-checking |
| `pnpm format` | Format code with Prettier |

---

## Architecture Highlights

- **CRDT-first**: All document state is managed by Yjs. The server is a relay — no single point of failure for document data.
- **Offline-capable**: Changes are queued in IndexedDB and synced when the connection is restored.
- **Security**: Row-Level Security on every table. JWT validation on WebSocket connections. No sensitive keys in the client bundle.
- **Type-safe**: Strict TypeScript across the entire monorepo with shared type packages.
- **Modular**: Clean separation between editor components, collaboration layer, and business logic.

---

## License

MIT
