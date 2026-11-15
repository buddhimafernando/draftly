# AI workflow note

## Tools

- **Claude (chat interface)**: planning and architecture, schema and RLS design, drafting most application code, and debugging from pasted terminal output and screenshots. I did not have a coding agent, so I applied code by hand and ran it myself.
- **ChatGPT**: [edit this to match what you actually did, for example: a second opinion on the plan, reviewing queries, and reviewing the test script].

## Where AI materially sped me up

- Choosing and scoping the stack, plus a phase-by-phase plan, in the first few minutes.
- Drafting the RLS policies, the security-definer helpers and the share-by-email function, which would have taken me much longer to get right.
- Scaffolding the Tiptap toolbar, the autosave hook and the import pipeline.
- Writing the RLS integration test.
- Debugging: pasting an error or screenshot and getting a likely cause quickly.

## What I changed or rejected

- **Dependency install:** the suggested Vitest install failed on a peer-dependency conflict. I rejected `--legacy-peer-deps` (it can fail again on Vercel) and instead bumped `@types/node` and dropped test packages I didn't need.
- **Framework default:** the current `create-next-app` enabled Cache Components, which breaks cookie-based pages. I turned it off.
- **A query that passed TypeScript but failed at runtime:** the `documents → profiles` join was ambiguous in PostgREST. I fixed it with explicit foreign-key hints and added error logging so failures were visible.
- **Error handling in login:** I temporarily exposed the real auth error to debug a malformed Supabase URL in my env file (`/rest/v1/` suffix), then reverted to a generic message so the app doesn't reveal which emails exist.
- **Tightened database privileges:** beyond the generated policies, I added a migration that revokes default table grants and gives `UPDATE` only on `title` and `content`.
- **A missing feature:** the first feature pass had no delete. I noticed while testing and had it added, with owner-only enforcement.

## How I verified correctness, UX and reliability

- **Automated:** RLS integration tests (5) against the real Supabase project with three users, covering stranger, viewer and editor access, ownership changes, sharing and deletion.
- **Manual:** the full flow in two or three accounts: create, format, refresh, rename, share, view as a viewer, upgrade to editor, open a document URL as a stranger (404), import `.txt`, `.md` and `.docx`.
- **Build checks:** `tsc --noEmit` and `next build` before every deploy.
- **Production:** repeated the key flows on the deployed Vercel URL, not just on localhost.

## Honest limits

I did not accept AI output unread, but I did rely on it heavily for boilerplate. The areas I trust most are the ones covered by the integration test. The editor UX was verified by hand only, with no automated UI tests.