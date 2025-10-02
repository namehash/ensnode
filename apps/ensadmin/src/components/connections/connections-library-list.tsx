"use client";

import { CopyButton } from "@/components/copy-button";
import { Button } from "@/components/ui/button";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { ConnectionOption } from "@/hooks/use-connections-library";
import { beautifyUrl } from "@/lib/beautify-url";
import { HttpHostname } from "@/lib/url-utils";
import { cn } from "@/lib/utils";
import { Trash2 } from "lucide-react";

interface ConnectionsLibraryListProps {
  connections: ConnectionOption[];
  selectedConnection: HttpHostname | null;
  onSelectConnection: (option: ConnectionOption) => void;
  onRemoveCustomConnection?: (url: HttpHostname) => void;
}

export function ConnectionsLibraryList({
  connections,
  selectedConnection,
  onSelectConnection,
  onRemoveCustomConnection,
}: ConnectionsLibraryListProps): JSX.Element {
  return (
    <>
      {connections.map((connection) => {
        const isSelectedConnection = connection.url === selectedConnection;
        const isCustomConnection = connection.type === "custom";
        const canRemove = isCustomConnection && !isSelectedConnection;
        const beautifiedUrl = beautifyUrl(connection.url);

        return (
          <div key={connection.url.toString()} className="flex items-center justify-between gap-1">
            <DropdownMenuItem
              onClick={() => onSelectConnection(connection)}
              className={cn(
                "cursor-pointer flex-1 py-2.5 truncate",
                isSelectedConnection ? "bg-primary/10 text-primary" : null,
              )}
            >
              <span className="text-xs flex-1">{beautifiedUrl}</span>
            </DropdownMenuItem>
            <div className="flex items-center">
              {canRemove && onRemoveCustomConnection && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemoveCustomConnection(connection.url);
                  }}
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              )}
              <CopyButton value={beautifiedUrl} />
            </div>
          </div>
        );
      })}
    </>
  );
}
