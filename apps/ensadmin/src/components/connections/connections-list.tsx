"use client";

import { CopyButton } from "@/components/copy-button";
import { Button } from "@/components/ui/button";
import {
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { ConnectionOption } from "@/hooks/ensnode-connections";
import { cn } from "@/lib/utils";
import type { UrlString } from "@ensnode/ensnode-sdk";
import { Trash2 } from "lucide-react";

interface ConnectionsListProps {
  connectionLibrary: ConnectionOption[];
  selectedConnectionUrl: UrlString;
  onSelectConnection: (url: UrlString) => void;
  onRemoveCustomConnection?: (url: UrlString) => void;
  type: "server" | "custom";
}

export function ConnectionsList({
  connectionLibrary,
  selectedConnectionUrl,
  onSelectConnection,
  onRemoveCustomConnection,
  type,
}: ConnectionsListProps): JSX.Element | null {
  const connections = connectionLibrary.filter(({ fromServerLibrary }) =>
    type === "server" ? fromServerLibrary : !fromServerLibrary,
  );

  if (connections.length === 0) {
    return null;
  }

  const label = type === "server" ? "ENSNode Connection Library" : "My Custom Connections";
  const showSeparator = type === "custom";

  return (
    <>
      {showSeparator && <DropdownMenuSeparator />}
      <DropdownMenuLabel className="text-xs text-muted-foreground">{label}</DropdownMenuLabel>

      {connections.map(({ url: connectionUrl }) => {
        const isActiveConnection = connectionUrl === selectedConnectionUrl;
        const isCustomConnection = type === "custom";
        const canRemove = isCustomConnection && !isActiveConnection;

        return (
          <div key={connectionUrl} className="flex items-center justify-between gap-1">
            <DropdownMenuItem
              onClick={() => onSelectConnection(connectionUrl)}
              className={cn(
                "cursor-pointer flex-1 py-2.5 truncate",
                isActiveConnection ? "bg-primary/10 text-primary" : null,
              )}
            >
              <span className="font-mono text-xs flex-1">{connectionUrl}</span>
            </DropdownMenuItem>
            <div className="flex items-center">
              {canRemove && onRemoveCustomConnection && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemoveCustomConnection(connectionUrl);
                  }}
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              )}
              <CopyButton value={connectionUrl} />
            </div>
          </div>
        );
      })}
    </>
  );
}
