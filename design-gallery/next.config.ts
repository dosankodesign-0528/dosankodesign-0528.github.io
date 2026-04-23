import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Vercel 本番（design-gallery.vercel.app 的なドメインでルート配信）に統一したので
  // basePath / output:export は不要。Vercel が Next.js をネイティブに動かす。
  images: { unoptimized: true },
};

export default nextConfig;
