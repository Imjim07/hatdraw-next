# Adding gifts to the Gift Finder

The Gift Finder (`/gifts`) shows products from the `gift_products` table in Supabase. You add and edit them in the Supabase dashboard; there's no admin screen on the site.

A product only appears on the site when **`active` is on**. Changes show up within **10 minutes**, because the catalogue is cached for that long.

## 1. Upload the photos

1. In Supabase, open **Storage → gift-images**.
2. Make a folder for the product, named after its slug, for example `ankara-tote`.
3. Upload the photos into it. Square photos about 1200 × 1200 px look best; keep each one under about 500 KB.
4. Note each file's **path inside the bucket**, for example `ankara-tote/front.jpg`.

For real products, use your own photos of what you actually sell, not stock photos.

## 2. Add the product

Open **Table Editor → gift_products → Insert row** and fill in:

| Field | What to enter |
|---|---|
| `slug` | The web address for the product: lowercase words joined by hyphens, e.g. `ankara-tote`. Must be unique. The page will be `/gifts/ankara-tote`. |
| `name` | The product name, up to 80 characters. |
| `description` | Up to 400 characters. Say what it is, its size or contents, and anything the buyer should know. |
| `price_naira` | The price in naira as a whole number, e.g. `18500`. It's shown exactly as entered. Don't include the delivery fee; that's confirmed on WhatsApp. |
| `images` | The photo paths from step 1, e.g. `{ankara-tote/front.jpg,ankara-tote/side.jpg}`. The first one is the main photo. |
| `category` | One of `home`, `beauty`, `food`, `tech`, `fashion`, `experiences`, `kids`, `office`. |
| `for_whom` | Any of `anyone`, `her`, `him`, `kids`, `colleague`, `couple`, e.g. `{her,anyone}`. A gift marked `anyone` also shows when someone filters for her, him, a colleague or a couple (but not kids). |
| `delivery_areas` | Where you deliver it, e.g. `{lagos}` or `{lagos,abuja}`. |
| `lead_time_days` | Days from order to delivery, e.g. `2`. |
| `in_stock` | Turn off when it's sold out. The order button is disabled and shows "Out of stock". |
| `active` | Turn on to show it on the site. Leave off while you're still setting it up. |
| `sort` | Lower numbers show first, e.g. `10`, `20`, `30`. Equal numbers are ordered by price. |

Leave `id` and `created_at` empty; they fill themselves in.

## 3. Check it

Open `/gifts` on the site after up to 10 minutes and find the product. Open its page and tap **Order on WhatsApp** to check the message.

## Vendors

Every gift belongs to a vendor, and the order button opens **that vendor's** WhatsApp with the gift, its price and a ref (`CDR-XXXXXX`) typed in. Add the vendor first, in the Supabase dashboard (Table editor → `vendors`):

| Column | What to enter |
| --- | --- |
| `slug`, `name` | e.g. `ada-candles`, `Ada's Candles` |
| `whatsapp` | international format, digits only: `2348012345678` (no `+`, no spaces, no `0` after `234`) |
| `delivery_areas` | e.g. `{Lagos Mainland,Lekki}` |
| `delivery_time` | e.g. `2–4 days` |
| `refund_line` | the vendor's own refund policy, one sentence |
| `verified_at` | leave empty until you've checked the vendor; the "Checked by" badge shows only once it's set |

Then set each product's `vendor_id` to the vendor's `id`. Switching a vendor's `active` off hides all their gifts.

Each click on the order button adds a row to `gift_clicks` (ref, product, vendor, time; nothing about the buyer). Count a vendor's orders with:

```sql
select v.name, count(*) from gift_clicks c join vendors v on v.id = c.vendor_id group by v.name;
```

## Removing the sample products

The seed file `supabase/seed/gift_products.sql` adds six products named `[Sample] …`, with Unsplash placeholder photos. They are inactive and never show on the live site. Delete them before launch:

```sql
delete from gift_products where name like '[Sample]%';
```

## Also needed before launch

- At least one real, active vendor (see above). Delete the sample vendors with the sample products: `delete from vendors where name like '[Sample]%';`
- `SUPABASE_SERVICE_ROLE_KEY`: the order button records refs in `gift_clicks`, which only the server can write.
- `SUPABASE_ANON_KEY`: the project's anon (public) key, so the site reads the catalogue under the "active products only" rule.
- `/gifts/policy` (the buying policy) is written from the copy deck: who sells, payment, delivery, refunds, report a vendor. Edit it in `lib/copy/gifts.ts`.
