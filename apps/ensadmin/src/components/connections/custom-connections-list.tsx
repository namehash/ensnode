"use client";

import { CopyButton } from "@/components/copy-button";
import { Button } from "@/components/ui/button";
import {
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { Trash2 } from "lucide-react";

interface Connection {
  url: string;
  isFromServer: boolean;
}

interface CustomConnectionsListProps {
  connectionLibrary: Connection[];
  activeConnectionUrl: string;
  onSelectCustomConnection: (url: string) => void;
  onRemoveCustomConnection: (url: string) => void;
}

export function CustomConnectionsList({
  connectionLibrary,
  activeConnectionUrl,
  onSelectCustomConnection,
  onRemoveCustomConnection,
}: CustomConnectionsListProps) {
  const customConnections = connectionLibrary.filter(({ isFromServer }) => !isFromServer);

  if (customConnections.length === 0) {
    return null;
  }

  return (
    <>
      <DropdownMenuSeparator />
      <DropdownMenuLabel className="text-xs text-muted-foreground">
        My Custom Connections
      </DropdownMenuLabel>

      {customConnections.map(({ url: customConnectionUrl }) => {
        const isActiveConnection = customConnectionUrl === activeConnectionUrl;
        return (
          <div key={customConnectionUrl} className="flex items-center justify-between gap-1">
            <DropdownMenuItem
              onClick={() => onSelectCustomConnection(customConnectionUrl)}
              className={cn(
                "cursor-pointer flex-1 py-2.5 truncate",
                isActiveConnection ? "bg-primary/10 text-primary" : null,
              )}
            >
              <span className="font-mono text-xs flex-1">{customConnectionUrl}</span>
            </DropdownMenuItem>
            <div className="flex items-center">
              {!isActiveConnection && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemoveCustomConnection(customConnectionUrl);
                  }}
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              )}
              <CopyButton value={customConnectionUrl} />
            </div>
          </div>
        );
      })}
    </>
  );
}
