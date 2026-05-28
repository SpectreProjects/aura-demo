-- AURA V1 auth/account setup
-- Run this in the Supabase SQL editor for the project used by VITE_SUPABASE_URL.

create extension if not exists pgcrypto;

create table if not exists public.business_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  business_name text not null,
  created_at timestamptz not null default now(),
  unique (user_id)
);

create table if not exists public.manual_reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  business_profile_id uuid not null references public.business_profiles(id) on delete cascade,
  customer_name text not null,
  rating int not null check (rating between 1 and 5),
  review_text text not null,
  staff_member text,
  source text not null default 'manual',
  created_at timestamptz not null default now()
);

alter table public.business_profiles enable row level security;
alter table public.manual_reviews enable row level security;

drop policy if exists "Users can read own business profile" on public.business_profiles;
create policy "Users can read own business profile"
on public.business_profiles
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can create own business profile" on public.business_profiles;
create policy "Users can create own business profile"
on public.business_profiles
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Users can update own business profile" on public.business_profiles;
create policy "Users can update own business profile"
on public.business_profiles
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can read own manual reviews" on public.manual_reviews;
create policy "Users can read own manual reviews"
on public.manual_reviews
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can create own manual reviews" on public.manual_reviews;
create policy "Users can create own manual reviews"
on public.manual_reviews
for insert
to authenticated
with check (
  auth.uid() = user_id
  and exists (
    select 1
    from public.business_profiles
    where business_profiles.id = manual_reviews.business_profile_id
      and business_profiles.user_id = auth.uid()
  )
);

drop policy if exists "Users can update own manual reviews" on public.manual_reviews;
create policy "Users can update own manual reviews"
on public.manual_reviews
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can delete own manual reviews" on public.manual_reviews;
create policy "Users can delete own manual reviews"
on public.manual_reviews
for delete
to authenticated
using (auth.uid() = user_id);

create or replace function public.handle_new_user_business_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.business_profiles (user_id, business_name)
  values (
    new.id,
    coalesce(nullif(new.raw_user_meta_data->>'business_name', ''), split_part(new.email, '@', 1), 'My company')
  )
  on conflict (user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created_create_business_profile on auth.users;
create trigger on_auth_user_created_create_business_profile
after insert on auth.users
for each row execute function public.handle_new_user_business_profile();

create index if not exists manual_reviews_user_created_at_idx
on public.manual_reviews (user_id, created_at desc);

create index if not exists manual_reviews_business_profile_created_at_idx
on public.manual_reviews (business_profile_id, created_at desc);
