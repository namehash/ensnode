"use client";

import { ChevronsUpDown, Plus } from "lucide-react";
import { useState } from "react";

import { AddConnectionDialog } from "@/components/connections/add-connection-dialog";
import { ConnectionsList } from "@/components/connections/connections-list";
import { ENSAdminIcon } from "@/components/icons/ensnode-apps/ensadmin-icon";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { ConnectionOption, useAvailableENSNodeConnections } from "@/hooks/ensnode-connections";
import { beautifyUrl } from "@/lib/beautify-url";
import { buildHttpHostname } from "@/lib/url-utils";

export function ConnectionSelector() {
  const { isMobile } = useSidebar();

  const {
    connectionLibrary,
    selectedConnection,
    addCustomConnection,
    removeCustomConnection,
    selectConnection,
  } = useAvailableENSNodeConnections();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConnectionLibrarySelection = (option: ConnectionOption) => {
    selectConnection(option.url);
    setDialogOpen(false);
  };

  const handleAddCustomConnection = (rawUrl: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const validation = buildHttpHostname(rawUrl);

      if (!validation.isValid) {
        throw new Error(`Invalid connection URL: ${validation.error}`);
      }

      const url = validation.url;
      const addedUrl = addCustomConnection(url);
      setDialogOpen(false);
      selectConnection(addedUrl);
      setIsLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add connection");
      setIsLoading(false);
    }
  };

  const handleErrorReset = () => {
    setError(null);
  };

  let connectionMessage: string;

  if (!selectedConnection) {
    connectionMessage = "Disconnected";
  } else if (!selectedConnection.validSelectedConnection) {
    connectionMessage = "Invalid connection";
  } else {
    connectionMessage = beautifyUrl(selectedConnection.validSelectedConnection);
  }

  const serverConnections = connectionLibrary.filter((connection) => connection.type === "server");
  const customConnections = connectionLibrary.filter((connection) => connection.type === "custom");

  const selectedConnectionUrl = selectedConnection
    ? selectedConnection.validSelectedConnection
    : null;

  return (
    <>
      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton
                size="lg"
                className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
              >
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  <ENSAdminIcon className="size-8" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">ENSAdmin</span>
                  <span className="truncate text-xs font-mono">{connectionMessage}</span>
                </div>
                <ChevronsUpDown className="ml-auto" />
              </SidebarMenuButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="w-[--radix-dropdown-menu-trigger-width] min-w-80 rounded-lg"
              align="start"
              side={isMobile ? "bottom" : "right"}
              sideOffset={4}
            >
              <DropdownMenuLabel className="text-xs text-muted-foreground">
                ENSNode Connection Library
              </DropdownMenuLabel>
              <ConnectionsList
                connections={serverConnections}
                selectedConnection={selectedConnectionUrl}
                onSelectConnection={handleConnectionLibrarySelection}
              />

              {customConnections.length > 0 && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel className="text-xs text-muted-foreground">
                    My Custom Connections
                  </DropdownMenuLabel>
                  <ConnectionsList
                    connections={customConnections}
                    selectedConnection={selectedConnectionUrl}
                    onSelectConnection={handleConnectionLibrarySelection}
                    onRemoveCustomConnection={removeCustomConnection}
                  />
                </>
              )}

              <DropdownMenuSeparator />

              <DropdownMenuItem
                className="gap-2 p-2 cursor-pointer"
                onClick={() => setDialogOpen(true)}
              >
                <div className="flex size-6 items-center justify-center rounded-md border bg-background">
                  <Plus className="size-4" />
                </div>
                <div className="font-medium text-muted-foreground">Add connection</div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>

      <AddConnectionDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onAdd={handleAddCustomConnection}
        isLoading={isLoading}
        error={error}
        onErrorReset={handleErrorReset}
      />
    </>
  );
}
