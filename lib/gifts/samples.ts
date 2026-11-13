import type { GiftProduct } from "./types";

// The six placeholder products from supabase/seed/gift_products.sql, for the in-memory
// store that local development and the automated tests use (GIFTS_STORE=memory).
// Never shown in production: there the seed rows stay active = false.
const NOTE = "Sample product for building the store. Not for sale.";

// Placeholder photos from Unsplash (free to use under the Unsplash License), so the
// store can be seen with pictures. They show similar things, not the products sold.
// Photographers: Sixteen Miles Out and David Tomaseti (candle), Katya Azimova (shea),
// Simona Sergi, Shalom Ejiofor and Geoffrey Moffett (scarf), Volodymyr Leush (small
// chops), TheRegisti (earbuds), Adam Bartoszewicz and Romain Gal (dinner).
const U = (id: string) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=1200&q=80`;

export const SAMPLE_PRODUCTS: GiftProduct[] = [
  { slug: "sample-scented-candle", name: "[Sample] Scented candle", description: `${NOTE} A placeholder for a small home gift.`, price: 8500, images: [U("1640095889747-2090ee12fa7d"), U("1561212856-44e9bae482aa")], category: "home", forWhom: ["anyone", "her"], deliveryAreas: ["lagos"], leadTimeDays: 2, inStock: true },
  { slug: "sample-shea-butter-set", name: "[Sample] Shea butter gift set", description: `${NOTE} A placeholder for a beauty gift.`, price: 14000, images: [U("1786359410261-ec7f89743af6")], category: "beauty", forWhom: ["her", "anyone"], deliveryAreas: ["lagos"], leadTimeDays: 3, inStock: true },
  { slug: "sample-adire-scarf", name: "[Sample] Adire scarf", description: `${NOTE} A placeholder for a fashion gift.`, price: 18500, images: [U("1693382288218-2ce85aa26974"), U("1771771425082-49c05a9ecf48"), U("1773739687471-1b338689148f")], category: "fashion", forWhom: ["her", "anyone"], deliveryAreas: ["lagos"], leadTimeDays: 4, inStock: true },
  { slug: "sample-small-chops-box", name: "[Sample] Small chops party box", description: `${NOTE} A placeholder for a food gift to share.`, price: 22000, images: [U("1751651054985-7dc01c37369c"), U("1751651054936-db23f5d67160")], category: "food", forWhom: ["colleague", "anyone", "couple"], deliveryAreas: ["lagos"], leadTimeDays: 1, inStock: true },
  { slug: "sample-wireless-earbuds", name: "[Sample] Wireless earbuds", description: `${NOTE} A placeholder for a tech gift, shown out of stock.`, price: 38000, images: [U("1606220588913-b3aacb4d2f46")], category: "tech", forWhom: ["him", "anyone"], deliveryAreas: ["lagos"], leadTimeDays: 2, inStock: false },
  { slug: "sample-dinner-for-two", name: "[Sample] Dinner for two", description: `${NOTE} A placeholder for an experience gift.`, price: 55000, images: [U("1639873179448-2e7eb329d3aa"), U("1778694277039-5cbf0b9a1fcf")], category: "experiences", forWhom: ["couple"], deliveryAreas: ["lagos"], leadTimeDays: 5, inStock: true },
];
