"use client";

import { Activity, RadioTower, Rss } from "lucide-react";
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
  {
    title: "Live Feeds",
    url: "#",
    icon: Rss,
    isActive: true,
    items: [
      {
        title: ".eth Registrations",
        url: "/live/eth",
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
