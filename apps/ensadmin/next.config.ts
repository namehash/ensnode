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
  // Enable source maps in production
  productionBrowserSourceMaps: true,
  async redirects() {
    return [
      // redirect the homepage to /connection
      {
        source: "/",
        destination: "/connection",
        permanent: false,
      },
      {
        // Provide backward compatibility for ENSNode services.
        // The older ones would redirect their homepage to ENSAdmin `/about`
        // which was discontinued in the application router.
        source: "/about",
        destination: "/",
        permanent: true,
      },
      {
        source: "/gql/subgraph-compat",
        destination: "/api/subgraph",
        permanent: true,
      },
      {
        source: "/gql/ponder",
        destination: "/",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
