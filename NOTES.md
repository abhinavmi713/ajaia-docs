# NOTES — running AI workflow log

Tool: Claude Code (Opus) as pair-programmer, in the Claude desktop app. I (Abhinav) make the decisions and run/verify every step.

---

## Step 0 — Scope & stack (≈0–10 min)
- **AI suggested:** restated "done", MUST/NICE/CUT table, two stacks: (A) Next.js + TipTap + Prisma + Neon on Vercel, (B) Vite + Express + SQLite on Render. Recommended A because Render's free disk is ephemeral (SQLite would be wiped on redeploy) and free services sleep (~50s cold start for reviewers).
- **I chose:** A, plus the recommended defaults: dropdown mocked login with signed cookie, debounced autosave, share table with a `role` column defaulting to `editor`, Vitest on a pure permission function.
- **Changed/rejected:** _(add yours)_
- **Verified:** n/a (planning).

## Step 1 — Scaffold (≈10–20 min)
- `create-next-app` → Next 16.4 / React 19.3 / Tailwind 4. Installed TipTap 3, Prisma, jose, zod, marked, mammoth, vitest.
- **AI decisions I reviewed:**
  - Pinned **Prisma 6** instead of latest 7 (7 requires driver adapters + `prisma.config.ts`; 6 is the boring, known path under time pressure).
  - npm peer conflict: vitest 5 wants `@types/node` ≥22 → bumped `@types/node` to 22 rather than using `--legacy-peer-deps`.
  - Next 16 has breaking changes (route `params` is a Promise; `middleware` renamed to `proxy`). AI read the bundled docs in `node_modules/next/dist/docs` before writing code. Decided **not** to use proxy for auth: checks live in the server code that touches data, so they can't be bypassed by a matcher mistake.
- **Verified:** _(fill in after `npm run dev` shows the page)_

## Step 2 — Schema, mocked auth, seed, "hello" pages (≈20–30 min)
- **Schema:** `User`, `Document` (content = TipTap JSON in a `Json` column), `DocumentShare` (unique `(documentId, userId)`, `role` default `editor`, cascade deletes).
- **Auth:** `src/lib/auth.ts`. Login = choose seeded user → HS256-signed JWT in an httpOnly, SameSite=Lax cookie. `requireUser()` for pages. Marked `server-only` so it can't leak into client bundles.
- **Seed:** idempotent upserts (alice/bob/carol@demo.com) + a "Welcome" doc owned by Alice and shared with Bob, so reviewers see sharing instantly.
- **Build:** `prisma generate && prisma migrate deploy && prisma db seed && next build` — migrations + seed run on every Vercel deploy (safe because both are idempotent).
- **AI caught:** default Next `.gitignore` has `.env*`, which would also ignore `.env.example` → added `!.env.example`.
- **Verified:** `tsc --noEmit` and `eslint` clean. _(Fill in: local login works as Alice/Bob; Vercel URL shows "Hello, <name>".)_

## Step 3 — Doc list, editor, autosave, sharing API (≈35–55 min)
- **Access control:** `src/lib/permissions.ts` is a pure function (`getRole` / `can` / `denialStatus`). Every API route goes through `loadDocFor(id, user, action)` in `src/lib/http.ts`; pages use the same `getRole`. Strangers get **404** (don't leak existence), collaborators attempting owner-only actions get **403**.
- **API:** `POST /api/documents`, `PATCH|DELETE /api/documents/:id`, `POST|DELETE /api/documents/:id/shares`. Inputs validated with zod (title 1–200 chars, content root must be `{type:"doc"}`, ≤1 MB, valid email).
- **UI:** list page with "Owned by me" / "Shared with me" sections (badge + "Owned by X"); editor page with Google-Docs-like page canvas, pill toolbar (undo/redo, Normal/H1/H2, B/I/U, bullet/numbered), owner-only title rename, share popover (add by email, remove access).
- **Autosave design (AI proposed, I reviewed):** 800 ms debounce, never two saves in flight, always sends the *latest* content, keeps unsaved content on failure and shows "Not saved + Retry", `beforeunload` warning when not saved.
- **Pulled forward:** share API + panel were cheap once the permission layer existed, so built them now instead of at 100 min.
- **AI mistakes caught:** Prisma `Json` type mismatch with zod output (cast to `InputJsonValue`); React Compiler lint flagged a self-referencing `useCallback` in autosave → refactored to a ref-based scheduler; dropped a CSS placeholder rule that needed an extension we don't load.
- **Tests:** `tests/permissions.test.ts` — 9 Vitest cases (owner/editor/viewer/stranger, 404 vs 403 mapping). `npm test` → 9 passed.
- **Verified:** tsc + eslint clean, tests pass. _(Fill in: manual browser check.)_

## Step 4 — Migrate, local verification (≈55–75 min)
- Ran `prisma migrate dev --name init` + seed against Neon.
- **Issue:** the Next 16 scaffold enables `cacheComponents` (Partial Prerendering) by default → errors for every page reading cookies/DB. All our pages are per-user and dynamic, so PPR has no benefit here → **disabled** `cacheComponents`/`partialPrefetching` in `next.config.ts` (simplest reliable path, logged as a deliberate trade-off).
- **Real bug found in browser testing:** clicking a toolbar button (e.g. Numbered list) moved focus away from the editor, so typed text landed in the wrong paragraph. Fix: `onMouseDown={e => e.preventDefault()}` on the toolbar so the editor keeps its selection. Re-tested: H1, B/I/U, bullet + numbered lists, autosave status, reload → formatting preserved (verified via DOM).
- **False alarm I didn't "fix":** an earlier "bold doesn't work" was my own mis-aimed test clicks (coordinate scaling), not an app bug — confirmed by clicking via element refs before changing code.
- **Access-control smoke test** (`scripts/smoke-acl.mjs`, `npm run smoke:acl`): 13 HTTP checks against the running server with signed cookies for Alice/Bob/Carol — editor edit 200; editor rename/share/delete 403; stranger edit + page 404; empty title, bad content, bad email, self-share 400; unknown user 404; missing/forged cookie 401. **All 13 matched.**
- **Trade-off noted:** local dev and production share one Neon DB (no time for a separate Neon branch). Cleaned test docs after verifying.

## Step 5 — Deploy + file import (≈80–115 min)
- **Deploy:** Vercel project connected to GitHub (Vercel GitHub App limited to *only* this repo + my existing one). Env vars pasted by me; AI never handled the DB password/secret. Vercel required an email identity check (done by me). Build ran migrate + seed; deployed in 55 s.
- **Gotcha caught:** `ajaia-docs.vercel.app` is **someone else's** project (different page title). Real production URL: **https://ajaia-docs-two-omega.vercel.app**. Verified by content, not by assuming the name.
- **Prod verification:** `BASE_URL=<prod> npm run smoke:acl` → all 13 access checks match in production.
- **Import (`src/lib/import.ts`, `POST /api/import`):** `.txt` (blank line = paragraph, HTML-escaped), `.md` (marked → HTML), `.docx` (mammoth → HTML); all converted server-side with TipTap's `generateJSON` using the **same extension list as the editor**, so imported content always fits the schema and unknown HTML (script/iframe) is dropped. Limits: 2 MB, type allow-list, empty/binary detection; checked on client (fast feedback) and server (authoritative). UI states supported types under the button.
- **Real bug found by a test:** mammoth silently drops underline by default → added `styleMap: ["u => u"]`. Built a real `.docx` fixture with JSZip (`scripts/make-docx-fixture.cjs`) instead of mocking mammoth.
- **Tests:** 16 passing (9 permission + 7 import incl. real docx, XSS-in-markdown, size/type errors). HTTP check of `/api/import`: docx/md → 201 with correct title + structure; png → 400; no file → 400; >2 MB → 413. Test docs deleted afterwards.
- **Added:** owner-only Delete button in editor (confirm dialog). React Compiler lint caught a declaration-order issue → moved function below the refs.
