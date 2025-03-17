import type { NextConfig } from "next";

let output: NextConfig["output"];

if (process.env.NEXT_BUILD_OUTPUT_STANDALONE === "true") {
  output = "standalone";
}

const nextConfig: NextConfig = {
  // Docker builds require the standalone output
  // Vercel builds require the default (`undefined`) output
  output,
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
