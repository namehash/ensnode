import { OMNIGRAPH_EXAMPLES_SIDEBAR_ITEMS } from "../../../../src/data/omnigraph-examples/config.ts";

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
          items: OMNIGRAPH_EXAMPLES_SIDEBAR_ITEMS,
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
          label: "enscli (CLI)",
          link: "/docs/integrate/integration-options/enscli",
        },
        {
          label: "ensskills (AI agents)",
          link: "/docs/integrate/integration-options/ensskills",
        },
        {
          label: "ensdb-cli (ENSDb Snapshots)",
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
