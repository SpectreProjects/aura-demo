# AURA MVP Supabase Setup

This MVP can run without Supabase by using local browser storage. To persist reviews, staff points and rewards across devices, add these Vercel environment variables and run the SQL below in your Supabase project.

## Vercel Environment Variables

```text
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## SQL

Run this in the Supabase SQL editor.

```sql
create table if not exists public.staff (
  id text primary key,
  name text not null unique,
  job_title text,
  job_category text,
  employment_type text,
  contractual_hours text,
  points integer not null default 0,
  total_mentions integer not null default 0,
  positive_mentions integer not null default 0,
  neutral_mentions integer not null default 0,
  negative_mentions integer not null default 0,
  latest_excerpt text,
  created_at timestamptz not null default now()
);

alter table public.staff add column if not exists job_title text;
alter table public.staff add column if not exists job_category text;
alter table public.staff add column if not exists employment_type text;
alter table public.staff add column if not exists contractual_hours text;
alter table public.staff add column if not exists neutral_mentions integer not null default 0;
alter table public.staff add column if not exists negative_mentions integer not null default 0;

create table if not exists public.reviews (
  id text primary key,
  customer_name text not null,
  rating integer not null check (rating between 1 and 5),
  text text not null,
  mentioned_staff text[] not null default '{}',
  created_at timestamptz not null default now()
);

create table if not exists public.rewards (
  id text primary key,
  title text not null,
  description text not null,
  points_required integer not null check (points_required > 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.unresolved_mentions (
  id text primary key,
  name text not null,
  review_id text not null references public.reviews(id) on delete cascade,
  review_excerpt text not null,
  rating integer not null check (rating between 1 and 5),
  created_at timestamptz not null default now()
);

create table if not exists public.point_rules (
  rating integer primary key check (rating in (4, 5)),
  points integer not null default 0 check (points >= 0),
  updated_at timestamptz not null default now()
);

create table if not exists public.point_events (
  id text primary key,
  staff_id text not null,
  staff_name text not null,
  review_id text not null,
  points_awarded integer not null check (points_awarded > 0),
  rating integer not null check (rating in (4, 5)),
  reason text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.job_categories (
  id text primary key,
  name text not null unique,
  created_at timestamptz not null default now()
);

insert into public.staff (
  id,
  name,
  job_title,
  job_category,
  employment_type,
  contractual_hours,
  points,
  total_mentions,
  positive_mentions,
  neutral_mentions,
  negative_mentions,
  latest_excerpt
)
values
  ('caitlin', 'Caitlin', 'Reception Manager', 'Reception', 'Full time', '40', 0, 0, 0, 0, 0, 'No reviews mentioning this team member yet.'),
  ('emma', 'Emma', 'Guest Experience Lead', 'Front of House', 'Full time', '37.5', 0, 0, 0, 0, 0, 'No reviews mentioning this team member yet.'),
  ('daniel', 'Daniel', 'Restaurant Supervisor', 'Waiting Staff', 'Full time', '40', 0, 0, 0, 0, 0, 'No reviews mentioning this team member yet.'),
  ('sophie', 'Sophie', 'Housekeeping Lead', 'Housekeeping', 'Part time', '24', 0, 0, 0, 0, 0, 'No reviews mentioning this team member yet.'),
  ('john', 'John', 'Bar Manager', 'Bar', 'Full time', '40', 0, 0, 0, 0, 0, 'No reviews mentioning this team member yet.')
on conflict (id) do nothing;

insert into public.rewards (id, title, description, points_required, is_active)
values
  ('free-coffee', 'Free coffee', 'A barista coffee from the hotel lounge or restaurant bar.', 20, true),
  ('meal-voucher', '£10 meal voucher', 'A voucher toward lunch or dinner during shift.', 40, true),
  ('extra-break', 'Extra break', 'A 20 minute wellbeing break approved by the duty manager.', 30, true),
  ('recognition-badge', 'Team recognition badge', 'A monthly recognition badge for standout customer feedback.', 50, true),
  ('dinner-voucher', 'Dinner voucher', 'A dinner voucher for the team member and a guest.', 80, true)
on conflict (id) do nothing;

insert into public.point_rules (rating, points)
values
  (4, 3),
  (5, 5)
on conflict (rating) do nothing;

insert into public.job_categories (id, name)
values
  ('front-of-house', 'Front of House'),
  ('kitchen', 'Kitchen'),
  ('waiting-staff', 'Waiting Staff'),
  ('bar', 'Bar'),
  ('reception', 'Reception'),
  ('housekeeping', 'Housekeeping'),
  ('management', 'Management')
on conflict (id) do nothing;
```

## Temporary MVP Access Policy

This version has no real authentication. If Row Level Security is enabled, add temporary public policies for MVP testing only:

```sql
alter table public.staff enable row level security;
alter table public.reviews enable row level security;
alter table public.rewards enable row level security;
alter table public.unresolved_mentions enable row level security;
alter table public.point_rules enable row level security;
alter table public.point_events enable row level security;
alter table public.job_categories enable row level security;

create policy "MVP public read staff"
on public.staff for select
to anon
using (true);

create policy "MVP public write staff"
on public.staff for insert
to anon
with check (true);

create policy "MVP public update staff"
on public.staff for update
to anon
using (true)
with check (true);

create policy "MVP public read reviews"
on public.reviews for select
to anon
using (true);

create policy "MVP public write reviews"
on public.reviews for insert
to anon
with check (true);

create policy "MVP public update reviews"
on public.reviews for update
to anon
using (true)
with check (true);

create policy "MVP public read rewards"
on public.rewards for select
to anon
using (true);

create policy "MVP public write rewards"
on public.rewards for insert
to anon
with check (true);

create policy "MVP public update rewards"
on public.rewards for update
to anon
using (true)
with check (true);

create policy "MVP public delete rewards"
on public.rewards for delete
to anon
using (true);

create policy "MVP public read unresolved mentions"
on public.unresolved_mentions for select
to anon
using (true);

create policy "MVP public write unresolved mentions"
on public.unresolved_mentions for insert
to anon
with check (true);

create policy "MVP public delete unresolved mentions"
on public.unresolved_mentions for delete
to anon
using (true);

create policy "MVP public read point rules"
on public.point_rules for select
to anon
using (true);

create policy "MVP public write point rules"
on public.point_rules for insert
to anon
with check (true);

create policy "MVP public update point rules"
on public.point_rules for update
to anon
using (true)
with check (true);

create policy "MVP public read point events"
on public.point_events for select
to anon
using (true);

create policy "MVP public write point events"
on public.point_events for insert
to anon
with check (true);

create policy "MVP public read job categories"
on public.job_categories for select
to anon
using (true);

create policy "MVP public write job categories"
on public.job_categories for insert
to anon
with check (true);

create policy "MVP public update job categories"
on public.job_categories for update
to anon
using (true)
with check (true);
```

Remove or tighten these policies before adding real users.
