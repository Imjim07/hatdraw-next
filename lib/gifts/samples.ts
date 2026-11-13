import type { GiftProduct } from "./types";

// The six placeholder products from supabase/seed/gift_products.sql, for the in-memory
// store that local development and the automated tests use (GIFTS_STORE=memory).
// Never shown in production: there the seed rows stay active = false.
const NOTE = "Sample product for building the store. Not for sale.";

export const SAMPLE_PRODUCTS: GiftProduct[] = [
  { slug: "sample-scented-candle", name: "[Sample] Scented candle", description: `${NOTE} A placeholder for a small home gift.`, price: 8500, images: [], category: "home", forWhom: ["anyone", "her"], deliveryAreas: ["lagos"], leadTimeDays: 2, inStock: true },
  { slug: "sample-shea-butter-set", name: "[Sample] Shea butter gift set", description: `${NOTE} A placeholder for a beauty gift.`, price: 14000, images: [], category: "beauty", forWhom: ["her", "anyone"], deliveryAreas: ["lagos"], leadTimeDays: 3, inStock: true },
  { slug: "sample-adire-scarf", name: "[Sample] Adire scarf", description: `${NOTE} A placeholder for a fashion gift.`, price: 18500, images: [], category: "fashion", forWhom: ["her", "anyone"], deliveryAreas: ["lagos"], leadTimeDays: 4, inStock: true },
  { slug: "sample-small-chops-box", name: "[Sample] Small chops party box", description: `${NOTE} A placeholder for a food gift to share.`, price: 22000, images: [], category: "food", forWhom: ["colleague", "anyone", "couple"], deliveryAreas: ["lagos"], leadTimeDays: 1, inStock: true },
  { slug: "sample-wireless-earbuds", name: "[Sample] Wireless earbuds", description: `${NOTE} A placeholder for a tech gift, shown out of stock.`, price: 38000, images: [], category: "tech", forWhom: ["him", "anyone"], deliveryAreas: ["lagos"], leadTimeDays: 2, inStock: false },
  { slug: "sample-dinner-for-two", name: "[Sample] Dinner for two", description: `${NOTE} A placeholder for an experience gift.`, price: 55000, images: [], category: "experiences", forWhom: ["couple"], deliveryAreas: ["lagos"], leadTimeDays: 5, inStock: true },
];
