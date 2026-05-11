export const referenceSidebarTopic = {
  label: "Reference",
  link: "/docs/reference",
  icon: "open-book",
  items: [
    {
      label: "Overview",
      link: "/docs/reference",
    },
    {
      label: "Terminology",
      link: "/docs/reference/terminology",
    },
    {
      label: "Roadmap",
      link: "/docs/reference/roadmap",
    },
    {
      label: "What is ENSNode?",
      link: "/docs/reference/what-is-ensnode",
    },
    {
      label: "What is the ENS Subgraph?",
      link: "/docs/reference/what-is-the-ens-subgraph",
    },
    {
      label: "REST API",
      link: "/docs/reference/rest-api",
    },
    {
      label: "Querying Best Practices",
      link: "/docs/reference/querying-best-practices",
    },
    {
      label: "ENSNode V2 Notes",
      link: "/docs/reference/ensnode-v2-notes",
    },
    {
      label: "Subgraph Compatibility",
      link: "/docs/reference/subgraph-compatibility-tooling",
    },
    {
      label: "Indexing ENS-Compatible Names",
      link: "/docs/reference/indexing-ens-compatible-onchain-names",
    },
    {
      label: "Mainnet Subnames of Subregistries",
      link: "/docs/reference/mainnet-registered-subnames-of-subregistries",
    },
    {
      label: "Subgraph API (Legacy)",
      collapsed: true,
      items: [
        {
          label: "With ENSjs",
          link: "/docs/reference/subgraph-legacy/with-ensjs",
        },
        {
          label: "With Viem",
          link: "/docs/reference/subgraph-legacy/with-viem",
        },
        {
          label: "Subgraph Dependents",
          link: "/docs/reference/subgraph-legacy/subgraph-dependents",
        },
      ],
    },
    {
      label: "Contributing",
      collapsed: true,
      items: [
        { label: "Overview", link: "/docs/reference/contributing" },
        { label: "Creating Pull Requests", link: "/docs/reference/contributing/prs" },
        {
          label: "Building the Docker Images",
          link: "/docs/reference/contributing/building",
        },
        { label: "Creating a Release", link: "/docs/reference/contributing/releases" },
        {
          label: "REST API Documentation",
          link: "/docs/reference/contributing/rest-api-docs",
        },
      ],
    },
  ],
};
