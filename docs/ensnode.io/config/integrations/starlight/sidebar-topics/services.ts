export const servicesSidebarTopic = {
  label: "ENSNode services",
  link: "/docs/services",
  icon: "codePen",
  items: [
    { label: "Overview", link: "/docs/services" },
    {
      label: "ENSApi",
      collapsed: true,
      items: [
        { label: "Overview", link: "/docs/services/ensapi" },
        { label: "Configuration", link: "/docs/services/ensapi/usage/configuration" },
        { label: "API Reference", link: "/docs/services/ensapi/reference/api-reference" },
        { label: "Contributing", link: "/docs/services/ensapi/contributing" },
      ],
    },
    {
      label: "ENSAnalytics",
      collapsed: true,
      items: [{ label: "Overview", link: "/docs/services/ensanalytics" }],
    },
    {
      label: "ENSIndexer",
      collapsed: true,
      items: [
        { label: "Overview", link: "/docs/services/ensindexer" },
        { label: "Startup Sequence", link: "/docs/services/ensindexer/concepts/startup-sequence" },
        {
          label: "Usage",
          collapsed: true,
          items: [
            { label: "Configuration", link: "/docs/services/ensindexer/usage/configuration" },
            { label: "Management", link: "/docs/services/ensindexer/usage/management" },
          ],
        },
        {
          label: "Contributing",
          collapsed: true,
          items: [
            { label: "Overview", link: "/docs/services/ensindexer/contributing" },
            {
              label: "Creating a Plugin",
              link: "/docs/services/ensindexer/contributing/creating-a-plugin",
            },
          ],
        },
      ],
    },
    {
      label: "ENSDb",
      collapsed: true,
      items: [
        { label: "Overview", link: "/docs/services/ensdb" },
        {
          label: "Concepts",
          collapsed: true,
          items: [
            { label: "Overview", link: "/docs/services/ensdb/concepts" },
            { label: "Glossary", link: "/docs/services/ensdb/concepts/glossary" },
            { label: "Database Schemas", link: "/docs/services/ensdb/concepts/database-schemas" },
          ],
        },
        {
          label: "Usage",
          collapsed: true,
          items: [
            { label: "Overview", link: "/docs/services/ensdb/usage" },
            { label: "ENSDb SDK", link: "/docs/services/ensdb/usage/sdk" },
            { label: "ENSDb SQL", link: "/docs/services/ensdb/usage/sql" },
          ],
        },
        {
          label: "Integrations",
          collapsed: true,
          items: [
            {
              label: "ENSNode Reference Implementation",
              link: "/docs/services/ensdb/integrations/ensnode",
            },
            {
              label: "Future Possibilities",
              link: "/docs/services/ensdb/integrations/future-possibilities",
            },
          ],
        },
      ],
    },
    {
      label: "ENSRainbow",
      collapsed: true,
      items: [
        { label: "Overview", link: "/docs/services/ensrainbow" },
        { label: "FAQ", link: "/docs/services/ensrainbow/faq" },
        {
          label: "Concepts",
          collapsed: true,
          items: [
            { label: "Overview", link: "/docs/services/ensrainbow/concepts" },
            { label: "Glossary", link: "/docs/services/ensrainbow/concepts/glossary" },
            { label: "Unknown Labels", link: "/docs/services/ensrainbow/concepts/unknown-labels" },
            { label: "Architecture", link: "/docs/services/ensrainbow/concepts/architecture" },
            { label: "Data Model", link: "/docs/services/ensrainbow/concepts/data-model" },
            {
              label: "Label Sets & Versioning",
              link: "/docs/services/ensrainbow/concepts/label-sets-and-versioning",
            },
            { label: "Creating Files", link: "/docs/services/ensrainbow/concepts/creating-files" },
            {
              label: "TypeScript Interfaces",
              link: "/docs/services/ensrainbow/concepts/typescript-interfaces",
            },
            { label: "Performance", link: "/docs/services/ensrainbow/concepts/performance" },
            {
              label: "Technical Versioning",
              link: "/docs/services/ensrainbow/concepts/versioning",
            },
          ],
        },
        {
          label: "Usage",
          collapsed: true,
          items: [
            { label: "Overview", link: "/docs/services/ensrainbow/usage" },
            { label: "API", link: "/docs/services/ensrainbow/usage/api" },
            { label: "Client SDK", link: "/docs/services/ensrainbow/usage/client-sdk" },
            {
              label: "Available Label Sets",
              link: "/docs/services/ensrainbow/usage/available-label-sets",
            },
            { label: "Configuration", link: "/docs/services/ensrainbow/usage/configuration" },
            {
              label: "Hosted Instances",
              link: "/docs/services/ensrainbow/usage/hosted-ensrainbow-instances",
            },
            { label: "Troubleshooting", link: "/docs/services/ensrainbow/usage/troubleshooting" },
          ],
        },
        {
          label: "Deploying",
          collapsed: true,
          items: [
            { label: "Overview", link: "/docs/services/ensrainbow/deploying" },
            { label: "Railway", link: "/docs/services/ensrainbow/deploying/railway" },
            { label: "Docker", link: "/docs/services/ensrainbow/deploying/docker" },
          ],
        },
        {
          label: "Contributing",
          collapsed: true,
          items: [
            { label: "Overview", link: "/docs/services/ensrainbow/contributing" },
            {
              label: "Local Development",
              link: "/docs/services/ensrainbow/contributing/local-development",
            },
            {
              label: "Building Docker Images",
              link: "/docs/services/ensrainbow/contributing/building",
            },
            {
              label: "CLI Reference",
              link: "/docs/services/ensrainbow/contributing/cli-reference",
            },
            {
              label: "Service Management",
              link: "/docs/services/ensrainbow/contributing/service-management",
            },
            {
              label: "System Requirements",
              link: "/docs/services/ensrainbow/contributing/system-requirements",
            },
          ],
        },
      ],
    },
    {
      label: "ENSAdmin",
      collapsed: true,
      items: [
        { label: "Overview", link: "/docs/services/ensadmin" },
        {
          label: "Contributing",
          collapsed: true,
          items: [
            { label: "Overview", link: "/docs/services/ensadmin/contributing" },
            {
              label: "Using Docker",
              link: "/docs/services/ensadmin/contributing/docker",
            },
          ],
        },
      ],
    },
    {
      label: "ENSEngine",
      collapsed: true,
      items: [{ label: "Overview", link: "/docs/services/ensengine" }],
    },
  ],
};
