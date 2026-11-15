-- Permission helpers. SECURITY DEFINER lets them read tables without
-- re-triggering RLS, which avoids documents <-> document_shares recursion.
create function public.is_document_owner(p_document_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.documents d
    where d.id = p_document_id and d.owner_id = (select auth.uid())
  );
$$;

create function public.can_view_document(p_document_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    exists (
      select 1 from public.documents d
      where d.id = p_document_id and d.owner_id = (select auth.uid())
    )
    or exists (
      select 1 from public.document_shares s
      where s.document_id = p_document_id and s.user_id = (select auth.uid())
    );
$$;

create function public.can_edit_document(p_document_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    exists (
      select 1 from public.documents d
      where d.id = p_document_id and d.owner_id = (select auth.uid())
    )
    or exists (
      select 1 from public.document_shares s
      where s.document_id = p_document_id
        and s.user_id = (select auth.uid())
        and s.role = 'editor'
    );
$$;

-- Share by email. Only the owner may call it successfully.
create function public.share_document(p_document_id uuid, p_email text, p_role text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_target uuid;
begin
  if (select auth.uid()) is null then
    raise exception 'Not authenticated' using errcode = '28000';
  end if;
  if p_role not in ('viewer', 'editor') then
    raise exception 'Invalid role' using errcode = '22023';
  end if;
  if not public.is_document_owner(p_document_id) then
    raise exception 'Only the owner can share this document' using errcode = '42501';
  end if;

  select id into v_target from public.profiles where email = lower(trim(p_email));
  if v_target is null then
    raise exception 'No user found with that email' using errcode = 'P0002';
  end if;
  if v_target = (select auth.uid()) then
    raise exception 'You already own this document' using errcode = '22023';
  end if;

  insert into public.document_shares (document_id, user_id, role)
  values (p_document_id, v_target, p_role)
  on conflict (document_id, user_id) do update set role = excluded.role;
end;
$$;

-- Only signed-in users may call these.
revoke all on function public.is_document_owner(uuid) from public, anon;
revoke all on function public.can_view_document(uuid) from public, anon;
revoke all on function public.can_edit_document(uuid) from public, anon;
revoke all on function public.share_document(uuid, text, text) from public, anon;
grant execute on function public.is_document_owner(uuid) to authenticated;
grant execute on function public.can_view_document(uuid) to authenticated;
grant execute on function public.can_edit_document(uuid) to authenticated;
grant execute on function public.share_document(uuid, text, text) to authenticated;

-- Table privileges: least privilege on top of RLS.
revoke all on public.profiles, public.documents, public.document_shares from anon;
revoke insert, update, delete on public.profiles from authenticated;
revoke update on public.documents from authenticated;
grant update (title, content) on public.documents to authenticated;  -- owner_id is immutable
revoke insert, update on public.document_shares from authenticated; -- inserts go through share_document()

alter table public.profiles enable row level security;
alter table public.documents enable row level security;
alter table public.document_shares enable row level security;

-- profiles: yourself, plus people you share documents with (or who share with you).
create policy profiles_select on public.profiles
  for select to authenticated
  using (
    id = (select auth.uid())
    or exists (
      select 1
      from public.documents d
      join public.document_shares s on s.document_id = d.id
      where (d.owner_id = profiles.id and s.user_id = (select auth.uid()))
         or (s.user_id = profiles.id and d.owner_id = (select auth.uid()))
    )
  );

-- documents
-- The owner_id check is repeated in SELECT so INSERT ... RETURNING works
-- (a STABLE helper can't see the row being inserted in the same statement).
create policy documents_select on public.documents
  for select to authenticated
  using (owner_id = (select auth.uid()) or public.can_view_document(id));

create policy documents_insert on public.documents
  for insert to authenticated
  with check (owner_id = (select auth.uid()));

create policy documents_update on public.documents
  for update to authenticated
  using (public.can_edit_document(id))
  with check (public.can_edit_document(id));

create policy documents_delete on public.documents
  for delete to authenticated
  using (owner_id = (select auth.uid()));

-- document_shares
create policy shares_select on public.document_shares
  for select to authenticated
  using (user_id = (select auth.uid()) or public.is_document_owner(document_id));

create policy shares_delete on public.document_shares
  for delete to authenticated
  using (public.is_document_owner(document_id));