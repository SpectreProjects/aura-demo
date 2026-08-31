alter table public.business_profiles
  add column if not exists public_slug text,
  add column if not exists leaderboard_public boolean not null default false,
  add column if not exists leaderboard_pin_hash text;

update public.business_profiles
set public_slug = lower(
  regexp_replace(
    regexp_replace(business_name, '[^a-zA-Z0-9]+', '-', 'g'),
    '(^-|-$)',
    '',
    'g'
  )
) || '-' || left(id::text, 8)
where public_slug is null or public_slug = '';

create unique index if not exists business_profiles_public_slug_key
  on public.business_profiles (public_slug);

create table if not exists public.aura_staff (
  id uuid primary key default gen_random_uuid(),
  business_profile_id uuid not null references public.business_profiles(id) on delete cascade,
  name text not null,
  job_title text not null default '',
  job_category text not null default 'Front of House',
  is_active boolean not null default true,
  total_mentions integer not null default 0 check (total_mentions >= 0),
  positive_mentions integer not null default 0 check (positive_mentions >= 0),
  neutral_mentions integer not null default 0 check (neutral_mentions >= 0),
  negative_mentions integer not null default 0 check (negative_mentions >= 0),
  latest_excerpt text not null default 'No reviews mentioning this team member yet.',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (business_profile_id, name)
);

create table if not exists public.aura_rewards (
  id uuid primary key default gen_random_uuid(),
  business_profile_id uuid not null references public.business_profiles(id) on delete cascade,
  title text not null,
  description text not null default '',
  points_required integer not null check (points_required > 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (business_profile_id, title)
);

create table if not exists public.aura_point_events (
  id uuid primary key default gen_random_uuid(),
  business_profile_id uuid not null references public.business_profiles(id) on delete cascade,
  staff_id uuid not null references public.aura_staff(id) on delete cascade,
  points_delta integer not null check (points_delta <> 0),
  event_type text not null check (event_type in ('review_award', 'manual_adjustment', 'reward_redemption')),
  reason text not null,
  source_key text,
  include_in_monthly boolean not null default true,
  include_in_lifetime boolean not null default true,
  include_in_balance boolean not null default true,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (business_profile_id, source_key)
);

create table if not exists public.aura_reward_redemptions (
  id uuid primary key default gen_random_uuid(),
  business_profile_id uuid not null references public.business_profiles(id) on delete cascade,
  staff_id uuid not null references public.aura_staff(id) on delete cascade,
  reward_id uuid not null references public.aura_rewards(id) on delete restrict,
  points_spent integer not null check (points_spent > 0),
  note text not null default '',
  redeemed_by uuid references auth.users(id) on delete set null,
  redeemed_at timestamptz not null default now()
);

create index if not exists aura_staff_business_profile_id_idx
  on public.aura_staff (business_profile_id);
create index if not exists aura_point_events_staff_created_at_idx
  on public.aura_point_events (staff_id, created_at desc);
create index if not exists aura_point_events_business_profile_id_idx
  on public.aura_point_events (business_profile_id);
create index if not exists aura_point_events_created_by_idx
  on public.aura_point_events (created_by);
create index if not exists aura_reward_redemptions_staff_idx
  on public.aura_reward_redemptions (staff_id, redeemed_at desc);
create index if not exists aura_reward_redemptions_business_profile_id_idx
  on public.aura_reward_redemptions (business_profile_id);
create index if not exists aura_reward_redemptions_reward_id_idx
  on public.aura_reward_redemptions (reward_id);
create index if not exists aura_reward_redemptions_redeemed_by_idx
  on public.aura_reward_redemptions (redeemed_by);
create index if not exists business_profiles_user_id_idx
  on public.business_profiles (user_id);

alter table public.aura_staff enable row level security;
alter table public.aura_rewards enable row level security;
alter table public.aura_point_events enable row level security;
alter table public.aura_reward_redemptions enable row level security;

drop policy if exists "Owners manage AURA staff" on public.aura_staff;
create policy "Owners manage AURA staff"
on public.aura_staff for all
to authenticated
using (
  exists (
    select 1 from public.business_profiles
    where business_profiles.id = aura_staff.business_profile_id
      and business_profiles.user_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1 from public.business_profiles
    where business_profiles.id = aura_staff.business_profile_id
      and business_profiles.user_id = (select auth.uid())
  )
);

drop policy if exists "Owners manage AURA rewards" on public.aura_rewards;
create policy "Owners manage AURA rewards"
on public.aura_rewards for all
to authenticated
using (
  exists (
    select 1 from public.business_profiles
    where business_profiles.id = aura_rewards.business_profile_id
      and business_profiles.user_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1 from public.business_profiles
    where business_profiles.id = aura_rewards.business_profile_id
      and business_profiles.user_id = (select auth.uid())
  )
);

drop policy if exists "Owners manage AURA point events" on public.aura_point_events;
create policy "Owners manage AURA point events"
on public.aura_point_events for all
to authenticated
using (
  exists (
    select 1 from public.business_profiles
    where business_profiles.id = aura_point_events.business_profile_id
      and business_profiles.user_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1 from public.business_profiles
    where business_profiles.id = aura_point_events.business_profile_id
      and business_profiles.user_id = (select auth.uid())
  )
);

drop policy if exists "Owners manage AURA redemptions" on public.aura_reward_redemptions;
create policy "Owners manage AURA redemptions"
on public.aura_reward_redemptions for all
to authenticated
using (
  exists (
    select 1 from public.business_profiles
    where business_profiles.id = aura_reward_redemptions.business_profile_id
      and business_profiles.user_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1 from public.business_profiles
    where business_profiles.id = aura_reward_redemptions.business_profile_id
      and business_profiles.user_id = (select auth.uid())
  )
);

revoke all on public.aura_staff from anon;
revoke all on public.aura_rewards from anon;
revoke all on public.aura_point_events from anon;
revoke all on public.aura_reward_redemptions from anon;
revoke all on public.aura_staff from authenticated;
revoke all on public.aura_rewards from authenticated;
revoke all on public.aura_point_events from authenticated;
revoke all on public.aura_reward_redemptions from authenticated;
grant select, insert, update on public.aura_staff to authenticated;
grant select, insert, update, delete on public.aura_rewards to authenticated;
grant select, insert on public.aura_point_events to authenticated;
grant select, insert on public.aura_reward_redemptions to authenticated;

create or replace function public.get_aura_public_leaderboard(
  p_slug text,
  p_pin text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_business_id uuid;
  v_business_name text;
  v_pin_hash text;
  v_staff jsonb;
begin
  select id, business_name, leaderboard_pin_hash
  into v_business_id, v_business_name, v_pin_hash
  from public.business_profiles
  where public_slug = p_slug
    and leaderboard_public = true
  limit 1;

  if v_business_id is null then
    return jsonb_build_object('status', 'not_found');
  end if;

  if v_pin_hash is not null
    and (p_pin is null or extensions.crypt(p_pin, v_pin_hash) <> v_pin_hash) then
    return jsonb_build_object(
      'status', 'pin_required',
      'business_name', v_business_name
    );
  end if;

  with staff_totals as (
    select
      s.id,
      s.name,
      s.job_title,
      s.job_category,
      s.total_mentions,
      s.positive_mentions,
      coalesce(sum(e.points_delta) filter (
        where e.include_in_monthly = true
          and date_trunc('month', e.created_at) = date_trunc('month', now())
      ), 0)::integer as monthly_points,
      coalesce(sum(e.points_delta) filter (where e.include_in_lifetime = true), 0)::integer as lifetime_points,
      greatest(coalesce(sum(e.points_delta) filter (where e.include_in_balance = true), 0), 0)::integer as redeemable_balance
    from public.aura_staff s
    left join public.aura_point_events e on e.staff_id = s.id
    where s.business_profile_id = v_business_id
      and s.is_active = true
    group by s.id
  ),
  ranked as (
    select
      staff_totals.*,
      dense_rank() over (
        order by monthly_points desc, total_mentions desc, name asc
      )::integer as rank
    from staff_totals
  )
  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'id', ranked.id,
        'rank', ranked.rank,
        'name', ranked.name,
        'job_title', ranked.job_title,
        'job_category', ranked.job_category,
        'mentions', ranked.total_mentions,
        'positive_mentions', ranked.positive_mentions,
        'monthly_points', ranked.monthly_points,
        'lifetime_points', ranked.lifetime_points,
        'earned_rewards', coalesce((
          select jsonb_agg(
            jsonb_build_object(
              'title', reward.title,
              'redeemed_at', redemption.redeemed_at
            )
            order by redemption.redeemed_at desc
          )
          from public.aura_reward_redemptions redemption
          join public.aura_rewards reward on reward.id = redemption.reward_id
          where redemption.staff_id = ranked.id
        ), '[]'::jsonb),
        'next_reward', (
          select jsonb_build_object(
            'title', reward.title,
            'progress_percent', least(
              100,
              floor((ranked.redeemable_balance::numeric / reward.points_required) * 100)
            )::integer
          )
          from public.aura_rewards reward
          where reward.business_profile_id = v_business_id
            and reward.is_active = true
            and reward.points_required > ranked.redeemable_balance
          order by reward.points_required asc
          limit 1
        )
      )
      order by ranked.rank, ranked.name
    ),
    '[]'::jsonb
  )
  into v_staff
  from ranked;

  return jsonb_build_object(
    'status', 'ok',
    'business_name', v_business_name,
    'staff', v_staff,
    'updated_at', now()
  );
end;
$$;

revoke all on function public.get_aura_public_leaderboard(text, text) from public;
grant execute on function public.get_aura_public_leaderboard(text, text) to anon, authenticated;

create or replace function public.set_aura_leaderboard_pin(p_pin text default null)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if nullif(trim(p_pin), '') is not null and trim(p_pin) !~ '^[0-9]{4,8}$' then
    raise exception 'The leaderboard PIN must contain 4 to 8 digits.';
  end if;

  update public.business_profiles
  set leaderboard_pin_hash = case
    when nullif(trim(p_pin), '') is null then null
    else extensions.crypt(trim(p_pin), extensions.gen_salt('bf'))
  end
  where user_id = (select auth.uid());

  if not found then
    raise exception 'No AURA business profile was found for this account.';
  end if;
end;
$$;

revoke all on function public.set_aura_leaderboard_pin(text) from public, anon;
grant execute on function public.set_aura_leaderboard_pin(text) to authenticated;

create or replace function public.redeem_aura_reward(
  p_staff_id uuid,
  p_reward_id uuid,
  p_note text default ''
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_business_id uuid;
  v_points_required integer;
  v_balance integer;
  v_redemption_id uuid;
begin
  select staff.business_profile_id
  into v_business_id
  from public.aura_staff staff
  join public.business_profiles business on business.id = staff.business_profile_id
  where staff.id = p_staff_id
    and business.user_id = (select auth.uid());

  if v_business_id is null then
    raise exception 'Staff member not found.';
  end if;

  select points_required
  into v_points_required
  from public.aura_rewards
  where id = p_reward_id
    and business_profile_id = v_business_id
    and is_active = true;

  if v_points_required is null then
    raise exception 'Reward not found.';
  end if;

  select greatest(coalesce(sum(points_delta) filter (where include_in_balance = true), 0), 0)::integer
  into v_balance
  from public.aura_point_events
  where staff_id = p_staff_id;

  if v_balance < v_points_required then
    raise exception 'This staff member does not have enough redeemable points.';
  end if;

  insert into public.aura_reward_redemptions (
    business_profile_id,
    staff_id,
    reward_id,
    points_spent,
    note,
    redeemed_by
  )
  values (
    v_business_id,
    p_staff_id,
    p_reward_id,
    v_points_required,
    coalesce(p_note, ''),
    (select auth.uid())
  )
  returning id into v_redemption_id;

  insert into public.aura_point_events (
    business_profile_id,
    staff_id,
    points_delta,
    event_type,
    reason,
    include_in_monthly,
    include_in_lifetime,
    include_in_balance,
    created_by
  )
  values (
    v_business_id,
    p_staff_id,
    -v_points_required,
    'reward_redemption',
    'Reward redeemed',
    false,
    false,
    true,
    (select auth.uid())
  );

  return v_redemption_id;
end;
$$;

revoke all on function public.redeem_aura_reward(uuid, uuid, text) from public, anon;
grant execute on function public.redeem_aura_reward(uuid, uuid, text) to authenticated;

notify pgrst, 'reload schema';
