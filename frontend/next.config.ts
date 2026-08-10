import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  experimental: {
    useTypeScriptCli: true,
  },
  images: {
    // Serve AVIF where supported (≈30–50% smaller than WebP), falling back to
    // WebP. Only affects next/image — which is why the CSS background images
    // across the app were migrated to next/image (see bundle-audit.md).
    formats: ["image/avif", "image/webp"],
    // Unsplash URLs are stable (content-addressed via query params), so
    // optimized responses can be cached for a year.
    minimumCacheTTL: 31536000,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "fonts.cdnfonts.com",
      },
    ],
  },
};

export default withNextIntl(nextConfig);
