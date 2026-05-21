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
        variant: "success",
      },
      items: [
        {
          label: "Overview",
          link: "/docs/integrate/omnigraph",
        },
        {
          label: "Examples",
          collapsed: true,
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
      label: "ENS Unigraph SQL",
      collapsed: false,
      badge: {
        text: "NEW",
        variant: "success",
      },
      items: [
        {
          label: "Overview",
          link: "/docs/integrate/unigraph",
        },
        {
          label: "Examples",
          collapsed: true,
          items: [
            {
              label: "Overview",
              link: "/docs/integrate/unigraph/examples",
            },
            {
              label: "Domain by Name",
              link: "/docs/integrate/unigraph/examples/domain-by-name",
            },
            {
              label: "Account Domains",
              link: "/docs/integrate/unigraph/examples/account-domains",
            },
            {
              label: "Indexing Status",
              link: "/docs/integrate/unigraph/examples/indexing-status",
            },
          ],
        },
        {
          label: "Schema Reference",
          link: "/docs/integrate/unigraph/schema-reference",
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
          label: "enssdk (TypeScript)",
          collapsed: false,
          items: [
            {
              label: "Overview",
              link: "/docs/integrate/integration-options/enssdk",
            },
            {
              label: "Interactive example ⚡",
              link: "/docs/integrate/integration-options/enssdk/example",
            },
          ],
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
              label: "Interactive example ⚡",
              link: "/docs/integrate/integration-options/enskit/example",
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
      label: "ENS Subgraph",
      collapsed: true,
      badge: {
        text: "LEGACY",
        variant: "danger",
      },
      items: [
        {
          label: "Overview",
          link: "/docs/integrate/subgraph/what-is-the-ens-subgraph",
        },
        {
          label: "Subgraph API",
          link: "/docs/integrate/subgraph/subgraph-api",
        },
        {
          label: "Querying Best Practices",
          link: "/docs/integrate/subgraph/querying-best-practices",
        },
        {
          label: "Subgraph Compatibility Tooling",
          link: "/docs/integrate/subgraph/subgraph-compatibility-tooling",
        },
        {
          label: "With ENSjs",
          link: "/docs/integrate/subgraph/with-ensjs",
        },
        {
          label: "With Viem",
          link: "/docs/integrate/subgraph/with-viem",
        },
        {
          label: "Subgraph Dependents",
          link: "/docs/integrate/subgraph/subgraph-dependents",
        },
      ],
    },
    {
      label: "AI / LLM Tooling",
      link: "/docs/integrate/ai-llm",
    },
  ],
};
