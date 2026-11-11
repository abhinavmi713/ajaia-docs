# Walkthrough video — full script (about 5 minutes)

Lines in **[brackets]** are what you *do* on screen. Everything else is what you *say*, word for word.

## Before you hit record (not spoken)
- **Window A** (normal Chrome): https://ajaia-docs-two-omega.vercel.app, signed out, on the login page.
- **Window B** (incognito, Ctrl+Shift+N): the same URL, on the login page.
- **VS Code** open on the project, with a terminal ready in `D:\ajaia-docs`.
- `manual-test-files/` folder easy to reach in the file picker.
- Browser zoom about 110% so text is readable. Close other tabs and notifications.
- Delete old test docs on the live site first, so Alice only has "Welcome to Ajaia Docs".

---

## 1 · Intro (0:00 – 0:25)
**[Window A, login page visible]**

Hi, I'm Abhinav, and this is Ajaia Docs, a lightweight collaborative document editor inspired by Google Docs.

I gave myself a tight timebox, so instead of copying every Docs feature, I went deep on four things: a smooth editing experience, file import, sharing with real access control on the server, and a working deployment. It's built with Next.js, the TipTap editor, Prisma and Postgres on Neon, and it's live on Vercel.

## 2 · Login (0:25 – 0:45)
**[Point at the three account cards]**

Authentication is intentionally mocked. There are three seeded demo accounts, so reviewers can test sharing in one click. Behind the scenes it's still a signed, httpOnly session cookie, so the server never trusts a user ID sent from the browser.

**[Click the Alice card]**

I'll sign in as Alice.

## 3 · Document list (0:45 – 1:00)
**[Home page]**

The home page splits documents into "Owned by me" and "Shared with me". Each card shows a preview, the owner, when it was last edited, and whether it's private or shared. Alice already owns a welcome document that's shared with Bob.

## 4 · Create, rename and edit (1:00 – 1:50)
**[Click "+ New document"]**

Let me create a new document. The title is already selected, so I can name it right away.

**[Type "Launch plan", press Enter]**

I'll call it "Launch plan", and Enter drops me straight into the page.

**[Click H1, type "Launch plan", press Enter]**

I'll add a heading…

**[Type "This is our plan for the " → Ctrl+B → "beta launch" → Ctrl+B → "."]**

…some text with bold…

**[Select a word → click I, then select another → click U]**

…italic and underline from the toolbar…

**[Click "• List", type "Finish testing", Enter, "Record the demo", Enter, Enter]**

…a bulleted list…

**[Click "1. List", type "Share with the team", Enter, "Collect feedback"]**

…and a numbered list.

**[Point at the status under the title]**

Up here you can see it autosaving: "Saving", then "All changes saved". There's no Save button to forget, and if a save fails, it keeps your changes and shows a Retry button.

**[Press Ctrl+Shift+R to hard refresh]**

If I hard refresh, everything comes back exactly as it was, including the formatting. That's because I store the document as structured editor JSON, not raw HTML.

## 5 · Sharing and access control (1:50 – 2:50)
**[Click "Share"]**

Now sharing. Alice is the owner. I'll add Bob by email with edit access.

**[Type bob@demo.com, keep "Can edit", click Add]**

Bob now shows up with "Can edit". If I try someone who doesn't exist…

**[Type nobody@demo.com, click Add]**

…I get a clear error instead of a silent failure.

**[Switch to Window B. Click the Bob card]**

Here in a private window I'm Bob. "Launch plan" appears under "Shared with me", with Alice as the owner and a "Can edit" badge.

**[Open "Launch plan". Type " Bob was here." at the end of a line]**

Bob can edit, and his change autosaves. But the title is read-only for him, and there's no Delete button, because only the owner can rename, share or delete.

**[Switch to Window A, refresh]**

Back as Alice, after a refresh I can see Bob's edit.

**[Copy the URL from the address bar. Window B: click Sign out, click the Carol card, paste the URL, press Enter]**

Now the important part. Carol has no access. If she pastes the link directly, she gets "Document not found". The server returns a 404 rather than a 403, so it doesn't even reveal that the document exists. All of these rules live in one small permission function on the server, and that's the part I unit-tested most heavily.

## 6 · File import (2:50 – 3:25)
**[Window A: click the blue logo to go home, then "Import file"]**

Next, file upload. I can import a text, Markdown or Word file, up to 2 megabytes, and the limit is shown right under the button.

**[Pick "Quarterly Plan.docx"]**

I'll import a Word document. It opens as a new, fully editable doc, and the heading, bold, italic, underline and bullet list all survived. The conversion happens on the server using the same schema as the editor, so anything unsafe, like a script tag hidden in Markdown, gets stripped out.

**[Go home → Import file → set the file picker to "All files" → pick "picture.png"]**

And if I try an unsupported file, like an image, I get a clear message telling me what's allowed.

## 7 · Optional stretch: viewer and editor roles (3:25 – 4:00)
**[Open "Launch plan" → Share → type carol@demo.com → choose "Can view" → Add]**

Once the core was done, I added one optional stretch feature: role-based sharing. I'll give Carol view-only access.

**[Window B, as Carol: click "Back to documents", open "Launch plan" from "Shared with me"]**

Now Carol sees the document, but it's read-only. There's no toolbar, there's a "You can view" badge, and a banner explains she can ask Alice for edit access. Even if she tried to save through the API, the server would reject it.

**[Window A: in the Share panel, change Carol to "Can edit". Window B: refresh]**

And if Alice switches her to "Can edit", the toolbar appears on her next refresh.

## 8 · Engineering, trade-offs and what's next (4:00 – 4:35)
**[Switch to VS Code. Open `src/lib/permissions.ts`, then run `npm test` in the terminal]**

A few engineering notes. Every API route goes through this one permission check. There are 22 unit tests covering the permission rules, roles and file import, including a real Word file. I also have a smoke test that hits the live site as Alice, Bob and Carol and checks the status codes, including 200, 401, 403, 404 and 400.

What I deliberately left out: real-time co-editing, so today if two people type at the exact same moment, the last save wins. Also real authentication, comments and version history. With a few more hours, I'd add conflict detection, then export to Markdown or PDF, and then live presence.

## 9 · How I used AI (4:35 – 5:05)
**[Show `NOTES.md` or `AI_WORKFLOW.md` in VS Code]**

Finally, AI. I built this with Claude Code as a pair-programmer, but I made the decisions. For every big choice, like the stack, the auth approach and what to cut, I had it give me options with a recommendation, and I picked. It sped up the scaffolding and the tests a lot.

I didn't take its output on trust. Testing caught a toolbar bug that put text in the wrong place, Word underlines getting lost on import, and the fact that the obvious Vercel URL actually belonged to someone else's app. I also rejected some of its output, like its commit messages, and I kept all secrets out of its hands. Everything is logged step by step in NOTES.md.

Thanks for watching!

**[Stop recording]**

---

## If you're running long (cut in this order)
1. Section 6: skip the unsupported-image example.
2. Section 7: skip switching Carol to "Can edit".
3. Section 4: skip the numbered list.
