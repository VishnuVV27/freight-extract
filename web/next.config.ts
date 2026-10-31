import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [{ source: "/api/:path*", destination: `${process.env.API_URL ?? "http://127.0.0.1:8010"}/:path*` }];
  },
};

export default nextConfig;
