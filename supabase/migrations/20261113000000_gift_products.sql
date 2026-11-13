-- Gift Finder: a small catalogue of gifts people can browse by budget and order on
-- WhatsApp. No payments happen on the site; the store confirms price, delivery fee
-- and date on WhatsApp first.
--
-- Access: anyone (the anon role) can read ACTIVE products and nothing else. There are
-- no write policies, so only the owner (Supabase dashboard) or the service role can
-- add or change products.

create table gift_products (
  id              uuid primary key default gen_random_uuid(),
  slug            text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name            text not null check (char_length(name) between 1 and 80),
  description     text not null default '' check (char_length(description) <= 400),
  price_naira     integer not null check (price_naira > 0),
  images          text[] not null default '{}',          -- paths inside the gift-images bucket
  category        text not null check (category in ('home', 'beauty', 'food', 'tech', 'fashion', 'experiences', 'kids', 'office')),
  for_whom        text[] not null default '{anyone}'
                    check (for_whom <@ array['anyone', 'her', 'him', 'kids', 'colleague', 'couple']::text[]),
  delivery_areas  text[] not null default '{lagos}',
  lead_time_days  integer not null default 2 check (lead_time_days >= 0),
  in_stock        boolean not null default true,
  active          boolean not null default false,       -- hidden until the owner switches it on
  sort            integer not null default 0,           -- lower shows first
  created_at      timestamptz not null default now()
);
create index gift_products_listing on gift_products (active, sort, price_naira);

alter table gift_products enable row level security;
create policy "Anyone can read active gifts" on gift_products
  for select to anon, authenticated using (active = true);

-- Product photos. A public bucket: images are served by URL to anyone, but with no
-- insert/update/delete policies only the owner (dashboard) can upload.
insert into storage.buckets (id, name, public)
values ('gift-images', 'gift-images', true)
on conflict (id) do nothing;
