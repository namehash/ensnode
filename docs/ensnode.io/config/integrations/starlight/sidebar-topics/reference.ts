export const referenceSidebarTopic = {
  label: "Reference",
  link: "/docs/reference",
  icon: "open-book",
  items: [
    {
      label: "Overview",
      link: "/docs/reference",
    },
    {
      label: "Terminology",
      link: "/docs/reference/terminology",
    },
    {
      label: "Contributing",
      collapsed: false,
      items: [
        { label: "Overview", link: "/docs/reference/contributing" },
        { label: "Creating Pull Requests", link: "/docs/reference/contributing/prs" },
        {
          label: "Building the Docker Images",
          link: "/docs/reference/contributing/building",
        },
        { label: "Creating a Release", link: "/docs/reference/contributing/releases" },
        {
          label: "REST API Documentation",
          link: "/docs/reference/contributing/rest-api-docs",
        },
      ],
    },
  ],
};
