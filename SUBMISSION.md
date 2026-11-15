# Submission

**Candidate:** Buddhima Fernando
**Project:** Draftly, a lightweight collaborative document editor

## Links

- **Live product:** https://draftly-navy.vercel.app
- **Walkthrough video:** https://youtu.be/VuoKLPFZj1w

## Test accounts (for the sharing flow)

| User | Email | Password |
|---|---|---|
| Alice | alice.draftly@test.com | `abc@1234` |
| Bob | bob.draftly@test.com | `abc@1234` |
| Carol | carol.draftly@test.com | `abc@1234` |

## Included in this folder

| Item | Description |
|---|---|
| `draftly-source.zip` | Full source code (no `node_modules` or secrets) |
| `README.md` | Setup, run and test instructions |
| `ARCHITECTURE.md` | Architecture and prioritization note |
| `AI_WORKFLOW.md` | AI workflow note |
| `SUBMISSION.md` | This file |
| `walkthrough-video.txt` | Link to the walkthrough video |
| `screenshots/` | Screenshots of the main flows |

## What works end to end

- Create, rename, edit (bold, italic, underline, H1/H2, bulleted and numbered lists), autosave, reopen
- Import `.txt`, `.md` and `.docx` into a new editable document
- Share by email as Viewer or Editor; change or revoke access; "My documents" vs "Shared with me"
- Server-enforced permissions (Postgres RLS), verified by automated integration tests
- Owner delete
- Persistence in Supabase Postgres; deployed on Vercel

## Incomplete or intentionally cut

- No real-time collaboration; concurrent edits are last-write-wins
- No comments, version history or export
- `.docx` import drops images and complex layout
- No password reset; delete is available from the editor page only

## With another 2–4 hours

Real-time presence, version history with restore, Markdown/PDF export, an invite flow for unregistered emails, and Playwright end-to-end tests.