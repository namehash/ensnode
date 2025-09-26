"use client";

import { Activity, RadioTower, Telescope } from "lucide-react";
import * as React from "react";

import { IconENS } from "@/components/icons/ens";
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
    title: "ENS Explorer",
    url: "#",
    icon: Telescope,
    isActive: true,
    items: [
      {title: "Names", url: "/name"}
    ]
  },
  {
    title: "ENS Protocol Inspector",
    url: "#",
    icon: IconENS,
    isActive: true,
    items: [
      { title: "Record Resolution", url: "/inspect/records" },
      { title: "Primary Name Resolution", url: "/inspect/primary-name" },
      { title: "Primary Names Resolution", url: "/inspect/primary-names" },
    ],
  },
  {
    title: "APIs",
    url: "#",
    icon: RadioTower,
    isActive: true,
    items: [
      {
        title: "Subgraph (GraphQL)",
        url: "/api/subgraph",
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
