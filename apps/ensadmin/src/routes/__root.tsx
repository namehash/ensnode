import { Outlet, createRootRoute } from "@tanstack/react-router";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";
import { TanStackDevtools } from "@tanstack/react-devtools";
import { Suspense } from "react";

import { QueryClientProvider } from "@/components/query-client/components";
import { ConnectionsLibraryProvider } from "@/hooks/use-connections-library";
import { LayoutWrapper } from "@/components/layout-wrapper";
import { Toaster } from "@/components/ui/sonner";

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
