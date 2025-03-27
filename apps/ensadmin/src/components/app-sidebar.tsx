"use client";

import { Activity, PackageSearch, RadioTower } from "lucide-react";
import * as React from "react";

import { NavMain } from "@/components/nav-main";

import { Sidebar, SidebarContent, SidebarHeader, SidebarRail } from "@/components/ui/sidebar";
import { ConnectionSelector } from "./connections/connection-selector";

const navItems = [
  {
    title: "Status",
    url: "/status",
    icon: Activity,
  },
  {
    title: "ENS Protocol Inspector",
    url: "/inspector",
    icon: PackageSearch,
  },
  {
    title: "APIs",
    url: "#",
    icon: RadioTower,
    isActive: true,
    items: [
      {
        title: "GraphQL (Ponder-style)",
        url: "/gql/ponder",
      },
      {
        title: "GraphQL (Subgraph-style)",
        url: "/gql/subgraph-compat",
      },
      {
        title: "Ponder Client",
        url: "/ponder-client-api",
      },
    ],
  },
];

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <ConnectionSelector />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navItems} />
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}
