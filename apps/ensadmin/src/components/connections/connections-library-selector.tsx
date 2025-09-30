"use client";

import { ChevronsUpDown, Plus } from "lucide-react";
import { useState } from "react";

import { AddCustomConnectionDialog } from "@/components/connections/add-custom-connection-dialog";
import { ConnectionsLibraryList } from "@/components/connections/connections-library-list";
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
import { ConnectionOption, useConnectionsLibrary } from "@/hooks/use-connections-library";
import { beautifyUrl } from "@/lib/beautify-url";
import { buildHttpHostname } from "@/lib/url-utils";

export function ConnectionsLibrarySelector() {
  const { isMobile } = useSidebar();

  const {
    connectionLibrary,
    selectedConnection,
    addCustomConnection,
    removeCustomConnection,
    selectConnection,
  } = useConnectionsLibrary();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConnectionsLibrarySelection = (option: ConnectionOption) => {
    selectConnection(option.url);
    setDialogOpen(false);
  };

  const handleSubmitNewCustomConnection = (rawUrl: string) => {
    const validation = buildHttpHostname(rawUrl);

    if (!validation.isValid) {
      setError(validation.error);
      setIsLoading(false);
    } else {
      const url = validation.url;
      setIsLoading(true);
      const addedUrl = addCustomConnection(url);
      setIsLoading(false);
      setDialogOpen(false);
      setError(null);

      // automatically select the newly added connection
      selectConnection(addedUrl);
    }
  };

  const handleErrorReset = () => {
    setError(null);
  };

  let connectionMessage: string;

  if (!selectedConnection) {
    connectionMessage = "Disconnected";
  } else if (!selectedConnection.validatedSelectedConnection.isValid) {
    connectionMessage = "Invalid connection";
  } else {
    connectionMessage = beautifyUrl(selectedConnection.validatedSelectedConnection.url);
  }

  const serverConnections = connectionLibrary.filter((connection) => connection.type === "server");
  const customConnections = connectionLibrary.filter((connection) => connection.type === "custom");

  const selectedConnectionUrl =
    selectedConnection && selectedConnection.validatedSelectedConnection.isValid
      ? selectedConnection.validatedSelectedConnection.url
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
                Server Connection Library
              </DropdownMenuLabel>
              <ConnectionsLibraryList
                connections={serverConnections}
                selectedConnection={selectedConnectionUrl}
                onSelectConnection={handleConnectionsLibrarySelection}
              />

              {customConnections.length > 0 && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel className="text-xs text-muted-foreground">
                    My Custom Connections
                  </DropdownMenuLabel>
                  <ConnectionsLibraryList
                    connections={customConnections}
                    selectedConnection={selectedConnectionUrl}
                    onSelectConnection={handleConnectionsLibrarySelection}
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
                <div className="font-medium text-muted-foreground">Add custom connection</div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>

      <AddCustomConnectionDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSubmit={handleSubmitNewCustomConnection}
        isLoading={isLoading}
        error={error}
        onErrorReset={handleErrorReset}
      />
    </>
  );
}
