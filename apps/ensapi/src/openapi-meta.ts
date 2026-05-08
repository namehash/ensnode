import packageJson from "@/../package.json" with { type: "json" };

export const openapiMeta = {
  openapi: "3.1.0" as const,
  info: {
    title: "ENSApi APIs",
    version: packageJson.version,
    description: "REST APIs for the ENSNode stack as served by the ENSApi service",
  },
  servers: [
    { url: "https://api.alpha.ensnode.io", description: "ENSNode Alpha (Mainnet)" },
    {
      url: "https://api.alpha-sepolia.ensnode.io",
      description: "ENSNode Alpha (Sepolia Testnet)",
    },
  ],
  tags: [
    {
      name: "Resolution",
      description: "APIs for resolving ENS names and addresses",
    },
    {
      name: "Meta",
      description: "APIs for indexing status, configuration, and realtime monitoring",
    },
  ],
};
