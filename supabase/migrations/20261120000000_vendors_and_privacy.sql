-- Gift Finder vendors, order refs, payment records and anonymous ajo research.
-- Principle: store as little as possible, and delete it on a schedule.

-- ---------------------------------------------------------------------------
-- Vendors: every gift is sold by a vendor, and its order button opens THAT
-- vendor's WhatsApp. The site never takes payment for gifts.
create table vendors (
  id              uuid primary key default gen_random_uuid(),
  slug            text unique not null check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name            text not null check (char_length(name) between 1 and 60),
  -- international format, digits only: 10–15 digits, no "+", no spaces, no leading 0,
  -- and no 0 straight after Nigeria's 234 (2348012345678, not 23408012345678)
  whatsapp        text not null check (whatsapp ~ '^[1-9][0-9]{9,14}$' and whatsapp !~ '^2340'),
  delivery_areas  text[] not null check (cardinality(delivery_areas) > 0),  -- e.g. {'Lagos Mainland','Lekki'}
  delivery_time   text,                                                     -- e.g. '2–4 days'
  refund_line     text not null check (char_length(refund_line) between 1 and 200),
  verified_at     timestamptz,          -- null = not checked yet; "Checked by" shows only when set
  active          boolean not null default true,
  created_at      timestamptz not null default now()
);

alter table vendors enable row level security;
create policy "Anyone can read active vendors" on vendors
  for select to anon, authenticated using (active = true);

-- Existing rows (the [Sample] seed products) need a vendor before the column can be
-- required. This sample vendor is inactive, like the sample products, and its number
-- is not a real line (country code 1, area code 000 doesn't exist).
insert into vendors (id, slug, name, whatsapp, delivery_areas, delivery_time, refund_line, verified_at, active)
values ('00000000-0000-4000-8000-000000000001', 'sample-ada-candles', '[Sample] Ada''s Candles', '10000000001',
        '{Lagos Mainland,Lekki}', '2–4 days', 'Sample vendor. Not a real refund policy.', now(), false)
on conflict (id) do nothing;

alter table gift_products add column vendor_id uuid references vendors (id);
update gift_products set vendor_id = '00000000-0000-4000-8000-000000000001' where vendor_id is null;
alter table gift_products alter column vendor_id set not null;
create index gift_products_vendor on gift_products (vendor_id);

-- A product shows only while its vendor is active too.
drop policy "Anyone can read active gifts" on gift_products;
create policy "Anyone can read active gifts from active vendors" on gift_products
  for select to anon, authenticated
  using (active = true and exists (select 1 from vendors v where v.id = vendor_id and v.active));

-- One row per click on "Order from [Vendor] on WhatsApp". No buyer data of any kind:
-- the ref is how a vendor's orders are counted (and, later, commission is charged).
create table gift_clicks (
  ref         text primary key check (ref ~ '^CDR-[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{6}$'),
  product_id  uuid not null references gift_products (id),
  vendor_id   uuid not null references vendors (id),
  created_at  timestamptz not null default now()
);
create index gift_clicks_vendor on gift_clicks (vendor_id, created_at);
alter table gift_clicks enable row level security;
-- No policies: written by the server (service role) only, read in the dashboard only.
revoke all on gift_clicks from anon, authenticated;

-- ---------------------------------------------------------------------------
-- Big circle payments: one Paystack reference unlocks one draw. Never the payer's
-- email, name or card. The draw id is random and links to nothing (draws aren't stored).
create table payments (
  reference     text primary key check (char_length(reference) between 1 and 100),
  amount_naira  integer not null check (amount_naira > 0),
  status        text not null check (status in ('success')),
  draw_id       uuid not null,
  created_at    timestamptz not null default now()
);
alter table payments enable row level security;
revoke all on payments from anon, authenticated;

-- ---------------------------------------------------------------------------
-- Ajo research (opt-in): group size, contribution, frequency and the month the group
-- was created. Its own table, no foreign key, nothing that leads back to a group.
create table ajo_research_stats (
  group_size     integer not null check (group_size > 0),
  amount_naira   integer not null check (amount_naira > 0),
  frequency      text not null check (frequency in ('weekly', 'biweekly', 'monthly')),
  created_month  date not null check (extract(day from created_month) = 1)
);
alter table ajo_research_stats enable row level security;
revoke all on ajo_research_stats from anon, authenticated;

-- The old view read research straight from the groups; it and the flag go.
drop view if exists ajo_research;
alter table ajo_groups drop column research_consent;
