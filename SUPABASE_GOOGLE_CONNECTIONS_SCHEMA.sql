create table if not exists google_connections (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references businesses(id),
  user_id uuid references auth.users(id),
  google_account_id text,
  access_token text,
  refresh_token text,
  expires_at timestamp with time zone,
  location_id text,
  location_name text,
  connected_at timestamp with time zone default now(),
  active boolean default true
);

create table if not exists google_review_sync_logs (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references businesses(id),
  google_connection_id uuid references google_connections(id),
  status text,
  message text,
  reviews_found int default 0,
  reviews_imported int default 0,
  created_at timestamp with time zone default now()
);

alter table google_connections enable row level security;
alter table google_review_sync_logs enable row level security;

drop policy if exists "Users can read their Google connections" on google_connections;
create policy "Users can read their Google connections"
on google_connections for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "Users can read their Google sync logs" on google_review_sync_logs;
create policy "Users can read their Google sync logs"
on google_review_sync_logs for select
to authenticated
using (
  exists (
    select 1
    from google_connections
    where google_connections.id = google_review_sync_logs.google_connection_id
    and google_connections.user_id = auth.uid()
  )
);
