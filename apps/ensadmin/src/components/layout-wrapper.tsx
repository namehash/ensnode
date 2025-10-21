"use client";

import { usePathname } from "next/navigation";
import { Suspense } from "react";

import { AppSidebar } from "@/components/app-sidebar";
import { RequireActiveConnection } from "@/components/connections/require-active-connection";
import { RequireSelectedConnection } from "@/components/connections/require-selected-connection";
import { Header, HeaderActions, HeaderBreadcrumbs, HeaderNav } from "@/components/header";
import { SelectedENSNodeProvider } from "@/components/providers/selected-ensnode-provider";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

export function LayoutWrapper({
  children,
  breadcrumbs,
  actions,
}: {
  children: React.ReactNode;
  breadcrumbs: React.ReactNode;
  actions: React.ReactNode;
}) {
  const pathname = usePathname();

  if (pathname === "/") {
    return children;
  }

  return (
    <RequireSelectedConnection>
      <SidebarProvider>
        <Suspense>
          <AppSidebar />
        </Suspense>
        <SidebarInset className="min-w-0">
          <SelectedENSNodeProvider>
            <Header>
              <HeaderNav>
                <HeaderBreadcrumbs>{breadcrumbs}</HeaderBreadcrumbs>
              </HeaderNav>
              <HeaderActions>{actions}</HeaderActions>
            </Header>
            <RequireActiveConnection>{children}</RequireActiveConnection>
          </SelectedENSNodeProvider>
        </SidebarInset>
      </SidebarProvider>
    </RequireSelectedConnection>
  );
}
