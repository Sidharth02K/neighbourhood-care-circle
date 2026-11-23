-- Neighbourhood Care Circle production data store.
-- Run once in the Supabase SQL Editor before running the demo seed.
create table if not exists public.ncc_records (
  id uuid not null,
  collection text not null check (collection in (
    'users', 'preferences', 'circles', 'activities', 'followups', 'events',
    'help_requests', 'wisdom', 'participations', 'notifications', 'verifications'
  )),
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ncc_records_id_primary_key primary key (id),
  constraint ncc_records_collection_id_unique unique (collection, id)
);

create index if not exists ncc_records_collection_idx on public.ncc_records (collection);
create index if not exists ncc_records_data_gin_idx on public.ncc_records using gin (data);
create unique index if not exists ncc_records_unique_user_email
  on public.ncc_records (lower(data->>'email')) where collection = 'users';
create unique index if not exists ncc_records_unique_followup_activity
  on public.ncc_records (data->>'activity') where collection = 'followups';

alter table public.ncc_records enable row level security;
revoke all on table public.ncc_records from anon, authenticated;
grant all on table public.ncc_records to service_role;
