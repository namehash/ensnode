"use client";

import { ChevronsUpDown, Plus } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState } from "react";

import { AddConnectionDialog } from "@/components/connections/add-connection-dialog";
import { CustomConnectionsList } from "@/components/connections/custom-connections-list";
import { ServerConnectionsList } from "@/components/connections/server-connections-list";
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
import { useActiveENSNodeUrl } from "@/hooks/active/use-active-ensnode-url";
import { useAvailableENSNodeConnections } from "@/hooks/ensnode-connections";
import { CONNECTION_PARAM_KEY } from "@/lib/constants";
import { useMutation } from "@tanstack/react-query";

export function ConnectionSelector() {
  const { isMobile } = useSidebar();
  const router = useRouter();
  const searchParams = useSearchParams();

  const { connectionLibrary, addCustomConnection, removeCustomConnection } =
    useAvailableENSNodeConnections();
  const activeENSNodeUrl = useActiveENSNodeUrl().toString();
  const addCustomConnectionMutation = useMutation({
    mutationFn: addCustomConnection,
  });

  const [dialogOpen, setDialogOpen] = useState(false);

  const updateUrlParam = useCallback(
    (url: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set(CONNECTION_PARAM_KEY, url);
      router.replace(`?${params.toString()}`);
    },
    [router, searchParams],
  );

  const handleSelect = (url: string) => {
    updateUrlParam(url);
    setDialogOpen(false);
  };

  const handleAdd = (url: string) => {
    addCustomConnectionMutation.mutate(url, {
      onSuccess: (addedUrl) => {
        setDialogOpen(false);
        updateUrlParam(addedUrl);
        addCustomConnectionMutation.reset();
      },
    });
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
                  <span className="truncate text-xs font-mono">{activeENSNodeUrl}</span>
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
              <ServerConnectionsList
                connectionLibrary={connectionLibrary}
                activeConnectionUrl={activeENSNodeUrl}
                onSelectServerConnection={handleSelect}
              />

              <CustomConnectionsList
                connectionLibrary={connectionLibrary}
                activeConnectionUrl={activeENSNodeUrl}
                onSelectCustomConnection={handleSelect}
                onRemoveCustomConnection={removeCustomConnection}
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
        isLoading={addCustomConnectionMutation.isPending}
        error={addCustomConnectionMutation.error?.message}
        onErrorReset={addCustomConnectionMutation.reset}
      />
    </>
  );
}
