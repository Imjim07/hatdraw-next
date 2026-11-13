-- Six clearly fake products for building the Gift Finder UI. They are NOT for sale:
-- every one is named "[Sample] ...", has no photos, and is inserted with
-- active = false so it never shows on the live site.
--
-- To see them on a LOCAL test database only:
--   update gift_products set active = true where name like '[Sample]%';
-- Never run that against production. Delete them before launch:
--   delete from gift_products where name like '[Sample]%';
--
-- lib/gifts/samples.ts mirrors these rows for the in-memory test store;
-- lib/gifts/seed.test.ts checks the two stay in step and that every row here is inactive.

insert into gift_products (slug, name, description, price_naira, category, for_whom, delivery_areas, lead_time_days, in_stock, active, sort) values
  ('sample-scented-candle', '[Sample] Scented candle', 'Sample product for building the store. Not for sale. A placeholder for a small home gift.', 8500, 'home', '{anyone,her}', '{lagos}', 2, true, false, 10),
  ('sample-shea-butter-set', '[Sample] Shea butter gift set', 'Sample product for building the store. Not for sale. A placeholder for a beauty gift.', 14000, 'beauty', '{her,anyone}', '{lagos}', 3, true, false, 20),
  ('sample-adire-scarf', '[Sample] Adire scarf', 'Sample product for building the store. Not for sale. A placeholder for a fashion gift.', 18500, 'fashion', '{her,anyone}', '{lagos}', 4, true, false, 30),
  ('sample-small-chops-box', '[Sample] Small chops party box', 'Sample product for building the store. Not for sale. A placeholder for a food gift to share.', 22000, 'food', '{colleague,anyone,couple}', '{lagos}', 1, true, false, 40),
  ('sample-wireless-earbuds', '[Sample] Wireless earbuds', 'Sample product for building the store. Not for sale. A placeholder for a tech gift, shown out of stock.', 38000, 'tech', '{him,anyone}', '{lagos}', 2, false, false, 50),
  ('sample-dinner-for-two', '[Sample] Dinner for two', 'Sample product for building the store. Not for sale. A placeholder for an experience gift.', 55000, 'experiences', '{couple}', '{lagos}', 5, true, false, 60);
