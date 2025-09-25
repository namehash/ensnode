"use client";

import { ChevronsUpDown, Plus } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState } from "react";

import { AddConnectionDialog } from "@/components/connections/add-connection-dialog";
import { CustomConnectionsList } from "@/components/connections/custom-connections-list";
import { DefaultConnectionsList } from "@/components/connections/default-connections-list";
import { ENSAdminIcon } from "@/components/ensadmin-icon";
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
import { CopyButton } from "@/components/copy-button";

export function ConnectionSelector() {
  const { isMobile } = useSidebar();
  const router = useRouter();
  const searchParams = useSearchParams();

  const {
    availableConnections,
    addAndSelectCustomConnection: _addAndSelectCustomConnection,
    removeCustomConnection,
  } = useAvailableENSNodeConnections();
  const activeENSNodeUrl = useActiveENSNodeUrl().toString();
  const addAndSelectConnection = useMutation({
    mutationFn: _addAndSelectCustomConnection,
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
    addAndSelectConnection.mutate(url, {
      onSuccess: (addedUrl) => {
        setDialogOpen(false);
        updateUrlParam(addedUrl);
        addAndSelectConnection.reset();
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
              <DefaultConnectionsList
                availableConnections={availableConnections}
                activeConnectionUrl={activeENSNodeUrl}
                onSelectDefaultConnection={handleSelect}
              />

              <CustomConnectionsList
                availableConnections={availableConnections}
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
        isLoading={addAndSelectConnection.isPending}
        error={addAndSelectConnection.error?.message}
        onErrorReset={addAndSelectConnection.reset}
      />
    </>
  );
}
