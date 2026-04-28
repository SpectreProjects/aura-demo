create table if not exists businesses (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  business_type text,
  locations_count int default 1,
  created_at timestamp default now()
);

create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  business_id uuid references businesses(id) on delete set null,
  full_name text,
  email text,
  role text default 'owner',
  created_at timestamp default now()
);

alter table businesses enable row level security;
alter table profiles enable row level security;

drop policy if exists "Owners can read their profile" on profiles;
create policy "Owners can read their profile"
on profiles for select
to authenticated
using (id = auth.uid());

drop policy if exists "Owners can insert their profile" on profiles;
create policy "Owners can insert their profile"
on profiles for insert
to authenticated
with check (id = auth.uid());

drop policy if exists "Owners can update their profile" on profiles;
create policy "Owners can update their profile"
on profiles for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

drop policy if exists "Users can read their business" on businesses;
create policy "Users can read their business"
on businesses for select
to authenticated
using (
  exists (
    select 1
    from profiles
    where profiles.business_id = businesses.id
    and profiles.id = auth.uid()
  )
);

drop policy if exists "Authenticated users can create businesses" on businesses;
create policy "Authenticated users can create businesses"
on businesses for insert
to authenticated
with check (true);

drop policy if exists "Owners can update their business" on businesses;
create policy "Owners can update their business"
on businesses for update
to authenticated
using (
  exists (
    select 1
    from profiles
    where profiles.business_id = businesses.id
    and profiles.id = auth.uid()
    and profiles.role = 'owner'
  )
)
with check (
  exists (
    select 1
    from profiles
    where profiles.business_id = businesses.id
    and profiles.id = auth.uid()
    and profiles.role = 'owner'
  )
);
