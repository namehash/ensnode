import { TanStackDevtools } from "@tanstack/react-devtools";
import { createRootRoute, Outlet } from "@tanstack/react-router";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";
import { Suspense } from "react";

import { LayoutWrapper } from "@/components/layout-wrapper";
import { QueryClientProvider } from "@/components/query-client/components";
import { Toaster } from "@/components/ui/sonner";
import { ConnectionsLibraryProvider } from "@/hooks/use-connections-library";

export const Route = createRootRoute({
  component: RootLayout,
});

function RootLayout() {
  return (
    <>
      <QueryClientProvider>
        <Suspense>
          <ConnectionsLibraryProvider>
            <LayoutWrapper breadcrumbs={null} actions={null}>
              <Outlet />
            </LayoutWrapper>
          </ConnectionsLibraryProvider>
        </Suspense>
      </QueryClientProvider>
      <Toaster />
      <TanStackDevtools
        config={{
          position: "bottom-right",
        }}
        plugins={[
          {
            name: "Tanstack Router",
            render: <TanStackRouterDevtoolsPanel />,
          },
        ]}
      />
    </>
  );
}
