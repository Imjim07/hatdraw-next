-- Ajo payout-order draw.
-- HatDraw never holds or moves money: these tables store a payout ORDER,
-- dates, optional reminder emails and swap records. Nothing else.
--
-- Access: RLS is on for every table with NO policies, so the anon and
-- authenticated roles can read/write nothing. Only server route handlers
-- using the service-role key (which bypasses RLS) touch this data.

create extension if not exists pgcrypto;

create table ajo_groups (
  id                uuid primary key default gen_random_uuid(),
  public_id         text not null unique,               -- random, unguessable, used in URLs
  name              text not null check (char_length(name) between 1 and 60),
  amount_naira      integer not null check (amount_naira > 0 and amount_naira <= 10000000),
  frequency         text not null check (frequency in ('weekly', 'biweekly', 'monthly')),
  start_date        date not null,
  admin_token_hash  text not null,                      -- sha256(base64url token); the token itself is never stored
  research_consent  boolean not null default false,
  status            text not null default 'setup' check (status in ('setup', 'scheduled_live', 'drawn', 'complete')),
  live_reveal_at    timestamptz null,
  created_at        timestamptz not null default now()
);

create table ajo_members (
  id           uuid primary key default gen_random_uuid(),
  group_id     uuid not null references ajo_groups (id) on delete cascade,
  name         text not null check (char_length(name) between 1 and 40),
  token_hash   text not null unique,
  email        text null check (email is null or char_length(email) <= 254),
  remind       boolean not null default false,
  pinned_turn  integer null check (pinned_turn is null or pinned_turn >= 1),
  created_at   timestamptz not null default now(),
  unique (group_id, name)
);
-- A turn can be pinned to at most one member.
create unique index ajo_members_pinned_turn on ajo_members (group_id, pinned_turn) where pinned_turn is not null;
create index ajo_members_group on ajo_members (group_id);

create table ajo_draws (
  id            uuid primary key default gen_random_uuid(),
  group_id      uuid not null references ajo_groups (id) on delete cascade,
  mode          text not null check (mode in ('instant', 'live')),
  member_order  uuid[] not null,                        -- turn 1 first
  drawn_at      timestamptz not null default now(),
  redraw_count  integer not null default 0 check (redraw_count >= 0),
  locked        boolean not null default true,
  is_current    boolean not null default true          -- history rows (replaced by a redraw) are false
);
-- One current draw per group; earlier draws stay as history.
create unique index ajo_draws_current on ajo_draws (group_id) where is_current;
create index ajo_draws_group on ajo_draws (group_id, drawn_at);

create table ajo_swaps (
  id            uuid primary key default gen_random_uuid(),
  group_id      uuid not null references ajo_groups (id) on delete cascade,
  from_member   uuid not null references ajo_members (id) on delete cascade, -- asked (their request is their confirmation)
  to_member     uuid not null references ajo_members (id) on delete cascade, -- must confirm from their own link
  status        text not null default 'pending' check (status in ('pending', 'confirmed', 'declined', 'expired')),
  requested_at  timestamptz not null default now(),
  resolved_at   timestamptz null,                       -- pending swaps expire after 72 hours
  check (from_member <> to_member)
);
create index ajo_swaps_group on ajo_swaps (group_id, requested_at);

create table ajo_reminders_sent (
  group_id  uuid not null references ajo_groups (id) on delete cascade,
  turn      integer not null,
  sent_at   timestamptz not null default now(),
  unique (group_id, turn)                               -- cron reruns never send twice
);

alter table ajo_groups         enable row level security;
alter table ajo_members        enable row level security;
alter table ajo_draws          enable row level security;
alter table ajo_swaps          enable row level security;
alter table ajo_reminders_sent enable row level security;
-- Intentionally no policies: anon/authenticated get nothing.
revoke all on ajo_groups, ajo_members, ajo_draws, ajo_swaps, ajo_reminders_sent from anon, authenticated;

-- Research: only for groups that opted in, and only these three anonymous
-- fields (group size, amount band, frequency). Service role only.
create view ajo_research with (security_invoker = true) as
select
  (select count(*) from ajo_members m where m.group_id = g.id) as group_size,
  case
    when g.amount_naira <    10000 then 'under 10k'
    when g.amount_naira <    50000 then '10k to 50k'
    when g.amount_naira <   200000 then '50k to 200k'
    when g.amount_naira <  1000000 then '200k to 1m'
    else '1m and over'
  end as amount_band,
  g.frequency
from ajo_groups g
where g.research_consent;
revoke all on ajo_research from anon, authenticated;
