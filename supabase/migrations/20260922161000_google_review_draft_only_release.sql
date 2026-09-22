begin;

create schema if not exists aura_private;
revoke all on schema aura_private from public, anon, authenticated;

-- Connections keep their history, but only one selected location can be active
-- for a standard AURA business. A short-lived pending row is used while the
-- owner chooses the location after Google's account-level consent screen.
alter table public.google_connections
  add column if not exists status text,
  add column if not exists selection_expires_at timestamptz,
  add column if not exists selected_at timestamptz,
  add column if not exists disconnected_at timestamptz,
  add column if not exists archived_at timestamptz,
  add column if not exists reconnect_required_at timestamptz,
  add column if not exists last_error_code text,
  add column if not exists google_location_address text,
  add column if not exists google_location_store_code text,
  add column if not exists location_snapshot jsonb not null default '{}'::jsonb,
  add column if not exists manual_sync_available_at timestamptz;

update public.google_connections
set status = case when active is true then 'active' else 'archived' end
where status is null;

update public.google_connections
set active = false
where active is null;

alter table public.google_connections
  alter column status set default 'pending_selection',
  alter column status set not null,
  alter column active set default false,
  alter column active set not null,
  alter column user_id set not null,
  alter column business_profile_id set not null,
  alter column connected_at set default now(),
  alter column connected_at set not null;

alter table public.google_connections
  drop constraint if exists google_connections_status_check,
  add constraint google_connections_status_check check (
    status in ('pending_selection', 'active', 'reconnect_required', 'disconnected', 'archived')
  ),
  drop constraint if exists google_connections_active_status_check,
  add constraint google_connections_active_status_check check (
    (status = 'active' and active is true)
    or (status <> 'active' and active is false)
  );

drop index if exists public.google_connections_user_business_idx;

create unique index if not exists google_connections_one_active_business_idx
  on public.google_connections (business_profile_id)
  where status = 'active';

create unique index if not exists google_connections_one_pending_business_idx
  on public.google_connections (business_profile_id)
  where status = 'pending_selection';

create index if not exists google_connections_user_status_idx
  on public.google_connections (user_id, status, connected_at desc);

-- The secure token migration has been live with no rows in the legacy columns.
-- Abort rather than silently drop data if another environment contains a value.
do $$
declare
  legacy_has_values boolean := false;
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'google_connections'
      and column_name = 'access_token'
  ) then
    execute 'select exists (select 1 from public.google_connections where access_token is not null)'
      into legacy_has_values;
  end if;

  if not legacy_has_values and exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'google_connections'
      and column_name = 'refresh_token'
  ) then
    execute 'select exists (select 1 from public.google_connections where refresh_token is not null)'
      into legacy_has_values;
  end if;

  if legacy_has_values then
    raise exception 'Legacy plaintext Google token columns are not empty';
  end if;
end
$$;

alter table public.google_connections
  drop column if exists access_token,
  drop column if exists refresh_token;

alter table public.google_reviews
  add column if not exists first_seen_at timestamptz not null default now(),
  add column if not exists draft_eligible boolean not null default false,
  add column if not exists draft_eligibility_reason text not null default 'historical_import',
  add column if not exists remote_reply_last_seen_at timestamptz;

alter table public.google_reviews
  drop constraint if exists google_reviews_draft_eligibility_reason_check,
  add constraint google_reviews_draft_eligibility_reason_check check (
    draft_eligibility_reason in (
      'historical_import',
      'new_after_connection',
      'already_replied',
      'feature_disabled'
    )
  );

-- The same Google location may be connected by different AURA customers, or
-- reconnected later after its prior connection was archived. Keep each
-- connection's history isolated instead of moving a globally unique row.
alter table public.google_reviews
  drop constraint if exists google_reviews_google_review_name_key;

drop index if exists public.google_reviews_google_review_name_key;

create unique index if not exists google_reviews_connection_review_name_idx
  on public.google_reviews (google_connection_id, google_review_name);

create index if not exists google_reviews_connection_created_idx
  on public.google_reviews (google_connection_id, review_created_at desc);

create index if not exists google_reviews_eligible_unreplied_idx
  on public.google_reviews (google_connection_id, first_seen_at)
  where draft_eligible is true and reply_comment is null;

create table if not exists public.aura_google_reply_settings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  business_profile_id uuid not null references public.business_profiles(id) on delete cascade,
  tone_choice text not null check (
    tone_choice in ('warm_friendly', 'polished_professional', 'relaxed_conversational', 'concise_direct', 'custom')
  ),
  preferred_phrases text[] not null default '{}'::text[],
  avoided_phrases text[] not null default '{}'::text[],
  positive_example text not null check (char_length(btrim(positive_example)) between 1 and 2000),
  critical_example text not null check (char_length(btrim(critical_example)) between 1 and 2000),
  escalation_wording text check (escalation_wording is null or char_length(escalation_wording) <= 1000),
  recommended_delay_minutes integer not null check (recommended_delay_minutes between 0 and 10080),
  notifications_enabled boolean not null default true,
  notification_email text check (notification_email is null or char_length(notification_email) between 3 and 320),
  setup_completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (business_profile_id),
  unique (user_id, business_profile_id)
);

create table if not exists public.google_review_drafts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  business_profile_id uuid not null references public.business_profiles(id) on delete cascade,
  google_connection_id uuid not null references public.google_connections(id),
  google_review_id uuid not null references public.google_reviews(id) on delete cascade,
  status text not null default 'generating' check (
    status in ('generating', 'generated', 'edited', 'failed', 'published')
  ),
  generated_text text check (generated_text is null or char_length(btrim(generated_text)) between 1 and 4096),
  edited_text text check (edited_text is null or char_length(btrim(edited_text)) between 1 and 4096),
  suggested_publish_at timestamptz not null,
  prompt_version text not null default 'google-review-draft-v1',
  model text,
  generation_attempts integer not null default 0 check (generation_attempts between 0 and 10),
  last_error_code text,
  last_error_message text,
  notification_status text not null default 'pending' check (
    notification_status in ('pending', 'sending', 'sent', 'failed', 'disabled', 'historical')
  ),
  notification_attempts integer not null default 0 check (notification_attempts between 0 and 10),
  notification_next_attempt_at timestamptz,
  notification_sent_at timestamptz,
  notification_provider_id text,
  published_at timestamptz,
  google_reply_updated_at timestamptz,
  publication_claim_id uuid,
  publication_claimed_at timestamptz,
  publication_claim_expires_at timestamptz,
  publication_idempotency_key text,
  publication_request_version integer,
  version integer not null default 1 check (version > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (google_review_id)
);

alter table public.google_review_drafts
  add column if not exists publication_claim_id uuid,
  add column if not exists publication_claimed_at timestamptz,
  add column if not exists publication_claim_expires_at timestamptz,
  add column if not exists publication_idempotency_key text,
  add column if not exists publication_request_version integer;

alter table public.google_review_drafts
  drop constraint if exists google_review_drafts_publication_claim_check,
  add constraint google_review_drafts_publication_claim_check check (
    (publication_claim_id is null and publication_claimed_at is null and publication_claim_expires_at is null)
    or
    (publication_claim_id is not null and publication_claimed_at is not null and publication_claim_expires_at is not null)
  ),
  drop constraint if exists google_review_drafts_publication_request_check,
  add constraint google_review_drafts_publication_request_check check (
    (publication_idempotency_key is null and publication_request_version is null)
    or
    (
      char_length(publication_idempotency_key) between 8 and 200
      and publication_request_version > 0
    )
  );

create index if not exists google_review_drafts_business_created_idx
  on public.google_review_drafts (business_profile_id, created_at desc);

create index if not exists google_review_drafts_notification_due_idx
  on public.google_review_drafts (notification_next_attempt_at)
  where notification_status in ('pending', 'failed');

create index if not exists google_review_drafts_publication_claim_idx
  on public.google_review_drafts (publication_claim_expires_at)
  where publication_claim_id is not null;

create table if not exists public.google_review_draft_jobs (
  id uuid primary key default gen_random_uuid(),
  idempotency_key text not null unique,
  user_id uuid not null references auth.users(id) on delete cascade,
  business_profile_id uuid not null references public.business_profiles(id) on delete cascade,
  google_connection_id uuid not null references public.google_connections(id),
  google_review_id uuid not null references public.google_reviews(id) on delete cascade,
  google_review_draft_id uuid references public.google_review_drafts(id) on delete cascade,
  job_kind text not null default 'generate' check (job_kind in ('generate', 'regenerate')),
  status text not null default 'pending' check (
    status in ('pending', 'processing', 'retry', 'succeeded', 'failed')
  ),
  attempts integer not null default 0 check (attempts between 0 and 4),
  max_attempts integer not null default 4 check (max_attempts between 1 and 4),
  next_attempt_at timestamptz not null default now(),
  locked_at timestamptz,
  worker_id uuid,
  last_error_code text,
  last_error_message text,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists google_review_draft_jobs_due_idx
  on public.google_review_draft_jobs (next_attempt_at, created_at)
  where status in ('pending', 'retry');

create unique index if not exists google_review_draft_jobs_one_open_review_idx
  on public.google_review_draft_jobs (google_review_id)
  where status in ('pending', 'processing', 'retry');

create table if not exists public.google_connection_operation_leases (
  google_connection_id uuid primary key references public.google_connections(id) on delete cascade,
  owner_id uuid not null,
  purpose text not null check (purpose in ('publish', 'sync')),
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists google_connection_operation_leases_expiry_idx
  on public.google_connection_operation_leases (expires_at);

create table if not exists public.google_review_events (
  id uuid primary key default gen_random_uuid(),
  event_key text not null unique,
  event_type text not null check (
    event_type in (
      'connection_selected',
      'connection_disconnected',
      'draft_generated',
      'draft_regenerated',
      'draft_edited',
      'draft_failed',
      'notification_sent',
      'notification_failed',
      'publish_started',
      'publish_conflict',
      'reply_published',
      'reply_reconciled'
    )
  ),
  user_id uuid not null references auth.users(id) on delete cascade,
  business_profile_id uuid not null references public.business_profiles(id) on delete cascade,
  google_connection_id uuid references public.google_connections(id),
  google_review_id uuid references public.google_reviews(id) on delete cascade,
  google_review_draft_id uuid references public.google_review_drafts(id) on delete cascade,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists google_review_events_review_created_idx
  on public.google_review_events (google_review_id, created_at desc);

create or replace function aura_private.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end
$$;

drop trigger if exists aura_google_reply_settings_touch_updated_at on public.aura_google_reply_settings;
create trigger aura_google_reply_settings_touch_updated_at
before update on public.aura_google_reply_settings
for each row execute function aura_private.touch_updated_at();

drop trigger if exists google_review_drafts_touch_updated_at on public.google_review_drafts;
create trigger google_review_drafts_touch_updated_at
before update on public.google_review_drafts
for each row execute function aura_private.touch_updated_at();

drop trigger if exists google_review_draft_jobs_touch_updated_at on public.google_review_draft_jobs;
create trigger google_review_draft_jobs_touch_updated_at
before update on public.google_review_draft_jobs
for each row execute function aura_private.touch_updated_at();

create or replace function aura_private.prevent_google_review_event_change()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  raise exception 'Google review audit events are append-only';
end
$$;

drop trigger if exists google_review_events_append_only on public.google_review_events;
create trigger google_review_events_append_only
before update or delete on public.google_review_events
for each row execute function aura_private.prevent_google_review_event_change();

-- Called only by AURA's service-role backend after it has re-fetched and
-- validated the selected Google location. The switch is atomic: the previous
-- active connection becomes metadata-only history and its reviews stay linked.
create or replace function public.activate_google_location(
  p_connection_id uuid,
  p_user_id uuid,
  p_business_profile_id uuid,
  p_google_account_name text,
  p_google_account_title text,
  p_google_location_name text,
  p_google_location_title text,
  p_google_location_address text,
  p_google_location_store_code text,
  p_location_snapshot jsonb
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  selected_connection public.google_connections%rowtype;
begin
  if not exists (
    select 1
    from public.business_profiles business
    where business.id = p_business_profile_id
      and business.user_id = p_user_id
  ) then
    raise exception 'Business ownership could not be verified';
  end if;

  select *
  into selected_connection
  from public.google_connections connection
  where connection.id = p_connection_id
    and connection.user_id = p_user_id
    and connection.business_profile_id = p_business_profile_id
    and connection.status = 'pending_selection'
    and connection.selection_expires_at > now()
  for update;

  if not found then
    raise exception 'Google location selection has expired';
  end if;

  perform 1
  from public.google_connections connection
  where connection.business_profile_id = p_business_profile_id
    and connection.status in ('active', 'reconnect_required')
    and connection.id <> p_connection_id
  for update;

  if exists (
    select 1
    from public.google_connection_operation_leases lease
    join public.google_connections connection on connection.id = lease.google_connection_id
    where connection.business_profile_id = p_business_profile_id
      and connection.status in ('active', 'reconnect_required')
      and lease.expires_at > now()
  ) then
    raise exception using
      errcode = '55P03',
      message = 'The current Google location is busy. Try changing it again in a moment.';
  end if;

  update public.google_connections
  set status = 'archived',
      active = false,
      archived_at = now(),
      access_token_encrypted = null,
      refresh_token_encrypted = null,
      token_expires_at = null,
      updated_at = now()
  where business_profile_id = p_business_profile_id
    and status in ('active', 'reconnect_required')
    and id <> p_connection_id;

  update public.google_connections
  set status = 'archived',
      active = false,
      archived_at = now(),
      access_token_encrypted = null,
      refresh_token_encrypted = null,
      token_expires_at = null,
      updated_at = now()
  where business_profile_id = p_business_profile_id
    and status = 'pending_selection'
    and id <> p_connection_id;

  update public.google_connections
  set status = 'active',
      active = true,
      selected_at = now(),
      selection_expires_at = null,
      google_account_name = p_google_account_name,
      google_account_title = p_google_account_title,
      google_location_name = p_google_location_name,
      google_location_title = p_google_location_title,
      google_location_address = p_google_location_address,
      google_location_store_code = p_google_location_store_code,
      location_snapshot = coalesce(p_location_snapshot, '{}'::jsonb),
      last_error_code = null,
      reconnect_required_at = null,
      updated_at = now()
  where id = p_connection_id;

  update public.business_profiles
  set business_name = coalesce(nullif(btrim(p_google_location_title), ''), business_name)
  where id = p_business_profile_id
    and user_id = p_user_id;

  return p_connection_id;
end
$$;

revoke all on function public.activate_google_location(
  uuid, uuid, uuid, text, text, text, text, text, text, jsonb
) from public, anon, authenticated;
grant execute on function public.activate_google_location(
  uuid, uuid, uuid, text, text, text, text, text, text, jsonb
) to service_role;

create or replace function public.claim_google_connection_operation(
  p_connection_id uuid,
  p_owner_id uuid,
  p_purpose text,
  p_ttl_seconds integer default 120
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  affected integer := 0;
begin
  if p_owner_id is null
     or p_purpose not in ('publish', 'sync')
     or p_ttl_seconds not between 30 and 300 then
    raise exception 'The Google operation lease is invalid';
  end if;

  perform 1
  from public.google_connections connection
  where connection.id = p_connection_id
    and connection.status = 'active'
  for update;

  if not found then
    return false;
  end if;

  insert into public.google_connection_operation_leases as lease (
    google_connection_id,
    owner_id,
    purpose,
    expires_at,
    updated_at
  ) values (
    p_connection_id,
    p_owner_id,
    p_purpose,
    now() + make_interval(secs => p_ttl_seconds),
    now()
  )
  on conflict (google_connection_id) do update
  set owner_id = excluded.owner_id,
      purpose = excluded.purpose,
      expires_at = excluded.expires_at,
      updated_at = now()
  where lease.expires_at <= now()
     or lease.owner_id = excluded.owner_id;

  get diagnostics affected = row_count;
  return affected = 1;
end
$$;

create or replace function public.release_google_connection_operation(
  p_connection_id uuid,
  p_owner_id uuid
)
returns void
language sql
security definer
set search_path = ''
as $$
  delete from public.google_connection_operation_leases
  where google_connection_id = p_connection_id
    and owner_id = p_owner_id;
$$;

create or replace function public.disconnect_google_connection(
  p_connection_id uuid,
  p_user_id uuid,
  p_business_profile_id uuid,
  p_archive boolean default false
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform 1
  from public.google_connections connection
  where connection.id = p_connection_id
    and connection.user_id = p_user_id
    and connection.business_profile_id = p_business_profile_id
    and connection.status in ('pending_selection', 'active', 'reconnect_required')
  for update;

  if not found then
    return false;
  end if;

  if exists (
    select 1
    from public.google_connection_operation_leases lease
    where lease.google_connection_id = p_connection_id
      and lease.expires_at > now()
  ) then
    raise exception using
      errcode = '55P03',
      message = 'A Google review operation is finishing. Try disconnecting again in a moment.';
  end if;

  update public.google_connections
  set access_token_encrypted = null,
      active = false,
      archived_at = case when p_archive then now() else null end,
      disconnected_at = case when p_archive then null else now() end,
      refresh_token_encrypted = null,
      selection_expires_at = null,
      status = case when p_archive then 'archived' else 'disconnected' end,
      token_expires_at = null,
      updated_at = now()
  where id = p_connection_id;

  return true;
end
$$;

revoke all on function public.claim_google_connection_operation(uuid, uuid, text, integer)
  from public, anon, authenticated;
grant execute on function public.claim_google_connection_operation(uuid, uuid, text, integer)
  to service_role;
revoke all on function public.release_google_connection_operation(uuid, uuid)
  from public, anon, authenticated;
grant execute on function public.release_google_connection_operation(uuid, uuid)
  to service_role;
revoke all on function public.disconnect_google_connection(uuid, uuid, uuid, boolean)
  from public, anon, authenticated;
grant execute on function public.disconnect_google_connection(uuid, uuid, uuid, boolean)
  to service_role;

-- Complete all local publication changes in one transaction after Google has
-- either accepted the exact reply or returned that exact reply on a retry.
-- The short-lived claim is acquired by the API before the external request and
-- prevents concurrent publish calls from issuing duplicate Google writes.
create or replace function public.finalize_google_review_publication(
  p_claim_id uuid,
  p_draft_id uuid,
  p_user_id uuid,
  p_business_profile_id uuid,
  p_google_connection_id uuid,
  p_google_review_id uuid,
  p_reply_text text,
  p_google_updated_at timestamptz,
  p_reconciled boolean
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  draft_row public.google_review_drafts%rowtype;
  updated_draft public.google_review_drafts%rowtype;
  final_event_type text;
begin
  if p_claim_id is null or nullif(btrim(p_reply_text), '') is null then
    raise exception 'A publication claim and reply text are required';
  end if;

  select *
  into draft_row
  from public.google_review_drafts draft
  where draft.id = p_draft_id
    and draft.user_id = p_user_id
    and draft.business_profile_id = p_business_profile_id
    and draft.google_connection_id = p_google_connection_id
    and draft.google_review_id = p_google_review_id
  for update;

  if not found then
    raise exception 'The Google review draft could not be verified';
  end if;

  if draft_row.publication_claim_id is distinct from p_claim_id then
    raise exception 'The publication claim is no longer valid';
  end if;

  if coalesce(nullif(btrim(draft_row.edited_text), ''), nullif(btrim(draft_row.generated_text), ''))
     is distinct from btrim(p_reply_text) then
    raise exception 'The saved reply changed before publication completed';
  end if;

  update public.google_reviews review
  set draft_eligible = false,
      draft_eligibility_reason = 'already_replied',
      remote_reply_last_seen_at = now(),
      reply_comment = btrim(p_reply_text),
      reply_updated_at = p_google_updated_at,
      last_synced_at = now()
  where review.id = p_google_review_id
    and review.user_id = p_user_id
    and review.business_profile_id = p_business_profile_id
    and review.google_connection_id = p_google_connection_id;

  if not found then
    raise exception 'The Google review could not be verified';
  end if;

  update public.google_review_drafts draft
  set google_reply_updated_at = p_google_updated_at,
      publication_claim_id = null,
      publication_claimed_at = null,
      publication_claim_expires_at = null,
      published_at = now(),
      status = 'published',
      version = draft.version + 1
  where draft.id = p_draft_id
    and draft.publication_claim_id = p_claim_id
  returning * into updated_draft;

  if not found then
    raise exception 'The Google review draft could not be finalised';
  end if;

  final_event_type := case when p_reconciled then 'reply_reconciled' else 'reply_published' end;

  insert into public.google_review_events (
    business_profile_id,
    details,
    event_key,
    event_type,
    google_connection_id,
    google_review_draft_id,
    google_review_id,
    user_id
  ) values (
    p_business_profile_id,
    jsonb_build_object('googleUpdatedAt', p_google_updated_at, 'reconciled', p_reconciled),
    final_event_type || ':' || p_draft_id::text,
    final_event_type,
    p_google_connection_id,
    p_draft_id,
    p_google_review_id,
    p_user_id
  ) on conflict (event_key) do nothing;

  return to_jsonb(updated_draft);
end
$$;

revoke all on function public.finalize_google_review_publication(
  uuid, uuid, uuid, uuid, uuid, uuid, text, timestamptz, boolean
) from public, anon, authenticated;
grant execute on function public.finalize_google_review_publication(
  uuid, uuid, uuid, uuid, uuid, uuid, text, timestamptz, boolean
) to service_role;

alter table public.aura_google_reply_settings enable row level security;
alter table public.google_review_drafts enable row level security;
alter table public.google_review_draft_jobs enable row level security;
alter table public.google_review_events enable row level security;
alter table public.google_connection_operation_leases enable row level security;

drop policy if exists "Owners can read Google reply settings" on public.aura_google_reply_settings;
create policy "Owners can read Google reply settings"
on public.aura_google_reply_settings for select
to authenticated
using (
  user_id = (select auth.uid())
  and exists (
    select 1
    from public.business_profiles business
    where business.id = aura_google_reply_settings.business_profile_id
      and business.user_id = (select auth.uid())
  )
);

drop policy if exists "Owners can read Google review drafts" on public.google_review_drafts;
create policy "Owners can read Google review drafts"
on public.google_review_drafts for select
to authenticated
using (
  user_id = (select auth.uid())
  and exists (
    select 1
    from public.business_profiles business
    where business.id = google_review_drafts.business_profile_id
      and business.user_id = (select auth.uid())
  )
);

revoke all on table public.aura_google_reply_settings from anon, authenticated;
revoke all on table public.google_review_drafts from anon, authenticated;
revoke all on table public.google_review_draft_jobs from anon, authenticated;
revoke all on table public.google_review_events from anon, authenticated;
revoke all on table public.google_connection_operation_leases from anon, authenticated;

grant select on table public.aura_google_reply_settings to authenticated;
grant select on table public.google_review_drafts to authenticated;

grant all on table public.aura_google_reply_settings to service_role;
grant all on table public.google_review_drafts to service_role;
grant all on table public.google_review_draft_jobs to service_role;
grant select, insert on table public.google_review_events to service_role;
grant all on table public.google_connection_operation_leases to service_role;

comment on table public.aura_google_reply_settings is
  'Owner-approved tone, timing and notification settings for draft-only Google review replies.';
comment on table public.google_review_drafts is
  'AURA-generated reply drafts. A row can reach published only after an explicit owner-confirmed Google response.';
comment on table public.google_review_draft_jobs is
  'Server-only idempotent, bounded-retry AI generation jobs. Never exposed to browser roles.';
comment on table public.google_review_events is
  'Append-only server-written audit events for generation, notification and manual publication.';
comment on table public.google_connection_operation_leases is
  'Server-only short leases that coordinate Google sync/publication with disconnect and location changes.';

commit;
