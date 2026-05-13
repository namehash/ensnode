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
          collapsed: true,
          items: [
            {
              label: "Overview",
              link: "/docs/integrate/omnigraph/cookbook",
            },
            {
              label: "Domain By Name",
              link: "/docs/integrate/omnigraph/cookbook/domain-by-name",
            },
            {
              label: "Account Domains",
              link: "/docs/integrate/omnigraph/cookbook/account-domains",
            },
          ],
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
          collapsed: false,
          items: [
            {
              label: "Overview",
              link: "/docs/integrate/integration-options/enssdk",
            },
            {
              label: "Cookbook",
              collapsed: true,
              items: [
                {
                  label: "Overview",
                  link: "/docs/integrate/integration-options/enssdk/cookbook",
                },
                {
                  label: "Resolution API",
                  link: "/docs/integrate/integration-options/enssdk/cookbook/resolution-api",
                },
              ],
            },
          ],
        },
        {
          label: "Raw GraphQL",
          link: "/docs/integrate/integration-options/raw-graphql",
        },
        {
          label: "ENSDb (PostgreSQL)",
          link: "/docs/integrate/integration-options/ensdb",
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
