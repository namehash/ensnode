"use client";

import { ChevronRight, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";

export function NavMain({
  items,
}: {
  items: {
    title: string;
    url: string;
    icon?: LucideIcon;
    isActive?: boolean;
    items?: {
      title: string;
      url: string;
    }[];
  }[];
}) {
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const appendQueryParams = (url: string) => {
    if (pathname.startsWith("/inspector") && !url.startsWith("/inspector")) {
      const params = new URLSearchParams(searchParams.toString());
      params.delete("strategy");
      params.delete("name");

      if (params.toString()) {
        const separator = url.includes("?") ? "&" : "?";
        return `${url}${separator}${params.toString()}`;
      }

      return url;
    }

    if (searchParams && searchParams.toString()) {
      const separator = url.includes("?") ? "&" : "?";
      return `${url}${separator}${searchParams.toString()}`;
    }

    return url;
  };

  const isActive = (url: string): boolean => {
    const urlPathname = url.split("?")[0];

    return pathname === urlPathname;
  };

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Index</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => {
          const hasItems = item.items && item.items.length > 0;
          const itemUrl = appendQueryParams(item.url);
          const isItemActive = isActive(item.url);

          if (!hasItems)
            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton asChild tooltip={item.title} isActive={isItemActive}>
                  <Link href={itemUrl}>
                    {item.icon && <item.icon />}
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );

          const anySubItemActive =
            item.items?.some((subItem) => isActive(subItem.url)) || isItemActive;

          return (
            <Collapsible
              key={item.title}
              asChild
              defaultOpen={anySubItemActive || item.isActive}
              className="group/collapsible"
            >
              <SidebarMenuItem>
                <CollapsibleTrigger asChild>
                  <SidebarMenuButton tooltip={item.title} isActive={isItemActive}>
                    {item.icon && <item.icon />}
                    <span>{item.title}</span>
                    <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                  </SidebarMenuButton>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarMenuSub>
                    {item.items?.map((subItem) => {
                      const subItemUrl = appendQueryParams(subItem.url);
                      const isSubItemActive = isActive(subItem.url);

                      return (
                        <SidebarMenuSubItem key={subItem.title}>
                          <SidebarMenuSubButton asChild isActive={isSubItemActive}>
                            <Link href={subItemUrl}>
                              <span>{subItem.title}</span>
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      );
                    })}
                  </SidebarMenuSub>
                </CollapsibleContent>
              </SidebarMenuItem>
            </Collapsible>
          );
        })}
      </SidebarMenu>
    </SidebarGroup>
  );
}
