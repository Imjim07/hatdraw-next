-- Six clearly fake products for building the Gift Finder UI. They are NOT for sale:
-- every one is named "[Sample] ...", uses Unsplash placeholder photos (not pictures
-- of anything sold), and is inserted with active = false so it never shows on the live site.
--
-- To see them on a LOCAL test database only:
--   update gift_products set active = true where name like '[Sample]%';
-- Never run that against production. Delete them before launch:
--   delete from gift_products where name like '[Sample]%';
--
-- lib/gifts/samples.ts mirrors these rows for the in-memory test store;
-- lib/gifts/seed.test.ts checks the two stay in step and that every row here is inactive.

insert into gift_products (slug, name, description, price_naira, images, category, for_whom, delivery_areas, lead_time_days, in_stock, active, sort) values
  ('sample-scented-candle', '[Sample] Scented candle', 'Sample product for building the store. Not for sale. A placeholder for a small home gift.', 8500, '{"https://images.unsplash.com/photo-1640095889747-2090ee12fa7d?auto=format&fit=crop&w=1200&q=80","https://images.unsplash.com/photo-1561212856-44e9bae482aa?auto=format&fit=crop&w=1200&q=80"}', 'home', '{anyone,her}', '{lagos}', 2, true, false, 10),
  ('sample-shea-butter-set', '[Sample] Shea butter gift set', 'Sample product for building the store. Not for sale. A placeholder for a beauty gift.', 14000, '{"https://images.unsplash.com/photo-1786359410261-ec7f89743af6?auto=format&fit=crop&w=1200&q=80"}', 'beauty', '{her,anyone}', '{lagos}', 3, true, false, 20),
  ('sample-adire-scarf', '[Sample] Adire scarf', 'Sample product for building the store. Not for sale. A placeholder for a fashion gift.', 18500, '{"https://images.unsplash.com/photo-1693382288218-2ce85aa26974?auto=format&fit=crop&w=1200&q=80","https://images.unsplash.com/photo-1771771425082-49c05a9ecf48?auto=format&fit=crop&w=1200&q=80","https://images.unsplash.com/photo-1773739687471-1b338689148f?auto=format&fit=crop&w=1200&q=80"}', 'fashion', '{her,anyone}', '{lagos}', 4, true, false, 30),
  ('sample-small-chops-box', '[Sample] Small chops party box', 'Sample product for building the store. Not for sale. A placeholder for a food gift to share.', 22000, '{"https://images.unsplash.com/photo-1751651054985-7dc01c37369c?auto=format&fit=crop&w=1200&q=80","https://images.unsplash.com/photo-1751651054936-db23f5d67160?auto=format&fit=crop&w=1200&q=80"}', 'food', '{colleague,anyone,couple}', '{lagos}', 1, true, false, 40),
  ('sample-wireless-earbuds', '[Sample] Wireless earbuds', 'Sample product for building the store. Not for sale. A placeholder for a tech gift, shown out of stock.', 38000, '{"https://images.unsplash.com/photo-1606220588913-b3aacb4d2f46?auto=format&fit=crop&w=1200&q=80"}', 'tech', '{him,anyone}', '{lagos}', 2, false, false, 50),
  ('sample-dinner-for-two', '[Sample] Dinner for two', 'Sample product for building the store. Not for sale. A placeholder for an experience gift.', 55000, '{"https://images.unsplash.com/photo-1639873179448-2e7eb329d3aa?auto=format&fit=crop&w=1200&q=80","https://images.unsplash.com/photo-1778694277039-5cbf0b9a1fcf?auto=format&fit=crop&w=1200&q=80"}', 'experiences', '{couple}', '{lagos}', 5, true, false, 60);
