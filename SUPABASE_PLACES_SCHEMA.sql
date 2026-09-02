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
