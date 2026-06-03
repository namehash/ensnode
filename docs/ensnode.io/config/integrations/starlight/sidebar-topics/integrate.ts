export const integrateSidebarTopic = {
  id: "integrate-with-ensv2",
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
      collapsed: false,
      items: [
        {
          label: "Overview",
          link: "/docs/integrate/why-ensnode",
        },
        {
          label: "Keep ENS apps working 🚨",
          link: "/docs/integrate/why-ensnode/keep-ens-working",
        },
        {
          label: "ENSv2 Readiness",
          link: "/docs/integrate/why-ensnode/ensv2-readiness",
        },
      ],
    },
    {
      label: "AI/LLM Tooling 🤖",
      link: "/docs/integrate/ai-llm",
    },
    {
      label: "ENS Subgraph",
      collapsed: false,
      badge: {
        text: "LEGACY",
        variant: "danger",
      },
      items: [
        {
          label: "Overview",
          link: "/docs/integrate/ens-subgraph",
        },
        {
          label: "Key Limitations 🚨",
          link: "/docs/integrate/ens-subgraph/key-limitations",
        },
        {
          label: "Backwards Compatibility",
          link: "/docs/integrate/ens-subgraph/backwards-compatibility",
        },
        {
          label: "Examples",
          collapsed: true,
          items: [
            {
              label: "Overview",
              link: "/docs/integrate/ens-subgraph/examples",
            },
            {
              label: "With ENSjs",
              link: "/docs/integrate/ens-subgraph/examples/with-ensjs",
            },
            {
              label: "With Viem",
              link: "/docs/integrate/ens-subgraph/examples/with-viem",
            },
          ],
        },
        {
          label: "Schema Reference",
          link: "/docs/integrate/ens-subgraph/schema-reference",
        },
      ],
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
          label: "Core Concepts",
          link: "/docs/integrate/omnigraph/concepts",
        },
        {
          label: "Protocol Acceleration",
          link: "/docs/integrate/omnigraph/protocol-acceleration",
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
          link: "/docs/integrate/integration-options/enssdk",
        },
        {
          label: "enskit (React)",
          link: "/docs/integrate/integration-options/enskit",
        },
        {
          label: "ENS Omnigraph (GraphQL)",
          link: "/docs/integrate/integration-options/omnigraph-graphql-api",
        },
        {
          label: "ENSDb (SQL)",
          link: "/docs/integrate/integration-options/ensdb",
        },
        {
          label: "ENSDb Writers (Indexers)",
          link: "/docs/integrate/integration-options/ensdb-writers",
        },
        {
          label: "ENSDb Readers (Custom APIs)",
          link: "/docs/integrate/integration-options/ensdb-readers",
        },
        {
          label: "ENSNode Plugins (data models)",
          link: "/docs/integrate/integration-options/ensnode-plugins",
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
          label: "ENSEngine (Webhooks)",
          link: "/docs/integrate/integration-options/ensengine",
        },
      ],
    },
  ],
};
