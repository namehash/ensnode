/** Title Case group labels; single-page folders are links, not nested groups. */

export const componentsSidebarItems = [
  { label: "Overview", link: "/docs/components" },
  {
    label: "ENSApi",
    collapsed: true,
    items: [
      { label: "Overview", link: "/docs/components/ensapi" },
      { label: "Configuration", link: "/docs/components/ensapi/usage/configuration" },
      { label: "API Reference", link: "/docs/components/ensapi/reference/api-reference" },
      { label: "Contributing", link: "/docs/components/ensapi/contributing" },
    ],
  },
  {
    label: "ENSIndexer",
    collapsed: true,
    items: [
      { label: "Overview", link: "/docs/components/ensindexer" },
      { label: "Startup Sequence", link: "/docs/components/ensindexer/concepts/startup-sequence" },
      {
        label: "Usage",
        collapsed: true,
        items: [
          { label: "Configuration", link: "/docs/components/ensindexer/usage/configuration" },
          { label: "Management", link: "/docs/components/ensindexer/usage/management" },
        ],
      },
      {
        label: "Contributing",
        collapsed: true,
        items: [
          { label: "Overview", link: "/docs/components/ensindexer/contributing" },
          {
            label: "Creating a Plugin",
            link: "/docs/components/ensindexer/contributing/creating-a-plugin",
          },
        ],
      },
    ],
  },
  {
    label: "ENSDb",
    collapsed: true,
    items: [
      { label: "Overview", link: "/docs/components/ensdb" },
      {
        label: "Concepts",
        collapsed: true,
        items: [
          { label: "Overview", link: "/docs/components/ensdb/concepts" },
          { label: "Glossary", link: "/docs/components/ensdb/concepts/glossary" },
          { label: "Database Schemas", link: "/docs/components/ensdb/concepts/database-schemas" },
        ],
      },
      {
        label: "Usage",
        collapsed: true,
        items: [
          { label: "Overview", link: "/docs/components/ensdb/usage" },
          { label: "ENSDb SDK", link: "/docs/components/ensdb/usage/sdk" },
          { label: "ENSDb SQL", link: "/docs/components/ensdb/usage/sql" },
        ],
      },
      {
        label: "Integrations",
        collapsed: true,
        items: [
          {
            label: "ENSNode Reference Implementation",
            link: "/docs/components/ensdb/integrations/ensnode",
          },
          {
            label: "Future Possibilities",
            link: "/docs/components/ensdb/integrations/future-possibilities",
          },
        ],
      },
    ],
  },
  {
    label: "ENSRainbow",
    collapsed: true,
    items: [
      { label: "Overview", link: "/docs/components/ensrainbow" },
      { label: "FAQ", link: "/docs/components/ensrainbow/faq" },
      {
        label: "Concepts",
        collapsed: true,
        items: [
          { label: "Overview", link: "/docs/components/ensrainbow/concepts" },
          { label: "Glossary", link: "/docs/components/ensrainbow/concepts/glossary" },
          { label: "Unknown Labels", link: "/docs/components/ensrainbow/concepts/unknown-labels" },
          { label: "Architecture", link: "/docs/components/ensrainbow/concepts/architecture" },
          { label: "Data Model", link: "/docs/components/ensrainbow/concepts/data-model" },
          {
            label: "Label Sets & Versioning",
            link: "/docs/components/ensrainbow/concepts/label-sets-and-versioning",
          },
          { label: "Creating Files", link: "/docs/components/ensrainbow/concepts/creating-files" },
          {
            label: "TypeScript Interfaces",
            link: "/docs/components/ensrainbow/concepts/typescript-interfaces",
          },
          { label: "Performance", link: "/docs/components/ensrainbow/concepts/performance" },
          {
            label: "Technical Versioning",
            link: "/docs/components/ensrainbow/concepts/versioning",
          },
        ],
      },
      {
        label: "Usage",
        collapsed: true,
        items: [
          { label: "Overview", link: "/docs/components/ensrainbow/usage" },
          { label: "API", link: "/docs/components/ensrainbow/usage/api" },
          { label: "Client SDK", link: "/docs/components/ensrainbow/usage/client-sdk" },
          {
            label: "Available Label Sets",
            link: "/docs/components/ensrainbow/usage/available-label-sets",
          },
          { label: "Configuration", link: "/docs/components/ensrainbow/usage/configuration" },
          {
            label: "Hosted Instances",
            link: "/docs/components/ensrainbow/usage/hosted-ensrainbow-instances",
          },
          { label: "Troubleshooting", link: "/docs/components/ensrainbow/usage/troubleshooting" },
        ],
      },
      {
        label: "Deploying",
        collapsed: true,
        items: [
          { label: "Overview", link: "/docs/components/ensrainbow/deploying" },
          { label: "Railway", link: "/docs/components/ensrainbow/deploying/railway" },
          { label: "Docker", link: "/docs/components/ensrainbow/deploying/docker" },
        ],
      },
      {
        label: "Contributing",
        collapsed: true,
        items: [
          { label: "Overview", link: "/docs/components/ensrainbow/contributing" },
          {
            label: "Local Development",
            link: "/docs/components/ensrainbow/contributing/local-development",
          },
          {
            label: "Building Docker Images",
            link: "/docs/components/ensrainbow/contributing/building",
          },
          {
            label: "CLI Reference",
            link: "/docs/components/ensrainbow/contributing/cli-reference",
          },
          {
            label: "Service Management",
            link: "/docs/components/ensrainbow/contributing/service-management",
          },
          {
            label: "System Requirements",
            link: "/docs/components/ensrainbow/contributing/system-requirements",
          },
        ],
      },
    ],
  },
  {
    label: "ENSAdmin",
    collapsed: true,
    items: [
      { label: "Overview", link: "/docs/components/ensadmin" },
      { label: "What is ENSAdmin?", link: "/docs/components/ensadmin/overview/what-is-ensadmin" },
      { label: "Contributing", link: "/docs/components/ensadmin/contributing" },
    ],
  },
];

export const componentsSidebarTopic = {
  label: "ENSNode components",
  link: "/docs/components",
  icon: "puzzle",
  items: componentsSidebarItems,
};
