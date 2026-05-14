export const integrateSidebarTopic = {
  label: "Integrate with ENSv2",
  link: "/docs/integrate",
  icon: "rocket",
  items: [
    {
      label: "Quickstart",
      link: "/docs/integrate",
    },
    {
      label: "Why ENSNode?",
      link: "/docs/integrate/why-ensnode",
    },
    {
      label: "ENSv2 Readiness",
      link: "/docs/integrate/ensv2-readiness",
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
          link: "/docs/integrate/omnigraph",
        },
        {
          label: "Cookbook",
          link: "/docs/integrate/omnigraph/cookbook",
        },
        {
          label: "Schema Reference",
          link: "/docs/integrate/omnigraph/schema-reference",
        },
      ],
    },
    {
      label: "Integration Options",
      collapsed: false,
      items: [
        {
          label: "Overview",
          link: "/docs/integrate/integration-options",
        },
        {
          label: "enskit (React)",
          link: "/docs/integrate/integration-options/enskit",
        },
        {
          label: "enssdk (TypeScript)",
          link: "/docs/integrate/integration-options/enssdk",
        },
        {
          label: "ENS Omnigraph (GraphQL)",
          link: "/docs/integrate/integration-options/omnigraph-graphql-api",
        },
        {
          label: "ENSDb integration quickstart",
          link: "/docs/integrate/integration-options/ensdb",
        },
        {
          label: "enscli (CLI)",
          link: "/docs/integrate/integration-options/enscli",
        },
        {
          label: "ensskills (AI agents)",
          link: "/docs/integrate/integration-options/ensskills",
        },
        {
          label: "ensdb-cli (Snapshots)",
          link: "/docs/integrate/integration-options/ensdb-cli",
        },
        {
          label: "ENSEngine (webhooks)",
          link: "/docs/integrate/integration-options/ensengine",
        },
      ],
    },
    {
      label: "Migrate from ENS Subgraph",
      link: "/docs/integrate/migrate-from-subgraph",
    },
    {
      label: "Hosted Instances",
      link: "/docs/integrate/hosted-instances",
    },
    {
      label: "AI / LLM Tooling",
      link: "/docs/integrate/ai-llm",
    },
  ],
};
