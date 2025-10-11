import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Static export for client-side SPA
  // Works with both Docker (served via nginx) and Vercel
  output: "export",
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Enable source maps in production
  productionBrowserSourceMaps: true,
};

export default nextConfig;
