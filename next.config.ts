import type { NextConfig } from "next";

/**
 * Same-origin `/api/site-search` → Edge `site-search`.
 * Works in `next dev`. Production uses Netlify `public/_redirects` proxy
 * (written by `scripts/generate-site-search-proxy.mjs`). Ignored by static export.
 */
function siteSearchDevRewrites() {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
  if (!base) return [];
  return [
    {
      source: "/api/site-search",
      destination: `${base}/functions/v1/site-search`,
    },
  ];
}

const nextConfig: NextConfig = {
  output: "export",
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "f4.bcbits.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "i.ytimg.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "api.livedownloads.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "i.postimg.cc",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "images.radio.co",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "*.discourse-cdn.com",
        pathname: "/**",
      },
    ],
  },
  async rewrites() {
    return siteSearchDevRewrites();
  },
};

export default nextConfig;
