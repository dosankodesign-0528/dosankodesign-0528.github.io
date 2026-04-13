import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "sankoudesign.com" },
      { protocol: "https", hostname: "muuuuu.org" },
      { protocol: "https", hostname: "81-web.com" },
      { protocol: "https", hostname: "www.awwwards.com" },
      { protocol: "https", hostname: "placehold.co" },
    ],
  },
};

export default nextConfig;
