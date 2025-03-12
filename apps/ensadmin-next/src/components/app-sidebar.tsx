"use client";

import * as React from "react";
import { Activity, DatabaseIcon } from "lucide-react";

import { NavMain } from "@/components/nav-main";

import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";
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
    icon: DatabaseIcon,
    isActive: true,
    items: [
      {
        title: "GraphQL",
        url: "/gql/ponder",
      },
      {
        title: "Subgraph",
        url: "/gql/subgraph-compat",
      },
      {
        title: "Ponder",
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
