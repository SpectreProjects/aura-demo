-- AURA Google Places connection.
-- Google review content is deliberately not stored; only the durable Place ID is saved.

alter table public.business_profiles
  add column if not exists google_place_id text,
  add column if not exists google_place_connected_at timestamptz;

comment on column public.business_profiles.google_place_id is
  'Google Places API Place ID selected by the authenticated business owner.';

comment on column public.business_profiles.google_place_connected_at is
  'Time the authenticated business owner selected this Google Place.';

grant select, insert, update on table public.business_profiles to authenticated;

-- Existing business_profiles RLS policies restrict SELECT/INSERT/UPDATE to user_id = auth.uid().

-- Server-enforced daily usage limits keep the Places preview below Google's monthly
-- no-charge allowances, even if an authenticated account sends repeated requests.
create table if not exists public.places_api_usage (
  usage_date date not null,
  user_id uuid not null,
  operation text not null check (operation in ('search', 'details')),
  request_count integer not null default 0 check (request_count >= 0),
  primary key (usage_date, user_id, operation)
);

alter table public.places_api_usage enable row level security;

revoke all on table public.places_api_usage from anon, authenticated;

create or replace function public.consume_places_quota(p_operation text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  utc_date date := (timezone('utc', now()))::date;
  per_user_limit integer;
  global_daily_limit integer;
  global_usage integer;
  updated_count integer;
begin
  if current_user_id is null or p_operation not in ('search', 'details') then
    return false;
  end if;

  if p_operation = 'search' then
    per_user_limit := 20;
    global_daily_limit := 150;
  else
    per_user_limit := 10;
    global_daily_limit := 30;
  end if;

  perform pg_advisory_xact_lock(hashtext('aura-places:' || utc_date::text || ':' || p_operation));

  select coalesce(sum(request_count), 0)
    into global_usage
    from public.places_api_usage
   where usage_date = utc_date
     and operation = p_operation;

  if global_usage >= global_daily_limit then
    return false;
  end if;

  insert into public.places_api_usage (usage_date, user_id, operation, request_count)
  values (utc_date, current_user_id, p_operation, 1)
  on conflict (usage_date, user_id, operation)
  do update
     set request_count = public.places_api_usage.request_count + 1
   where public.places_api_usage.request_count < per_user_limit
  returning request_count into updated_count;

  return updated_count is not null;
end;
$$;

revoke all on function public.consume_places_quota(text) from public, anon;
grant execute on function public.consume_places_quota(text) to authenticated;
