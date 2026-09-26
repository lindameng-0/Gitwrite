# Gitwrite

A writing workspace built around a shared manuscript, optional alternate drafts, and recoverable revisions.

## Run locally

Use Node.js 22 or newer.

```sh
npm ci
npm run dev
```

Open http://localhost:8080. On Windows, use `npm.cmd` if PowerShell blocks npm's script shim.

The app opens in **Local workspace** mode with a clearly labeled sample manuscript. Create a new project to start with a blank page. Local projects live in IndexedDB in this browser. Export a complete JSON backup before clearing site data or moving devices. Existing legacy database records are not changed or automatically imported.

## What works

- Rich-text editor with stable paragraph identities, chapter titles, chapter ordering, search, and automatic saves.
- Independent projects and chapter-scoped or manuscript-wide alternate drafts.
- Submitted proposals freeze their content. Compare the proposal against its immutable starting content and the current manuscript. Preserve unrelated changes, select individual changes, or write a resolution for an overlapping passage.
- Return proposals to an editable draft; keep submitted proposal snapshots.
- Full revision snapshots, named milestones, and restoration that appends history instead of deleting it.
- Chapter conversations, selected-text quotations, and resolve/reopen controls.
- Complete JSON backup/import and plain-text/Markdown import/export. Plain Markdown export preserves chapter headings and text, not rich formatting.
- Durable local project transactions, per-chapter unsaved recovery buffers, and recovery download when saving is blocked.
- Optional team accounts, project membership, editor/viewer roles, server-authorized saves, and automatic refresh every five seconds.

## Enable team workspaces

Local mode needs no backend. Team mode requires the new schema; it does not use the legacy application's tables.

1. In your Supabase SQL editor, run **only** `supabase/migrations/20260926000000_gitwrite_v2.sql` against the intended project. This creates new `gw_*` tables and RPCs. Do not replay the old migrations blindly: several contain legacy demo data.
2. Set the public frontend environment variables and restart/rebuild Vite:

   ```dotenv
   VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
   VITE_SUPABASE_PUBLISHABLE_KEY=YOUR_PUBLIC_ANON_OR_PUBLISHABLE_KEY
   ```

   `VITE_SUPABASE_ANON_KEY` is also accepted. Never put a service-role key in frontend environment variables.

3. Enable Supabase email/password authentication and configure the app's site URL and allowed confirmation redirects. Confirm account emails if your project requires it.
4. Choose **Connect**, create an account or sign in, then open team projects. To move local writing into the team space, choose **Share project -> Upload project copy**. This copies all drafts and history; it leaves the local original intact.
5. Collaborators create their accounts first. The project owner adds their email under **Share project**. Editors can edit, comment, propose, and review. Viewers can read and export. Only owners can grant or revoke membership.

The migration is intentionally not deployed by the app. This repository's implementation was tested with isolated PostgreSQL, not against your live Supabase instance.

## Collaboration and version guarantees

This release uses synchronized **saved revisions**, not live cursor or character-by-character CRDT coediting. It refreshes team data every five seconds. If another save lands first, the server atomically rejects a stale version. A writer keeps their unsaved buffer, refreshes, and retries; nonoverlapping paragraph changes can then be reconciled. An overlapping change stays local until the writer keeps it as an alternate draft and reviews it. No last-writer-wins overwrite is used.

Proposal application checks the exact manuscript reviewed. If it has changed, a fresh review is required. Changes within the same paragraph are conservatively treated as overlapping even if the changed words differ. Order and chapter deletion changes also participate in conflict detection.

Project histories contain full rich-text snapshots. The server additionally records every accepted project version in an append-only `gw_revisions` ledger, inaccessible to direct client writes. Project members can fetch recovery snapshots with `gw_recovery_versions(project_id)`. UI history metadata is editable by the application's trusted editor role; the server ledger provides an independent record.

All team drafts are visible to project members. Comments keep the selected quotation and chapter association; they are not live text-position anchors. A manually written merge resolution replaces that passage with plain text; choosing either existing version preserves its rich-text structure. Editorial coherence remains a human decision.

Local recovery buffers help with reloads and failed saves, but are not a substitute for backups. If a browser refuses storage, the app reports the failure. It never claims a team save succeeded before the server confirms it.

## Validation

```sh
npm run typecheck
npm run lint
npm test
npm run build
```

Tests cover unrelated concurrent changes, explicit conflict decisions, formatting-preserving restore, frozen proposals, stale/double acceptance, insertion order, deletion conflicts, reorder conflicts, backup validation, and an isolated PostgreSQL migration test. The database test verifies owner/editor/viewer/outsider access, revoked access, atomic revision checks, and immutable server recovery snapshots. It does not contact Supabase.

## Code map

- `src/workspace/model.ts`: pure revision, comparison, proposal, and restore operations.
- `src/workspace/storage.ts`: validated imports and transactional IndexedDB storage.
- `src/workspace/cloud.ts`: Supabase authentication and version-checked persistence.
- `src/workspace/useWorkspace.ts`: project selection, refresh, and serialized saves.
- `src/workspace/Editor.tsx`: rich-text editor and stable block identities.
- `src/workspace/ChapterPane.tsx`: autosave, recovery, and concurrent-edit handling.
- `src/workspace/Panels.tsx`: review, history, comments, and dialogs.
- `src/workspace/Workspace.tsx`: application shell and project workflows.
- `src/workspace/workspace.css`: responsive writing workspace.

`src/App.tsx` now mounts the new workspace. The old components/hooks/pages remain as reference and are excluded from the v2 TypeScript/lint entry points; none are imported by the new application. The old database migrations and data are preserved for an explicit future import rather than an unsafe automatic conversion. Old metadata-only save points cannot reconstruct missing writing.

## Deliberately deferred

Character-level coediting/presence, private team drafts, anchored comment ranges, Word/PDF conversion, public publishing, and legacy-data import are not implemented in this release. The current version uses full project snapshots and is intended for small writing teams; large manuscripts will need incremental persistence, history pagination, and server-side retention controls.
