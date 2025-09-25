"use client";

import { CopyButton } from "@/components/copy-button";
import { DropdownMenuItem, DropdownMenuLabel } from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface Connection {
  url: string;
  isDefault: boolean;
}

interface DefaultConnectionsListProps {
  availableConnections: Connection[];
  activeConnectionUrl: string;
  onSelectDefaultConnection: (url: string) => void;
}

export function DefaultConnectionsList({
  availableConnections,
  activeConnectionUrl,
  onSelectDefaultConnection,
}: DefaultConnectionsListProps) {
  const defaultConnections = availableConnections.filter(({ isDefault }) => isDefault);

  if (defaultConnections.length === 0) {
    return null;
  }

  return (
    <>
      <DropdownMenuLabel className="text-xs text-muted-foreground">
        ENSNode Connection Library
      </DropdownMenuLabel>

      {defaultConnections.map(({ url: defaultConnectionUrl }) => {
        const isActiveConnection = defaultConnectionUrl === activeConnectionUrl;

        return (
          <div key={defaultConnectionUrl} className="flex items-center justify-between gap-1">
            <DropdownMenuItem
              onClick={() => onSelectDefaultConnection(defaultConnectionUrl)}
              className={cn(
                "cursor-pointer flex-1 py-2.5 truncate",
                isActiveConnection ? "bg-primary/10 text-primary" : null,
              )}
            >
              <span className="font-mono text-xs flex-1">{defaultConnectionUrl}</span>
            </DropdownMenuItem>
            <CopyButton value={defaultConnectionUrl} />
          </div>
        );
      })}
    </>
  );
}
