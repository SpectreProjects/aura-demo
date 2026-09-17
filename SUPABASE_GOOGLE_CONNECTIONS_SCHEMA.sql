-- AURA Google Business Profile integration for the Vercel deployment.
-- Run in the Supabase project referenced by VITE_SUPABASE_URL.
-- OAuth tokens are encrypted by the server before they reach this table.

create table if not exists public.google_connections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  business_profile_id uuid references public.business_profiles(id) on delete cascade,
  google_account_name text,
  google_account_title text,
  google_location_name text,
  google_location_title text,
  access_token_encrypted text,
  refresh_token_encrypted text,
  token_expires_at timestamptz,
  granted_scope text,
  connected_at timestamptz not null default now(),
  last_synced_at timestamptz,
  updated_at timestamptz not null default now(),
  active boolean not null default true
);

-- Upgrade the original prototype table without deleting existing rows.
alter table public.google_connections add column if not exists business_profile_id uuid references public.business_profiles(id) on delete cascade;
alter table public.google_connections add column if not exists google_account_name text;
alter table public.google_connections add column if not exists google_account_title text;
alter table public.google_connections add column if not exists google_location_name text;
alter table public.google_connections add column if not exists google_location_title text;
alter table public.google_connections add column if not exists access_token_encrypted text;
alter table public.google_connections add column if not exists refresh_token_encrypted text;
alter table public.google_connections add column if not exists token_expires_at timestamptz;
alter table public.google_connections add column if not exists granted_scope text;
alter table public.google_connections add column if not exists last_synced_at timestamptz;
alter table public.google_connections add column if not exists updated_at timestamptz not null default now();

create unique index if not exists google_connections_user_business_idx
  on public.google_connections (user_id, business_profile_id)
  where user_id is not null and business_profile_id is not null;

create table if not exists public.google_reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  business_profile_id uuid not null references public.business_profiles(id) on delete cascade,
  google_connection_id uuid not null references public.google_connections(id) on delete cascade,
  google_review_name text not null unique,
  google_review_id text,
  reviewer_name text,
  rating smallint not null check (rating between 1 and 5),
  comment text,
  review_created_at timestamptz not null,
  review_updated_at timestamptz not null,
  reply_comment text,
  reply_updated_at timestamptz,
  last_synced_at timestamptz not null default now(),
  raw_review jsonb not null default '{}'::jsonb
);

create index if not exists google_reviews_business_created_idx
  on public.google_reviews (business_profile_id, review_created_at desc);

create table if not exists public.google_review_sync_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  business_profile_id uuid references public.business_profiles(id) on delete cascade,
  google_connection_id uuid references public.google_connections(id) on delete cascade,
  status text not null,
  message text,
  reviews_found integer not null default 0,
  reviews_imported integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.google_review_sync_logs add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table public.google_review_sync_logs add column if not exists business_profile_id uuid references public.business_profiles(id) on delete cascade;

alter table public.google_connections enable row level security;
alter table public.google_reviews enable row level security;
alter table public.google_review_sync_logs enable row level security;

-- Tokens are server-only. Connection status is returned by /api/google-status.
drop policy if exists "Users can read their Google connections" on public.google_connections;
drop policy if exists "Users can read their Google sync logs" on public.google_review_sync_logs;
revoke all on table public.google_connections from anon, authenticated;
revoke all on table public.google_review_sync_logs from anon, authenticated;

drop policy if exists "Owners can read imported Google reviews" on public.google_reviews;
create policy "Owners can read imported Google reviews"
on public.google_reviews for select
to authenticated
using (
  (select auth.uid()) = user_id
  and exists (
    select 1
    from public.business_profiles business
    where business.id = google_reviews.business_profile_id
      and business.user_id = (select auth.uid())
  )
);

revoke all on table public.google_reviews from anon;
revoke insert, update, delete on table public.google_reviews from authenticated;
grant select on table public.google_reviews to authenticated;

-- Supabase's newer Data API defaults may no longer grant new tables to service_role.
-- Keep the backend operational while browser roles remain least-privileged.
grant all on table public.google_connections, public.google_reviews, public.google_review_sync_logs to service_role;

comment on table public.google_connections is
  'Server-only encrypted Google OAuth connections. Never grant browser clients access to token columns.';
comment on table public.google_reviews is
  'Google Business Profile reviews imported for an authenticated AURA business.';
