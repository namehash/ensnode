export const buildWithEnsSidebarTopic = {
  label: "Build with ENS",
  link: "/docs/build-with-ens",
  icon: "rocket",
  items: [
    {
      label: "Quickstart",
      link: "/docs/build-with-ens",
    },
    {
      label: "Why ENSNode?",
      link: "/docs/build-with-ens/why-ensnode",
    },
    {
      label: "ENSv2 Readiness",
      link: "/docs/build-with-ens/ensv2-readiness",
    },
    {
      label: "ENS Omnigraph API",
      collapsed: false,
      badge: {
        text: "NEW",
        variant: "tip",
      },
      items: [
        {
          label: "Overview",
          link: "/docs/build-with-ens/omnigraph",
        },
        {
          label: "Cookbook",
          link: "/docs/build-with-ens/omnigraph/cookbook",
        },
        {
          label: "Schema Reference",
          link: "/docs/build-with-ens/omnigraph/schema-reference",
        },
      ],
    },
    {
      label: "Integrations",
      collapsed: false,
      items: [
        {
          label: "Overview",
          link: "/docs/build-with-ens/integrations",
        },
        {
          label: "enskit (React)",
          link: "/docs/build-with-ens/integrations/enskit",
        },
        {
          label: "enssdk (TypeScript)",
          link: "/docs/build-with-ens/integrations/enssdk",
        },
        {
          label: "Raw GraphQL",
          link: "/docs/build-with-ens/integrations/raw-graphql",
        },
        {
          label: "ENSDb (PostgreSQL)",
          link: "/docs/build-with-ens/integrations/ensdb",
        },
      ],
    },
    {
      label: "Migrate from ENS Subgraph",
      link: "/docs/build-with-ens/migrate-from-subgraph",
    },
    {
      label: "Hosted Instances",
      link: "/docs/build-with-ens/hosted-instances",
    },
    {
      label: "AI / LLM Tooling",
      link: "/docs/build-with-ens/ai-llm",
    },
  ],
};
