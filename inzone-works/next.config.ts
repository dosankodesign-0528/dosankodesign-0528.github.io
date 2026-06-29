import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Vercel 本番ドメインでルート配信する想定。画像は public/ 直置きなので最適化は不要。
  images: { unoptimized: true },
};

export default nextConfig;
