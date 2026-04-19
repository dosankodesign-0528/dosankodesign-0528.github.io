import type { NextConfig } from "next";

// Vercel (tabinoshiori-swart.vercel.app) を本番とする SSR 設定。
// AI チャット API (src/app/api/ai/chat/route.ts) を動かすため static export はしない。
// GH Pages 側でも配信したい場合のみ NEXT_STATIC_EXPORT=1 を立ててビルドする。
const isStaticExport = process.env.NEXT_STATIC_EXPORT === '1';

const nextConfig: NextConfig = {
  ...(isStaticExport
    ? { basePath: '/travel-shiori', output: 'export' as const }
    : {}),
  images: { unoptimized: true },
};

export default nextConfig;
