import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Use Single Page App mode only for ENSAdmin
  output: "export",
  // Enable source maps in production
  productionBrowserSourceMaps: true,
};

export default nextConfig;
