# Architecture note

## Goal and constraint
Ship a coherent, *deployed* Google-Docs-like slice in a self-imposed **3-hour** budget (the brief allows 4–6 h). I put depth into the parts reviewers will actually exercise: the editing experience, correct access control, and import. Breadth features were cut.

## Shape
```
Browser (React client components)
  DocEditor ── TipTap (ProseMirror) ── debounced PATCH /api/documents/:id
  SharePanel ─ POST/DELETE /api/documents/:id/shares
  ImportButton ─ POST /api/import (multipart)
        │
Next.js 16 on Vercel (one app: server-rendered pages + route handlers)
  pages:  /login  /  /docs/[id]           ← server components read the DB directly
  api:    handle() → requireApiUser() → loadDocFor(id, user, action) → Prisma
        │
Neon Postgres (free tier)   User ── Document ── DocumentShare
```
One repo, one deploy, no separate API service, no CORS.

## Key decisions
| Decision | Why | Trade-off |
|---|---|---|
| **Next.js + Neon + Vercel** | Free and *persistent* (Render's free disk would wipe SQLite on redeploy), no cold starts for reviewers, a single deploy | Some Next 16 learning curve (async `params`, default `cacheComponents`, which I turned off because every page is per-user and dynamic) |
| **Store TipTap JSON, not HTML** | Structured content round-trips formatting losslessly and can be validated. The editor and the importer share one schema (`editor-extensions.ts`) | Not human-readable in the DB; exporting to HTML/MD would need a converter (TipTap provides one) |
| **Pure permission function** (`permissions.ts`) | The single source of truth for owner / editor / viewer. Every route goes through `loadDocFor()`, so there's no ad-hoc checking. Trivially unit-testable | Roles are coarse (by design) |
| **404 for no access, 403 for wrong role** | Strangers can't tell whether a doc exists; collaborators get an honest "owner only" | — |
| **Mocked auth with a signed cookie** | The brief allows mocked auth. A dropdown makes reviewing two-user flows fast. An HS256 JWT in an httpOnly cookie means the server never trusts a client-sent user id | No passwords. Anyone can act as any demo user, which is acceptable for a demo and documented |
| **Auth checks in data code, not `proxy` (middleware)** | Checks sit next to the queries, so a path-matching mistake can't expose a route | Slight repetition (`requireUser()` per page) |
| **Debounced autosave (800 ms)** | Feels like Docs, with no "forgot to save". One request in flight at a time; it always sends the latest state; on failure it keeps the content and offers Retry | Last write wins between two concurrent editors (see "not built") |
| **Server-side import via TipTap `generateJSON`** | `.md` (marked) and `.docx` (mammoth) become HTML, then the editor schema. Unknown or unsafe HTML (script, iframe, onerror) is dropped by the schema | Complex Word features (tables, images, comments) are dropped |
| **Migrate + seed during the Vercel build** | Reviewers always get the schema and demo users. Both steps are idempotent | Build depends on DB availability |
| **Prisma 6 (not 7)** | The stable, known path under time pressure | Will need upgrading later |

## Validation and errors
- zod on every write: title 1–200 chars; content root must be `{type:"doc"}` and ≤ 1 MB; valid email for sharing; upload type allow-list, 2 MB limit, empty/binary detection.
- A `handle()` wrapper maps errors to JSON: 400 (validation), 401, 403, 404, 413, 500 (logged, generic message).
- The UI shows inline errors (share panel, import, rename), a save-failure banner with Retry, a friendly 404 page, and a leave-page warning.

## Testing
- **Unit (Vitest, 16):** the permission matrix and HTTP status mapping; import of txt/md/docx (with a real `.docx` fixture), HTML escaping, script stripping, and size/type errors.
- **HTTP smoke (`npm run smoke:acl`, 13 checks):** run against both local and **production**. It covers editor vs owner vs stranger, validation, and forged or missing cookies.
- **Manual:** the [MANUAL_TESTS.md](MANUAL_TESTS.md) checklist, run in two browser windows.

## What I prioritized, and what I didn't build
**Prioritized:** an editing UX that feels coherent, correct server-side sharing logic, import that preserves structure, a live deployment that was verified, and tests on the riskiest logic.

**Deliberately not built:**
- **Real-time co-editing** (CRDT/Yjs and websockets). This is the biggest piece, and it doesn't fit 3 hours on serverless.
- **Conflict detection.** Two simultaneous editors means last write wins. Next step: send `updatedAt` with each save and return 409 if it's stale.
- **Real authentication**, signup and password reset.
- **Viewer role in the UI.** The model and permission rules already support `viewer`; only a role picker is missing.
- Comments, version history, export, search, folders, images and tables.
- **A separate dev database.** Local and production share one Neon DB for speed; a Neon branch would fix that.

## With 2–4 more hours
1. Viewer/editor role picker in the share panel (backend and tests already exist), ~30 min.
2. Stale-write protection (`updatedAt` → 409 → "reload or overwrite" prompt), ~45 min.
3. Export to Markdown/PDF (TipTap JSON → HTML → MD), ~45 min.
4. Presence indicator ("Bob is viewing") via polling, then real-time with Yjs + a websocket host.
5. Playwright end-to-end test of the two-user sharing flow, and a separate Neon branch for dev/preview.
