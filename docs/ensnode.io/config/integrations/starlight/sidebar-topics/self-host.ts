export const selfHostSidebarTopic = {
  label: "Self-host ENSNode",
  link: "/docs/self-host",
  icon: "seti:docker",
  items: [
    {
      label: "Getting started",
      link: "/docs/self-host",
    },
    {
      label: "Operations",
      items: [
        {
          label: "Overview",
          link: "/docs/self-host/operations",
        },
        {
          label: "Key workloads",
          link: "/docs/self-host/operations/key-workloads",
        },
        {
          label: "Scalability",
          link: "/docs/self-host/operations/scalability",
        },
        {
          label: "Monitoring",
          link: "/docs/self-host/operations/monitoring",
        },
        {
          label: "Troubleshooting",
          link: "/docs/self-host/operations/troubleshooting",
        },
      ],
    },
    {
      label: "Deployment options",
      items: [
        {
          label: "Overview",
          link: "/docs/self-host/deployment-options",
        },
        {
          label: "Docker",
          link: "/docs/self-host/deployment-options/docker",
        },
        {
          label: "Railway",
          link: "/docs/self-host/deployment-options/railway",
        },
        {
          label: "Terraform",
          link: "/docs/self-host/deployment-options/terraform",
        },
      ],
    },
  ],
};
