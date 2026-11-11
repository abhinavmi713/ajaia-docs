# Ajaia Docs

A lightweight collaborative document editor inspired by Google Docs, built for the Ajaia AI-Native Full Stack Developer assignment. It covers rich-text editing with autosave, file import, sharing between users, and server-side access control.

**Live app:** https://ajaia-docs-two-omega.vercel.app

| Demo user | Email | Notes |
|---|---|---|
| Alice Anders | alice@demo.com | Owns "Welcome to Ajaia Docs", shared with Bob |
| Bob Brown | bob@demo.com | Sees the welcome doc under **Shared with me** |
| Carol Chen | carol@demo.com | No access to anything by default (use her to test 404) |

Login is **mocked**: choose a user from the dropdown, no password. The session is still a real HMAC-signed, httpOnly cookie. Use a normal window plus an incognito window to be two users at once.

## Features
- **Documents:** create, rename (owner), delete (owner), edit, reopen. The list is split into **Owned by me** and **Shared with me**, with an owner name and badge on each doc.
- **Editor (TipTap):** Normal / H1 / H2, **bold**, *italic*, underline, bulleted and numbered lists, undo/redo, keyboard and Markdown shortcuts. Debounced autosave with a *Saving… / All changes saved / Not saved + Retry* status, and a warning before leaving with unsaved changes.
- **File import:** `.txt`, `.md`, `.docx` (**max 2 MB**) become a new editable document, with headings, bold/italic/underline and lists preserved. Other types are rejected with a clear message.
- **Sharing:** the owner shares by email with an existing user and can remove access. Shared users can read and edit. Only the owner can rename, share or delete.
- **Access control on the server:** strangers get **404** (a doc's existence is not revealed), collaborators trying owner-only actions get **403**, and requests without a valid session get **401**.

## Tech stack
Next.js 16 (App Router, TypeScript) · TipTap 3 · Prisma 6 · PostgreSQL (Neon, free tier) · Tailwind CSS 4 · zod · jose · mammoth + marked (import) · Vitest. Hosted on Vercel (free Hobby plan).

## Run locally
Requirements: Node 20+ and a Postgres database. A free [Neon](https://neon.tech) project works; any Postgres works.

```bash
git clone https://github.com/abhinavmi713/ajaia-docs.git
cd ajaia-docs
npm install
cp .env.example .env        # then fill in the values (see below)
npx prisma migrate deploy   # create tables
npx prisma db seed          # create Alice, Bob, Carol + welcome doc (idempotent)
npm run dev                 # http://localhost:3000
```

`.env` values (see `.env.example`):
| Variable | Purpose |
|---|---|
| `DATABASE_URL` | Pooled Postgres connection string (runtime). For plain local Postgres, use the same URL for both. |
| `DIRECT_URL` | Direct connection string (migrations) |
| `SESSION_SECRET` | 32+ random chars to sign session cookies: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |

## Tests
```bash
npm test             # 16 Vitest unit tests: permission rules + file import (incl. a real .docx fixture)
npm run smoke:acl    # 13 HTTP access-control checks against a running server (BASE_URL defaults to localhost:3000)
npm run lint && npx tsc --noEmit
```
The manual test checklist is in [MANUAL_TESTS.md](MANUAL_TESTS.md).

## Deploy (Vercel)
1. Import the GitHub repo in Vercel (it detects Next.js).
2. Add the three env vars above.
3. Deploy. The build script runs `prisma migrate deploy && prisma db seed && next build`, so the schema and demo users are always present. Both steps are idempotent.

## Project layout
```
prisma/            schema, migrations, idempotent seed
src/lib/
  permissions.ts   pure access rules (getRole / can / denialStatus)  ← unit tested
  http.ts          route wrapper: auth, 401/403/404 mapping, zod errors
  auth.ts          mocked login, signed session cookie
  import.ts        .txt/.md/.docx → TipTap JSON                       ← unit tested
  validation.ts    zod schemas
src/app/api/       REST routes: documents, shares, import
src/app/           pages: /login, / (list), /docs/[id] (editor)
src/components/    DocEditor, Toolbar, SharePanel, DocList, ImportButton
tests/             Vitest tests + fixtures
scripts/           smoke-acl.mjs (HTTP ACL checks), make-docx-fixture.cjs
```

More detail: [ARCHITECTURE.md](ARCHITECTURE.md) · [AI_WORKFLOW.md](AI_WORKFLOW.md) · [SUBMISSION.md](SUBMISSION.md)
