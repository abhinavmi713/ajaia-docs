# AI workflow note

The detailed, timestamped log is in [NOTES.md](NOTES.md). This is the summary.

## Tools used
- **Claude Code (Claude Opus) in the Claude desktop app**, as a pair-programmer. It wrote code, ran commands, and drove a browser for testing and deployment setup.
- Its built-in browser and Claude in Chrome, for UI verification and to click through the Vercel/GitHub setup.
- No other AI tools.

**How we worked:** for each meaningful decision (stack, auth, save model, scope cuts) the AI had to give two options and a recommendation, and I chose. Work went in small runnable steps, each logged in NOTES.md with what was suggested, what I changed, and how it was verified.

## Where AI materially sped things up
- **Scaffolding and boilerplate:** Prisma schema, zod schemas, REST route handlers, the TipTap toolbar and the Tailwind UI took roughly 1 hour instead of roughly 3.
- **Unfamiliar or new APIs:** Next 16 has breaking changes (async `params`, `proxy` instead of middleware, `cacheComponents` on by default). The AI read the docs bundled in `node_modules/next/dist/docs` before writing code, rather than relying on stale knowledge.
- **Test scaffolding:** the permission matrix tests, import tests, a real `.docx` fixture generated with JSZip, and an HTTP smoke script that signs cookies for three users.
- **Verification legwork:** it drove the browser to exercise the editor, and ran the access-control smoke test against local *and* production.

## AI output I changed or rejected
| What the AI did | What I did and why |
|---|---|
| Wrote a long multi-line commit message with a "Co-Authored-By: Claude" trailer and pushed it | I stopped it and had it amended to a short one-line message, with a force-push guarded by a lease on the old SHA. All later commits are one line |
| The first editor UI left a new doc as "Untitled document" over a blank page | My manual testing flagged it. Now the title is auto-selected, Enter jumps to the body, and the body has a placeholder |
| Would have used the Next scaffold defaults (`cacheComponents` / PPR) | Disabled them: every page is per-user, so PPR only added errors and complexity |
| Default Next `.gitignore` (`.env*`) would have hidden `.env.example` | Added `!.env.example` |
| Picked Prisma 6 over the latest (7) and explained why | Reviewed and accepted: the boring, known path under time pressure |
| Set up the Vercel project in the browser | Secrets stayed with me: **I** pasted the DB strings and secret into `.env` and Vercel. The AI only checked env *key names*, never values |
| My time plan had an early "hello" deploy at 40 min | We folded it into the first real deploy at about 90 min, because the core was ready by then |

## Bugs caught by verification, not by trusting the code
- **Toolbar focus bug:** clicking "Numbered list" moved focus out of the editor, so text landed in the wrong paragraph. Found in browser testing; fixed by preventing mousedown on the toolbar.
- **mammoth drops underline** in `.docx` by default. Caught by the docx fixture test; fixed with a style map.
- **Wrong production URL:** `ajaia-docs.vercel.app` turned out to be *someone else's* app. Caught by checking page content, not the name.
- **React Compiler lint** caught two hook-ordering issues in the autosave code.
- **Two false alarms were not "fixed":** a "bold doesn't work" result came from mis-aimed automated clicks, and an "Enter doesn't move focus" result came from automation typing too fast. Both were confirmed via DOM inspection before any code changed.

## How I verified correctness, UX and reliability
- **Correctness:** 16 unit tests on the riskiest logic (permissions, import). The 13-check HTTP access-control smoke test passed against local and production (editor 200; owner-only actions 403; stranger 404; bad input 400; forged or missing cookie 401). `tsc` and eslint are clean on every step.
- **UX:** I ran the full [MANUAL_TESTS.md](MANUAL_TESTS.md) checklist myself in two browser windows (Alice and Bob or Carol). That covers formatting, autosave status, reload persistence, sharing and revoking, the 404 page, import errors, and offline save failure with Retry.
- **Reliability:** idempotent migrations and seed on every deploy; the autosave never runs two saves at once and keeps unsaved content on failure; the server re-validates everything the client checks.
