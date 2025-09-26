"use client";

import { CopyButton } from "@/components/copy-button";
import { DropdownMenuItem, DropdownMenuLabel } from "@/components/ui/dropdown-menu";
import { ConnectionOption } from "@/hooks/ensnode-connections";
import { cn } from "@/lib/utils";
import { UrlString } from "@ensnode/ensnode-sdk";

interface ServerConnectionsListProps {
  connectionLibrary: ConnectionOption[];
  activeConnectionUrl: UrlString;
  onSelectServerConnection: (url: UrlString) => void;
}

export function ServerConnectionsList({
  connectionLibrary,
  activeConnectionUrl,
  onSelectServerConnection,
}: ServerConnectionsListProps) {
  const serverConnections = connectionLibrary.filter(({ fromServerLibrary }) => fromServerLibrary);

  if (serverConnections.length === 0) {
    return null;
  }

  return (
    <>
      <DropdownMenuLabel className="text-xs text-muted-foreground">
        ENSNode Connection Library
      </DropdownMenuLabel>

      {serverConnections.map(({ url: serverConnectionUrl }) => {
        const isActiveConnection = serverConnectionUrl === activeConnectionUrl;

        return (
          <div key={serverConnectionUrl} className="flex items-center justify-between gap-1">
            <DropdownMenuItem
              onClick={() => onSelectServerConnection(serverConnectionUrl)}
              className={cn(
                "cursor-pointer flex-1 py-2.5 truncate",
                isActiveConnection ? "bg-primary/10 text-primary" : null,
              )}
            >
              <span className="font-mono text-xs flex-1">{serverConnectionUrl}</span>
            </DropdownMenuItem>
            <CopyButton value={serverConnectionUrl} />
          </div>
        );
      })}
    </>
  );
}
