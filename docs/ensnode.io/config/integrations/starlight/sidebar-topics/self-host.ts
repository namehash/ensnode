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
    {
      label: "Operations",
      items: [
        {
          label: "Overview",
          link: "/docs/self-host/operations/overview",
        },
        {
          label: "Critical workloads 🚨",
          link: "/docs/self-host/operations/critical-workloads",
        },
        {
          label: "Scalability",
          link: "/docs/self-host/operations/scalability",
        },
      ],
    },
  ],
};
