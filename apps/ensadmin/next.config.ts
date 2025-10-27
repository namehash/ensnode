import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  // Enable source maps in production
  productionBrowserSourceMaps: true,
};

export default nextConfig;
