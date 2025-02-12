import { Code2, Database, Info } from "lucide-react";
import type { PropsWithChildren } from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "../utils/ui";
import { URLEditor } from "./URLEditor";

export function Layout({ children, ensnodeUrl }: PropsWithChildren<{ ensnodeUrl: URL }>) {
  const location = useLocation();

  const tabs = [
    {
      path: "/about",
      label: "About",
      icon: Info,
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
      path: "/ponder-client",
      label: "Ponder Client",
      icon: Code2,
    },
  ];

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <header className="bg-card border-b px-6 py-4">
        <h1 className="text-2xl font-semibold text-card-foreground">ENSAdmin</h1>
        <div className="flex items-center gap-2 mt-2">
          <span className="text-sm font-medium text-muted-foreground">ENSNode at</span>
          <URLEditor currentUrl={ensnodeUrl} className="min-w-96" />
        </div>
      </header>

      {/* Navigation */}
      <div className="bg-muted/40 border-b px-6 py-4">
        <nav className="flex space-x-2" aria-label="Tabs">
          {tabs.map(({ path, label, icon: Icon }) => {
            const to = ensnodeUrl ? `${path}?ensnode=${ensnodeUrl}` : path;
            const isActive = location.pathname === path;

            return (
              <Link
                key={path}
                to={to}
                className={cn(
                  "inline-flex items-center justify-center rounded-md px-3 py-2",
                  "text-sm font-medium transition-colors",
                  "hover:bg-muted hover:text-foreground",
                  isActive ? "bg-background text-foreground shadow-sm" : "text-muted-foreground",
                )}
              >
                <Icon className="w-4 h-4 mr-2" />
                {label}
              </Link>
            );
          })}
        </nav>
      </div>

      {children}
    </div>
  );
}
