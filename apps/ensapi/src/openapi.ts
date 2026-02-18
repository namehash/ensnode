export const openapiDocumentation = {
  openapi: "3.1.0" as const,
  info: {
    title: "ENSApi APIs",
    version: "0.0.0", // replaced at runtime with package.json version
    description:
      "APIs for ENS resolution, navigating the ENS nameforest, and metadata about an ENSNode",
  },
  servers: [
    {
      url: "https://api.alpha.ensnode.io",
      description: "ENSNode Alpha (Mainnet)",
    },
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
    {
      name: "Explore",
      description:
        "APIs for exploring the indexed state of ENS, including name tokens and registrar actions",
    },
    {
      name: "ENSAwards",
      description: "APIs for ENSAwards functionality, including referrer data",
    },
  ],
};
