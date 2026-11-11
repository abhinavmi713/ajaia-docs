# Manual test checklist

Run locally (`npm run dev`, http://localhost:3000) or against the live URL. Test files are in `manual-test-files/` (gitignored, created locally). Use **one normal window + one private/incognito window** so you can be two users at once.

## 1. Login (mocked auth)
| # | Steps | Expected |
|---|---|---|
| 1.1 | Open `/` while signed out | Redirects to `/login` |
| 1.2 | Login page | Dropdown lists Alice, Bob, Carol; note says auth is mocked |
| 1.3 | Choose **Alice** → Sign in | Lands on Documents; header shows "Alice Anders (alice@demo.com)" |
| 1.4 | Refresh | Still signed in (cookie persists) |
| 1.5 | DevTools → Application → Cookies | `ajaia_session` is **HttpOnly** |
| 1.6 | Sign out | Back to `/login`; visiting `/` redirects to login again |

## 2. Document list
| # | Steps | Expected |
|---|---|---|
| 2.1 | As Alice | "Owned by me" has "Welcome to Ajaia Docs" with **Owner** badge and "Shared with 1" |
| 2.2 | As Alice | "Shared with me (0)" shows empty-state text |
| 2.3 | As Bob | "Welcome…" is under **Shared with me** with amber **Shared** badge and "Owned by Alice Anders" |
| 2.4 | As Carol | Both sections empty |

## 3. Create, rename, edit, autosave, reopen
| # | Steps | Expected |
|---|---|---|
| 3.1 | Alice → **+ New document** | Opens editor, title "Untitled document", status "All changes saved" |
| 3.2 | Click title, type "Test Plan", press Enter | Title saved; browser tab title updates |
| 3.3 | Clear title completely, press Enter | Red banner "Title cannot be empty"; title reverts |
| 3.4 | Type a paragraph | Status: "Unsaved changes…" → "Saving…" → "All changes saved" (~1 s) |
| 3.5 | Toolbar: **H1**, **H2**, **Normal** | Block changes; active button highlighted |
| 3.6 | Select text → **B**, **I**, **U** (and Ctrl+B / Ctrl+I / Ctrl+U) | Formatting applied; buttons show active state |
| 3.7 | **• List** then type 3 items (Enter between) | Bulleted list; Enter on empty item exits list |
| 3.8 | **1. List** then type items | Numbered list 1, 2, 3 |
| 3.9 | Undo / Redo buttons (Ctrl+Z / Ctrl+Y) | Work |
| 3.10 | Markdown shortcuts: type `# ` / `- ` / `1. ` at line start | Become heading / bullet / numbered list |
| 3.11 | Wait for "All changes saved" → **hard refresh** (Ctrl+Shift+R) | All content and formatting identical |
| 3.12 | Go back to list (blue logo) | "Test Plan" at top of "Owned by me" with fresh timestamp |
| 3.13 | Type, then immediately try to close/refresh tab | Browser "Leave site?" warning |

## 4. Sharing + access control
| # | Steps | Expected |
|---|---|---|
| 4.1 | Alice opens "Test Plan" → **Share** | Panel shows Alice as Owner |
| 4.2 | Enter `bob@demo.com` → Add | "Shared with Bob Brown"; Bob listed with Remove |
| 4.3 | Enter `nobody@demo.com` | Error "No user with email nobody@demo.com" |
| 4.4 | Enter `alice@demo.com` | Error "You already own this document" |
| 4.5 | Enter `bob@demo.com` again | No duplicate entry |
| 4.6 | **Private window** as Bob → list | "Test Plan" under Shared with me, "Owned by Alice Anders" |
| 4.7 | Bob opens it | Status line says "Owned by Alice Anders"; title is **read-only**; no Delete button; button says **People** |
| 4.8 | Bob edits text, waits for saved | Alice refreshes → sees Bob's edit |
| 4.9 | Copy the doc URL → sign in as **Carol** (private window) → paste URL | "Document not found" page (404, doesn't reveal it exists) |
| 4.10 | Alice → Share → **Remove** Bob | Bob refreshes the doc → "Document not found"; gone from his list |

## 5. File import
Use **Import file** on the Documents page. Hint under button: ".txt, .md or .docx · max 2 MB".
| # | File (in `manual-test-files/`) | Expected |
|---|---|---|
| 5.1 | `Team update.txt` | New doc "Team update"; 3 paragraphs; single newline = line break; `<b>…</b>` shown as literal text |
| 5.2 | `Meeting notes.md` | New doc "Meeting notes"; H1 + bullet list with **bold** "Decision:" |
| 5.3 | `Quarterly Plan.docx` | H1 "Quarterly Plan"; bold, italic, **underline** preserved; bullet list |
| 5.4 | `xss.md` | Only "XSS check" + "Safe text."; no alert popup, no script/image |
| 5.5 | `picture.png` (set file dialog filter to "All files") | Red error "Unsupported file type…" |
| 5.6 | `too-big.txt` (3 MB) | Red error "File is too large (max 2 MB)" |
| 5.7 | `broken.docx` | Red error "Could not read this .docx file…" |
| 5.8 | Edit an imported doc, refresh | Behaves like any other doc (autosave, share) |

## 6. Delete
| # | Steps | Expected |
|---|---|---|
| 6.1 | Alice opens an imported doc → **Delete** → Cancel | Nothing happens |
| 6.2 | **Delete** → OK | Back to list; doc gone |
| 6.3 | As Bob on a shared doc | No Delete button (API returns 403 anyway) |

## 7. Error handling
| # | Steps | Expected |
|---|---|---|
| 7.1 | In editor, DevTools → Network → **Offline**, type | Status "Not saved" + red banner with **Retry** |
| 7.2 | Back online → Retry (or keep typing) | "All changes saved"; refresh shows content kept |
| 7.3 | Visit `/docs/doesnotexist` | "Document not found" page |

## 8. Automated checks
```bash
npm test                  # 16 unit tests (permissions + import)
npm run smoke:acl         # 13 HTTP access-control checks (dev server must be running)
npx tsc --noEmit && npm run lint
```
