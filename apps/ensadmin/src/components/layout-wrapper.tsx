"use client";

import { usePathname } from "next/navigation";
import { Suspense } from "react";

import { AppSidebar } from "@/components/app-sidebar";
import { RequireActiveConnection } from "@/components/connections/require-active-connection";
import { RequireSelectedConnection } from "@/components/connections/require-selected-connection";
import { Header, HeaderActions, HeaderBreadcrumbs, HeaderNav } from "@/components/header";
import { SelectedENSNodeProvider } from "@/components/providers/selected-ensnode-provider";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";

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
    <Suspense
      fallback={
        <SidebarProvider>
          <div className="w-64 h-screen bg-muted animate-pulse" />
          <SidebarInset className="min-w-0">
            <Header>
              <HeaderNav>
                <Skeleton className="h-6 w-48" />
              </HeaderNav>
              <HeaderActions>
                <Skeleton className="h-8 w-32" />
              </HeaderActions>
            </Header>
            <div className="flex flex-col gap-4 p-6">
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-64 w-full" />
            </div>
          </SidebarInset>
        </SidebarProvider>
      }
    >
      <RequireSelectedConnection>
        <SidebarProvider>
          <Suspense>
            <AppSidebar />
          </Suspense>
          <SidebarInset className="min-w-0">
            <SelectedENSNodeProvider
              header={
                <Header>
                  <HeaderNav>
                    <HeaderBreadcrumbs>{breadcrumbs}</HeaderBreadcrumbs>
                  </HeaderNav>
                  <HeaderActions>{actions}</HeaderActions>
                </Header>
              }
            >
              <RequireActiveConnection>{children}</RequireActiveConnection>
            </SelectedENSNodeProvider>
          </SidebarInset>
        </SidebarProvider>
      </RequireSelectedConnection>
    </Suspense>
  );
}
