# Architecture note

## Goal and scope

A small but complete document workspace: create, edit, share, import and persist. I optimized for a coherent end-to-end slice with real access control over feature breadth, and cut everything that didn't serve that.

## Overview

Next.js App Router hosts the UI and a thin server layer. There is no separate backend. Supabase provides Postgres, Auth and Row Level Security.

- **Reads** happen in Server Components, using the signed-in user's session cookie.
- **Writes** happen in Server Actions (create, rename, autosave, share, delete) plus one Route Handler for `.docx` conversion.
- **Authorization lives in the database.** Every query runs with the user's JWT, so Postgres RLS decides what each user can see or change. The deployed app only holds the public (publishable) key, and the service-role key is never used.

## Key decisions

| Decision | Why |
|---|---|
| RLS as the authorization layer | Access can't be bypassed by a bug in app code, and the same rules apply however the data is reached. |
| Security-definer helper functions (`can_view_document`, `can_edit_document`, `is_document_owner`) | `documents` policies need `document_shares` and vice versa; naive policies recurse infinitely. Helpers read without re-triggering RLS. |
| Owner check duplicated in the `documents` SELECT policy | A STABLE helper can't see a row being inserted in the same statement, so `INSERT … RETURNING` would fail without it. |
| Sharing through an RPC (`share_document`) | Lets owners share by email without making every user's email browsable. The function verifies ownership server-side. |
| Column-level `UPDATE` grants (title, content only) | Even an editor can't reassign `owner_id`. Privileges, policies and the RPC form three layers. |
| Document content stored as Tiptap JSON (`jsonb`) | Native editor format, so formatting round-trips, and stored HTML is never rendered raw. |
| Imports parsed through the editor schema | Anything the editor doesn't support (scripts, images) is dropped, which doubles as sanitization. `.docx` is converted server-side with mammoth, `.md` with marked. |
| Debounced autosave, last-write-wins | Simple, predictable, and visible through a save-status indicator. |
| Seeded demo accounts plus open sign-up | Easy for reviewers to exercise sharing without email verification. |

## Data model

- `profiles` (mirror of `auth.users`, created by a trigger)
- `documents` (owner, title, content jsonb, timestamps)
- `document_shares` (document, user, role `viewer`|`editor`)

| Action | Owner | Editor | Viewer |
|---|:-:|:-:|:-:|
| View | ✅ | ✅ | ✅ |
| Edit content, rename | ✅ | ✅ | ❌ |
| Share, change roles, remove | ✅ | ❌ | ❌ |
| Delete | ✅ | ❌ | ❌ |

## Testing

An integration test signs in as three real users against Supabase and asserts: strangers can't read, edit or delete; only owners can share; viewers can read but not write; editors can write but can't change ownership, share or delete. This tests the access model where it is enforced, in the database.

## What I prioritized

1. A reliable core loop (auth → create → edit → persist → reopen)
2. Real, server-enforced sharing
3. A product-relevant import flow
4. A deployed, testable build with seeded users

## Deliberately cut

Real-time collaboration, comments, version history, PDF/Markdown export, link sharing, images in documents, password reset, pagination, delete from the dashboard list, and component-level UI tests.

## Known limitations

- Concurrent edits are last-write-wins; two editors typing at once can overwrite each other.
- Sharing by email reveals whether an email is registered to a document owner. This is acceptable for an internal tool, but would be rate-limited or replaced by an invite flow in production.
- `.docx` import keeps headings, lists, bold, italic and underline, but drops images and complex layout.
- The Supabase free tier pauses inactive projects. If the live app errors, the project may need to be resumed.

## With another 2–4 hours

1. Real-time presence and conflict handling (Supabase Realtime, or Yjs with Tiptap)
2. Document version history with restore
3. Export to Markdown and PDF
4. Invite flow for emails not yet registered
5. Delete and rename from the list, with search and pagination
6. Playwright end-to-end tests for the main flow