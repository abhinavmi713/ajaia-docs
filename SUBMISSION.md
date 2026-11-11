# Submission — Ajaia Docs (Abhinav Kumar)

**Live app:** https://ajaia-docs-two-omega.vercel.app
**Source:** https://github.com/abhinavmi713/ajaia-docs (also in the Drive folder)
**Walkthrough video:** see `VIDEO_URL.txt`

## Test accounts (mocked login: pick a user from the dropdown, no password)
| User | Email | Starting state |
|---|---|---|
| Alice Anders | alice@demo.com | Owns "Welcome to Ajaia Docs", shared with Bob |
| Bob Brown | bob@demo.com | Sees that doc under **Shared with me** |
| Carol Chen | carol@demo.com | No access (use her to see the 404) |

**Fastest review path (about 3 min):**
1. Log in as Alice → **+ New document**. Type a title, press Enter, and write with H1, bold and lists. Watch "All changes saved", then refresh: formatting is kept.
2. Click **Share** → `bob@demo.com`.
3. In an incognito window, log in as Bob. The doc is under **Shared with me** with "Owned by Alice Anders". Bob can edit, but the title is read-only and there's no Delete button.
4. Paste the doc URL as Carol. You get "Document not found".
5. **Import file** → a `.md`, `.txt` or `.docx` (max 2 MB) becomes a new doc.

## What's included (Drive folder)
| Item | File |
|---|---|
| Source code | the `ajaia-docs/` folder (same as the GitHub repo) |
| Setup and run instructions | `README.md` |
| Architecture note | `ARCHITECTURE.md` |
| AI workflow note | `AI_WORKFLOW.md` (summary) and `NOTES.md` (step-by-step log) |
| This file | `SUBMISSION.md` |
| Walkthrough video URL | `VIDEO_URL.txt` |
| Manual test checklist | `MANUAL_TESTS.md` |
| Automated tests | `tests/` (Vitest) and `scripts/smoke-acl.mjs` (HTTP access checks) |

No extra setup or screenshots are needed: the live URL plus the seeded accounts cover every flow.

## What works end to end
- Create, rename (owner), edit, delete (owner) and reopen documents. Content is stored as TipTap JSON in Postgres, so formatting persists exactly.
- Rich text: Normal/H1/H2, bold, italic, underline, bulleted and numbered lists, undo/redo, keyboard and Markdown shortcuts.
- Autosave with a status display (Saving… / All changes saved / Not saved + Retry) and a leave-page warning.
- File import: `.txt`, `.md`, `.docx` → new editable doc with structure preserved. Type and size limits are stated in the UI, and errors are clear.
- Sharing by email with existing users, plus revoke. Lists are split into **Owned by me** and **Shared with me**, with owner names.
- Server-side access control: 404 for no access, 403 for owner-only actions, 401 without a valid session. Input is validated with zod.
- Deployed on Vercel with Neon Postgres (both free). Migrations and seed run on every deploy.
- Tests: 16 Vitest unit tests (permissions, import), plus a 13-check HTTP access smoke test that passes against production.

## What is incomplete or intentionally cut
- **No real-time co-editing or presence.** Two people editing at once means last write wins.
- **Auth is mocked** (seeded users, signed httpOnly cookie, no passwords). This is documented and allowed by the brief.
- **Sharing grants editor access only.** The data model and permission rules already support a `viewer` role (and it's unit-tested), but the UI has no role picker yet.
- **Import drops** images, tables and comments from `.docx`.
- **No** comments, version history, export, search or folders.
- **Local and production share one database** (a time trade-off).

## What I'd build with another 2–4 hours
1. Viewer/editor role picker in the share panel (backend is ready).
2. Stale-write detection: send `updatedAt`, get 409 if it's stale, then prompt to reload or overwrite.
3. Export to Markdown/PDF.
4. Presence ("Bob is viewing") via polling, then real-time editing with Yjs.
5. A Playwright end-to-end test of the two-user flow, and a separate Neon branch for dev/preview.

## Stack
Next.js 16 (App Router, TS), TipTap 3, Prisma 6, Neon Postgres, Tailwind 4, zod, jose, mammoth, marked, Vitest, Vercel.

## AI usage (short)
I built this with Claude Code as a pair-programmer. I made every stack and scope decision from options it proposed, verified each step in the browser and with tests, and kept secrets out of its hands. Bugs caught through verification included a toolbar focus bug, `.docx` underline loss, and a wrong production URL. Full details are in `AI_WORKFLOW.md` and `NOTES.md`.
