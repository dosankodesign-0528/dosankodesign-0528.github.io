import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  basePath: '/travel-shiori',
  output: 'export',
  images: { unoptimized: true },
};

export default nextConfig;
