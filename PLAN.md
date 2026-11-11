# PLAN — Ajaia Docs (3h timebox)

## Stack (decided)
Next.js 16 (App Router, TS) + TipTap 3 (content stored as TipTap JSON) + Prisma 6 + Neon Postgres, deployed on Vercel. Tailwind for styling, Vitest for tests.

Why: one repo/one deploy, free *persistent* Postgres, no cold starts for reviewers. (Render free = ephemeral disk → SQLite wiped on redeploy.)

## Decisions
- **Auth:** mocked. Login page = pick a seeded user; server sets an HMAC-signed httpOnly cookie (`jose`). No passwords. Documented as mocked.
- **Save:** debounced autosave (~1s) + "Saving… / Saved / Error" status.
- **Sharing:** `DocumentShare(documentId, userId, role)`; role defaults to `editor` (viewer role = stretch).
- **Access rules (server-side, single pure function `can(action, user, doc)`):**
  - owner: read, edit, rename, share, delete
  - shared user: read, edit
  - anyone else: 404 (don't leak existence)
  - shared user attempting rename/share/delete: 403
- **Upload:** `.txt`, `.md` (+ `.docx` via mammoth) → new document. Max 1 MB. Converted to TipTap JSON on the server.
- **Tests:** Vitest on the permission function + import conversion.

## Scope
| MUST | NICE (only if ahead at 125 min) | CUT |
|---|---|---|
| Seeded users + login + signed cookie | Viewer vs editor role | Real-time co-editing (CRDT) |
| Doc list: Owned by me / Shared with me | Revoke share | Real auth / signup |
| Create, rename, delete | Export to Markdown | Comments, version history |
| Editor: B/I/U, H1/H2, UL/OL | | Attachments / blob storage |
| Autosave + reopen | | Search, folders, presence |
| Share by email, owner shown | | |
| Server-side 404/403 | | |
| Upload .txt/.md/.docx → new doc | | |
| Tests | | |
| Early deploy + final deploy | | |

## Timeline
- 0–15 scope/stack/plan ✔
- 15–40 scaffold, schema, seed, deploy hello
- 40–100 list, create, rename, editor, autosave
- 100–125 sharing + access checks
- 125–140 upload
- 140–150 tests, validation, self-review — **feature freeze at 140**
- 150–170 redeploy, verify with 2 accounts, docs
- 170–180 buffer + video outline
