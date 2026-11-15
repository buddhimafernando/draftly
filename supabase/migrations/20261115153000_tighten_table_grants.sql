-- Remove unnecessary table-level privileges.
revoke all on table
  public.profiles,
  public.documents,
  public.document_shares
from anon, authenticated;

-- Profiles: users can read profiles allowed by RLS.
grant select on public.profiles to authenticated;

-- Documents: users can read, create and delete
-- documents allowed by RLS.
grant select, insert, delete
on public.documents to authenticated;

-- Owners and editors can update only these columns.
grant update (title, content)
on public.documents to authenticated;

-- Sharing records can be read and deleted according to RLS.
-- New shares must go through share_document().
grant select, delete
on public.document_shares to authenticated;