import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "sankoudesign.com" },
      { protocol: "https", hostname: "muuuuu.org" },
      { protocol: "https", hostname: "81-web.com" },
      { protocol: "https", hostname: "placehold.co" },
      { protocol: "https", hostname: "webdesignclip.com" },
      { protocol: "https", hostname: "world.webdesignclip.com" },
      { protocol: "https", hostname: "lp.webdesignclip.com" },
      { protocol: "https", hostname: "sp.webdesignclip.com" },
      { protocol: "https", hostname: "image.thum.io" },
    ],
  },
};

export default nextConfig;
