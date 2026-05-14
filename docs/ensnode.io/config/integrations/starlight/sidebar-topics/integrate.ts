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
              label: "Find Domains",
              link: "/docs/integrate/omnigraph/cookbook/find-domains",
            },
            {
              label: "Domain Subdomains",
              link: "/docs/integrate/omnigraph/cookbook/domain-subdomains",
            },
            {
              label: "Domain Events",
              link: "/docs/integrate/omnigraph/cookbook/domain-events",
            },
            {
              label: "Account Domains",
              link: "/docs/integrate/omnigraph/cookbook/domains-by-address",
            },
            {
              label: "Account Events",
              link: "/docs/integrate/omnigraph/cookbook/account-events",
            },
            {
              label: "Registry Domains",
              link: "/docs/integrate/omnigraph/cookbook/registry-domains",
            },
            {
              label: "Permissions By Contract",
              link: "/docs/integrate/omnigraph/cookbook/permissions-by-contract",
            },
            {
              label: "Permissions By User",
              link: "/docs/integrate/omnigraph/cookbook/permissions-by-user",
            },
            {
              label: "Account Resolver Permissions",
              link: "/docs/integrate/omnigraph/cookbook/account-resolver-permissions",
            },
            {
              label: "Domain Resolver",
              link: "/docs/integrate/omnigraph/cookbook/domain-resolver",
            },
            {
              label: "Namegraph",
              link: "/docs/integrate/omnigraph/cookbook/namegraph",
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
          label: "ENS Omnigraph (GraphQL)",
          link: "/docs/integrate/integration-options/omnigraph-graphql-api",
        },
        {
          label: "ENSDb (PostgreSQL)",
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
