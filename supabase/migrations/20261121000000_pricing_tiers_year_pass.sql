-- Pricing tiers (Mid circle ₦1,500 for 16–50, Big circle ₦7,500 for 51–500) and the
-- Year pass (₦15,000, 365 days, up to 25 draws of up to 500 people). No accounts: a pass
-- is a code, and only its SHA-256 hash is stored. No email, no name, anywhere here.

-- The payments table from 20261120 recorded live payments only, and live payments were
-- never switched on, so it is replaced rather than migrated.
drop table if exists payments cascade;

create table payments (
  reference    text primary key check (reference ~ '^KDR-[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{10}$'),
  kind         text not null check (kind in ('draw', 'upgrade', 'pass')),
  tier         text check (tier in ('mid', 'big')),           -- null for a pass
  max_people   integer not null check (max_people between 16 and 500),
  amount_kobo  integer not null check (amount_kobo > 0),      -- set by the server from PRICING
  status       text not null default 'pending' check (status in ('pending', 'paid', 'used')),
  upgrade_of   text references payments (reference),         -- kind 'upgrade': the payment it tops up
  created_at   timestamptz not null default now(),
  paid_at      timestamptz,
  used_at      timestamptz,
  check ((kind = 'upgrade') = (upgrade_of is not null)),
  check ((kind = 'pass') = (tier is null))
);
alter table payments enable row level security;
revoke all on payments from anon, authenticated;   -- server (service role) only

create table year_passes (
  id                 uuid primary key default gen_random_uuid(),
  code_hash          text not null unique,               -- sha256 of the code; the code itself is never stored
  payment_reference  text not null unique references payments (reference),
  expires_at         timestamptz not null,
  draws_used         integer not null default 0 check (draws_used >= 0),
  code_issued        boolean not null default false,     -- shown to the buyer once; after that, support reissues
  created_at         timestamptz not null default now()
);
alter table year_passes enable row level security;
revoke all on year_passes from anon, authenticated;

-- Uses one draw of a pass, atomically: only while it hasn't expired, has draws left and
-- the circle fits. Returns the pass after the draw, or nothing.
create or replace function claim_year_pass(p_code_hash text, p_people integer, p_max_people integer, p_max_draws integer, p_now timestamptz)
returns table (expires_at timestamptz, draws_used integer)
language sql
security definer
set search_path = public
as $$
  update year_passes y
     set draws_used = y.draws_used + 1
   where y.code_hash = p_code_hash
     and y.expires_at > p_now
     and y.draws_used < p_max_draws
     and p_people <= p_max_people
  returning y.expires_at, y.draws_used;
$$;
revoke all on function claim_year_pass(text, integer, integer, integer, timestamptz) from public, anon, authenticated;
