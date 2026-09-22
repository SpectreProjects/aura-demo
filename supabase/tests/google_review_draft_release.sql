-- Run after applying 20260922161000_google_review_draft_only_release.sql.
-- Every assertion raises and rolls the transaction back if the staging schema
-- exposes more access than the draft-only contract allows.

begin;

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'aura_google_reply_settings',
    'google_review_drafts',
    'google_review_draft_jobs',
    'google_review_events',
    'google_connections',
    'google_reviews'
  ] loop
    if not exists (
      select 1
      from pg_class relation
      join pg_namespace namespace on namespace.oid = relation.relnamespace
      where namespace.nspname = 'public'
        and relation.relname = table_name
        and relation.relrowsecurity is true
    ) then
      raise exception 'RLS is not enabled on public.%', table_name;
    end if;
  end loop;

  if has_table_privilege('authenticated', 'public.google_connections', 'select') then
    raise exception 'authenticated must not read encrypted Google connections';
  end if;
  if has_table_privilege('authenticated', 'public.google_review_draft_jobs', 'select') then
    raise exception 'authenticated must not read background jobs';
  end if;
  if has_table_privilege('authenticated', 'public.google_review_events', 'insert') then
    raise exception 'authenticated must not write audit events';
  end if;
  if has_table_privilege('authenticated', 'public.google_review_drafts', 'insert,update,delete') then
    raise exception 'authenticated must not write Google drafts directly';
  end if;
  if not has_table_privilege('authenticated', 'public.google_review_drafts', 'select') then
    raise exception 'authenticated owners need read access to their RLS-scoped drafts';
  end if;
  if has_function_privilege(
    'authenticated',
    'public.activate_google_location(uuid,uuid,uuid,text,text,text,text,text,text,jsonb)',
    'execute'
  ) then
    raise exception 'authenticated must not execute the location switch function';
  end if;
  if has_function_privilege(
    'authenticated',
    'public.finalize_google_review_publication(uuid,uuid,uuid,uuid,uuid,uuid,text,timestamptz,boolean)',
    'execute'
  ) then
    raise exception 'authenticated must not execute the publication finaliser';
  end if;
  if not has_function_privilege(
    'service_role',
    'public.finalize_google_review_publication(uuid,uuid,uuid,uuid,uuid,uuid,text,timestamptz,boolean)',
    'execute'
  ) then
    raise exception 'service_role must execute the transactional publication finaliser';
  end if;
  if exists (
    select 1
    from (values
      ('publication_claim_id'),
      ('publication_claimed_at'),
      ('publication_claim_expires_at'),
      ('publication_idempotency_key'),
      ('publication_request_version')
    ) expected(column_name)
    where not exists (
      select 1
      from information_schema.columns actual
      where actual.table_schema = 'public'
        and actual.table_name = 'google_review_drafts'
        and actual.column_name = expected.column_name
    )
  ) then
    raise exception 'Google review drafts are missing publication idempotency fields';
  end if;
  if not exists (
    select 1
    from pg_indexes
    where schemaname = 'public'
      and tablename = 'google_reviews'
      and indexname = 'google_reviews_connection_review_name_idx'
      and indexdef ilike '%unique%'
  ) then
    raise exception 'Google review identity must be unique per archived or active connection';
  end if;
end
$$;

rollback;
