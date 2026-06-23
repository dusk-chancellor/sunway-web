import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    // The Go backend will serve pre-generated 200 / 600 / original sizes from /media/*.
    // Until then, images are local SVG/data placeholders served from /public.
    remotePatterns: [
      { protocol: "https", hostname: "**" },
    ],
  },
  // Uploaded images live on the Go backend under /uploads/*. Proxy them through
  // the web origin so <Image src="/uploads/..."> works in both dev and prod
  // without baking the backend host into stored URLs.
  async rewrites() {
    const api = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080/api/v1";
    const origin = api.replace(/\/api\/v1\/?$/, "");
    return [{ source: "/uploads/:path*", destination: `${origin}/uploads/:path*` }];
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
    ];
  },
};

export default withNextIntl(nextConfig);
