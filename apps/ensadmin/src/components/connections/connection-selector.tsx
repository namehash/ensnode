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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { useSelectedENSNodeUrl } from "@/hooks/active/use-selected-ensnode-url";
import { useAvailableENSNodeConnections } from "@/hooks/ensnode-connections";
import { type UrlString } from "@ensnode/ensnode-sdk";

export function ConnectionSelector() {
  const { isMobile } = useSidebar();

  const { connectionLibrary, addCustomConnection, removeCustomConnection, selectConnection } =
    useAvailableENSNodeConnections();
  const selectedENSNodeUrl = useSelectedENSNodeUrl().toString();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSelect = (url: UrlString) => {
    selectConnection(url);
    setDialogOpen(false);
  };

  const handleAdd = (url: UrlString) => {
    setIsLoading(true);
    setError(null);

    try {
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
                  <span className="truncate text-xs font-mono">{selectedENSNodeUrl}</span>
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
              <ConnectionsList
                connectionLibrary={connectionLibrary}
                selectedConnectionUrl={selectedENSNodeUrl}
                onSelectConnection={handleSelect}
                type="server"
              />

              <ConnectionsList
                connectionLibrary={connectionLibrary}
                selectedConnectionUrl={selectedENSNodeUrl}
                onSelectConnection={handleSelect}
                onRemoveCustomConnection={removeCustomConnection}
                type="custom"
              />

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
        onAdd={handleAdd}
        isLoading={isLoading}
        error={error}
        onErrorReset={handleErrorReset}
      />
    </>
  );
}
