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
          label: "Examples",
          collapsed: false,
          items: [
            {
              label: "Overview",
              link: "/docs/integrate/omnigraph/examples",
            },
            {
              label: "Domain By Name",
              link: "/docs/integrate/omnigraph/examples/domain-by-name",
            },
            {
              label: "Find Domains",
              link: "/docs/integrate/omnigraph/examples/find-domains",
            },
            {
              label: "Domain Subdomains",
              link: "/docs/integrate/omnigraph/examples/domain-subdomains",
            },
            {
              label: "Domain Events",
              link: "/docs/integrate/omnigraph/examples/domain-events",
            },
            {
              label: "Account Domains",
              link: "/docs/integrate/omnigraph/examples/domains-by-address",
            },
            {
              label: "Account Events",
              link: "/docs/integrate/omnigraph/examples/account-events",
            },
            {
              label: "Registry Domains",
              link: "/docs/integrate/omnigraph/examples/registry-domains",
            },
            {
              label: "Permissions By Contract",
              link: "/docs/integrate/omnigraph/examples/permissions-by-contract",
            },
            {
              label: "Permissions By User",
              link: "/docs/integrate/omnigraph/examples/permissions-by-user",
            },
            {
              label: "Account Resolver Permissions",
              link: "/docs/integrate/omnigraph/examples/account-resolver-permissions",
            },
            {
              label: "Domain Resolver",
              link: "/docs/integrate/omnigraph/examples/domain-resolver",
            },
            {
              label: "Namegraph",
              link: "/docs/integrate/omnigraph/examples/namegraph",
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
          collapsed: false,
          items: [
            {
              label: "Overview",
              link: "/docs/integrate/integration-options/enskit",
            },
            {
              label: "⚡ Interactive example",
              link: "/docs/integrate/integration-options/enskit/example",
            },
          ],
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
              label: "⚡ Interactive example",
              link: "/docs/integrate/integration-options/enssdk/example",
            },
          ],
        },
        {
          label: "ENS Omnigraph (GraphQL)",
          link: "/docs/integrate/integration-options/omnigraph-graphql-api",
        },
        {
          label: "ENSDb Integration Quickstart",
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
