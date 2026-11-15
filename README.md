# Draftly

A lightweight collaborative document editor built for the Ajaia AI-native full-stack assignment.

**Live app:** https://draftly-navy.vercel.app

## Test accounts

| User | Email | Password |
|---|---|---|
| Alice | alice.draftly@test.com | `abc@1234` |
| Bob | bob.draftly@test.com | `abc@1234` |
| Carol | carol.draftly@test.com | `abc@1234` |

You can also create your own account on the login page. Email confirmation is disabled so sign-up is instant.

**Quick way to see sharing work:** sign in as Alice, create a document, click **Share**, enter `bob.draftly@test.com` as Viewer. Sign out, sign in as Bob, and find it under **Shared with me** (read-only). Switch Bob to Editor from Alice's account and he can edit. Carol, who has no access, gets a 404 if she opens the document's URL.

## Features

- Create, rename, edit, save and reopen documents
- Rich text: bold, italic, underline, H1/H2, bulleted and numbered lists
- Autosave (debounced) with a visible save status
- **File import:** `.txt`, `.md` and `.docx` (max 4 MB) become a new editable document. Images and complex Word layout are not preserved.
- Sharing by email with **Viewer** or **Editor** roles; owners can change roles or remove access
- "My documents" vs "Shared with me" lists, with role badges
- Owners can delete documents
- Email/password authentication

## Stack

Next.js (App Router) · React · TypeScript · Tailwind CSS · shadcn/ui · Tiptap · Supabase (Postgres, Auth, Row Level Security) · Vitest · Vercel

## Run locally

Requires Node 20.19+ (tested on 22).

```bash
git clone <https://github.com/buddhimafernando/draftly.git> draftly && cd draftly
npm install
cp .env.example .env.local
```

1. Create a free project at [supabase.com](https://supabase.com).
2. In **Authentication → Sign In / Providers → Email**, turn **off** "Confirm email".
3. In **Project Settings → API Keys**, copy the project URL and the publishable key into `.env.local`:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://<ref>.supabase.co
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
   ```
   The URL must be the bare project URL, with no `/rest/v1/` suffix.
4. Apply the database migrations:
   ```bash
   npx supabase login
   npx supabase link --project-ref <ref>
   npx supabase db push --remote
   ```
5. Start the app and sign up at http://localhost:3000:
   ```bash
   npm run dev
   ```

## Tests

```bash
npm test
```

The suite is an RLS integration test that signs in as three real users against your Supabase project and checks that strangers, viewers and editors each get exactly the access they should. It needs users `alice.draftly@test.com`, `bob.draftly@test.com` and `carol.draftly@test.com` (create them via the sign-up page) and this in `.env.local`:

```
TEST_USER_PASSWORD=<abc@1234>
```

Without it the suite is skipped. Also useful: `npm run typecheck` and `npm run build`.

## Project layout

```
src/app/            routes: login, /documents, /documents/[id], /api/import/docx
src/components/     auth, dashboard, editor, sharing, ui (shadcn)
src/lib/            supabase clients + session proxy, document queries/actions, file import
supabase/migrations schema, RLS policies, sharing function, privilege grants
tests/              RLS integration test
docs/               architecture note, AI workflow note
```

## Documentation

- [Architecture note](docs/ARCHITECTURE.md)
- [AI workflow note](docs/AI_WORKFLOW.md)
- [SUBMISSION.md](SUBMISSION.md)