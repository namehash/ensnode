import { type PropsWithChildren, Suspense } from "react";
import { Sidebar, SidebarProvider, SidebarToggle } from "./sidebar";
import { Toolbar } from "./toolbar";

export function PageShell({ children }: PropsWithChildren) {
  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <header className="bg-card border-b px-6 py-4">
        <h1 className="text-2xl font-semibold text-card-foreground">ENSAdmin</h1>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <SidebarProvider>
          {/* Sidebar Navigation */}
          <Suspense>
            <Sidebar />
          </Suspense>

          {/* Main Content */}
          <div className="flex-1 flex flex-col overflow-hidden bg-background">
            {/* Toolbar */}
            <Toolbar>
              <Suspense>
                <SidebarToggle />
              </Suspense>
            </Toolbar>

            {/* Main Content */}
            <main className="flex-1 overflow-auto">{children}</main>
          </div>
        </SidebarProvider>
      </div>
    </div>
  );
}
