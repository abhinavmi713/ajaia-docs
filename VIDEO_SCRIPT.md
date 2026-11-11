# Walkthrough video script (target 4 min)

Setup before recording: the live URL is open in a normal window (signed out) and an incognito window. Have `manual-test-files/Quarterly Plan.docx` ready. Make sure the editor and the code are readable at your recording zoom.

**0:00–0:20 · Intro**
"I'm Abhinav. This is Ajaia Docs, a lightweight Google-Docs-style editor. I set myself a 3-hour budget and put depth into editing, sharing and access control rather than breadth. Stack: Next.js 16, TipTap, Prisma and Neon Postgres, deployed on Vercel."

**0:20–1:30 · Main flow (Alice)**
- Log in as Alice, and mention that auth is mocked with seeded users and a signed httpOnly cookie.
- Point out the two sections, **Owned by me** and **Shared with me**.
- Click **+ New document**. The title is pre-selected; type "Launch plan" and press Enter. The cursor is now in the body.
- Use H1, a paragraph with **bold**, *italic* and underline, a bullet list and a numbered list. Point at "Saving… → All changes saved".
- Hard refresh: everything is preserved. "Content is stored as TipTap JSON, not HTML, so formatting round-trips exactly."

**1:30–2:30 · Sharing and access control**
- Share → `bob@demo.com`. Show the error for `nobody@demo.com`.
- Incognito as Bob: the doc is under **Shared with me**, "Owned by Alice Anders". Bob edits and the title is read-only. Alice refreshes and sees Bob's edit.
- Paste the URL as Carol: "Document not found". "Strangers get 404 so the doc's existence isn't leaked; collaborators get 403 for owner-only actions. It's all enforced on the server by one pure permission function."
- Remove Bob → Bob refreshes and loses access.

**2:30–3:05 · Import**
- **Import file** → `Quarterly Plan.docx` → heading, bold, italic, underline and the list are preserved.
- "Supports .txt, .md and .docx up to 2 MB, and the UI says so. Files are converted on the server with the editor's own schema, so scripts in Markdown are stripped." Optionally show the error for a .png.

**3:05–3:35 · Engineering and what I cut**
- Briefly show `src/lib/permissions.ts` and `npm test` (16 passing). Mention the smoke test that hits production with signed cookies for three users.
- "Deliberately cut: real-time co-editing (last write wins today), real auth, a viewer-role picker (the backend already supports it), comments and history. Next I'd add the role picker, stale-write detection with a 409, and export."

**3:35–4:15 · How AI supported the work**
- "I used Claude Code as a pair-programmer. It had to give me options and a recommendation for each decision, and I chose: the stack, mocked auth, autosave, the scope cuts."
- "It sped up scaffolding and tests, and it read the bundled Next 16 docs because of breaking changes."
- "Verification caught real issues: a toolbar focus bug, Word underline being dropped on import, and the fact that `ajaia-docs.vercel.app` was someone else's app. I also rejected some of its output, like its commit style, and I kept secrets out of its hands."
- "Everything is logged in NOTES.md and AI_WORKFLOW.md. Thanks!"
