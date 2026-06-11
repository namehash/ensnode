export const selfHostSidebarTopic = {
  label: "Self-host ENSNode",
  link: "/docs/self-host",
  icon: "seti:docker",
  items: [
    {
      label: "Overview",
      link: "/docs/self-host",
    },
    {
      label: "Deployment options",
      items: [
        {
          label: "Docker",
          link: "/docs/self-host/docker",
        },
        {
          label: "Railway",
          link: "/docs/self-host/railway",
        },
        {
          label: "Terraform",
          link: "/docs/self-host/terraform",
        },
      ],
    },
    {
      label: "Scalability",
      link: "/docs/self-host/scalability",
    },
  ],
};
