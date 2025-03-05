"use client";

import { selectedEnsNodeUrl } from "@/lib/env";
import { cn } from "@/lib/utils";
import { Activity, Code2, Database, PanelLeft, PanelLeftClose } from "lucide-react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { PropsWithChildren, createContext, useContext, useState } from "react";
import { ConnectionSelector } from "./connections/connection-selector";
import { Provider as QueryClientProvider } from "./query-client/provider";

const tabs = [
  {
    path: "/status",
    label: "Status",
    icon: Activity,
  },
  {
    path: "/gql/ponder",
    label: "Ponder GraphQL API",
    icon: Database,
  },
  {
    path: "/gql/subgraph-compat",
    label: "Subgraph-compatible GraphQL API",
    icon: Database,
  },
  {
    path: "/ponder-client-api",
    label: "Ponder Client API",
    icon: Code2,
  },
];

const SidebarContext = createContext<
  | {
      isOpen: boolean;
      toggleSidebar: () => void;
    }
  | undefined
>(undefined);

export const SidebarProvider = function SidebarProvider({ children }: PropsWithChildren) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const toggleSidebar = () => setIsSidebarOpen((isOpen) => !isOpen);

  return (
    <SidebarContext.Provider value={{ isOpen: isSidebarOpen, toggleSidebar }}>
      {children}
    </SidebarContext.Provider>
  );
};

export function Sidebar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const ensNodeUrl = selectedEnsNodeUrl(searchParams);
  const sidebarContext = useContext(SidebarContext);

  if (!sidebarContext) {
    throw new Error("Sidebar context is missing");
  }

  const { isOpen } = sidebarContext;

  return (
    <nav
      className={cn(
        "bg-card border-r flex-shrink-0 overflow-y-auto",
        "transition-all duration-300 ease-in-out",
        isOpen ? "w-80" : "w-0",
      )}
      aria-label="Sidebar"
    >
      <div
        className={cn("w-80 transition-opacity duration-300", isOpen ? "opacity-100" : "opacity-0")}
      >
        <QueryClientProvider>
          <ConnectionSelector />
        </QueryClientProvider>
        <div className="p-4 space-y-2">
          {tabs.map(({ path, label, icon: Icon }) => {
            const to = ensNodeUrl ? `${path}?ensnode=${ensNodeUrl}` : path;
            const isActive = pathname === path;

            return (
              <Link
                key={path}
                href={to}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-lg w-full transition-colors",
                  "text-sm font-medium",
                  "hover:bg-muted hover:text-foreground",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground",
                )}
              >
                <Icon className="w-5 h-5" />
                <span>{label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}

export function SidebarToggle() {
  const sidebarContext = useContext(SidebarContext);

  if (!sidebarContext) {
    throw new Error("Sidebar context is missing");
  }

  const { isOpen, toggleSidebar } = sidebarContext;

  return (
    <button
      onClick={() => toggleSidebar()}
      className={cn(
        "w-8 h-8 flex items-center justify-center rounded-md",
        "text-muted-foreground hover:text-foreground",
        "hover:bg-muted transition-colors",
      )}
    >
      {isOpen ? <PanelLeftClose className="w-5 h-5" /> : <PanelLeft className="w-5 h-5" />}
      <span className="sr-only">{isOpen ? "Close sidebar" : "Open sidebar"}</span>
    </button>
  );
}
