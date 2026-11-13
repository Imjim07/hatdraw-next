import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  images: {
    // Gift Finder product photos, from the public gift-images bucket in Supabase Storage
    remotePatterns: [{ protocol: "https", hostname: "*.supabase.co", pathname: "/storage/v1/object/public/gift-images/**" }],
  },
};

export default nextConfig;
