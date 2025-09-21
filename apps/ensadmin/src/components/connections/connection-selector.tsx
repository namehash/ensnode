"use client";

import { cn } from "@/lib/utils";
import { ChevronsUpDown, Loader2, Plus, Trash2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { ENSAdminIcon } from "@/components/ensadmin-icon";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { useActiveENSNodeUrl } from "@/hooks/active/use-active-ensnode-url";
import { useENSNodeConnections } from "@/hooks/ensnode-connections";
import { useMutation } from "@tanstack/react-query";
import { CopyButton } from "../ui/copy-button";

const CONNECTION_PARAM_KEY = "connection";

export function ConnectionSelector() {
  const { isMobile } = useSidebar();
  const router = useRouter();
  const searchParams = useSearchParams();

  const {
    connections,
    addAndSelectConnection: _addAndSelectConnection,
    removeConnection,
    selectConnection,
  } = useENSNodeConnections();
  const activeENSNodeUrl = useActiveENSNodeUrl().toString();
  const addAndSelectConnection = useMutation({
    mutationFn: _addAndSelectConnection,
  });

  const addConnectionFromUrl = useMutation({
    mutationFn: _addAndSelectConnection,
  });

  const [newUrl, setNewUrl] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [previousConnection, setPreviousConnection] = useState<string | null>(null);
  const [failedConnections, setFailedConnections] = useState<Set<string>>(new Set());

  useEffect(() => {
    const currentConnection = searchParams.get(CONNECTION_PARAM_KEY);

    if (
      previousConnection !== null &&
      previousConnection !== currentConnection &&
      currentConnection
    ) {
      toast.success(`Connected to ${currentConnection}`);
    }

    setPreviousConnection(currentConnection);
  }, [searchParams, previousConnection]);

  const updateUrlParam = useCallback(
    (url: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set(CONNECTION_PARAM_KEY, url);
      router.replace(`?${params.toString()}`);
    },
    [router, searchParams],
  );

  useEffect(() => {
    const connectionParam = searchParams.get(CONNECTION_PARAM_KEY);

    // If no connection parameter exists and we have an active connection, update URL
    if (!connectionParam && activeENSNodeUrl && connections.length > 0) {
      updateUrlParam(activeENSNodeUrl);
      return;
    }

    if (!connectionParam) return;

    if (failedConnections.has(connectionParam)) return;

    const existingConnection = connections.find((conn) => conn.url === connectionParam);
    if (existingConnection) {
      if (activeENSNodeUrl !== connectionParam) {
        selectConnection(connectionParam);
      }
      return;
    }

    addConnectionFromUrl.mutate(connectionParam, {
      onSuccess: (addedUrl) => {
        updateUrlParam(addedUrl);
        toast.success(`Connection saved to custom connections`);
        toast.success(`Connected to ${addedUrl}`);
      },
      onError: (error) => {
        toast.error(`Failed to connect: ${error.message}`);

        // Track this as a failed connection to prevent retry loop
        setFailedConnections((prev) => new Set(prev).add(connectionParam));

        // Remove invalid connection param from URL
        const params = new URLSearchParams(searchParams.toString());
        params.delete(CONNECTION_PARAM_KEY);
        router.replace(params.toString() ? `?${params.toString()}` : window.location.pathname);
      },
    });
  }, [
    searchParams,
    connections,
    activeENSNodeUrl,
    selectConnection,
    addConnectionFromUrl,
    router,
    updateUrlParam,
    failedConnections,
  ]);

  const handleSelect = (url: string) => {
    selectConnection(url);
    updateUrlParam(url);
    setDialogOpen(false);
  };

  const handleAdd = () => {
    addAndSelectConnection.mutate(newUrl, {
      onSuccess: (url) => {
        setNewUrl("");
        setDialogOpen(false);
        updateUrlParam(url);
        addAndSelectConnection.reset();
      },
    });
  };

  const handleRemove = (url: string) => {
    removeConnection(url);
  };

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
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
              <DropdownMenuLabel className="text-xs text-muted-foreground">
                ENSNode Connection Library
              </DropdownMenuLabel>

              {connections
                .filter(({ isDefault }) => isDefault)
                .map(({ url }) => {
                  const isActiveUrl = url === activeENSNodeUrl;
                  return (
                    <div key={url} className="flex items-center justify-between gap-1">
                      <DropdownMenuItem
                        onClick={() => handleSelect(url)}
                        className={cn(
                          "cursor-pointer flex-1 py-2.5 truncate",
                          isActiveUrl ? "bg-primary/10 text-primary" : null,
                        )}
                      >
                        <span className="font-mono text-xs flex-1">{url}</span>
                      </DropdownMenuItem>
                      <CopyButton value={url} />
                    </div>
                  );
                })}

              {connections.some(({ isDefault }) => !isDefault) && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel className="text-xs text-muted-foreground">
                    My Custom Connections
                  </DropdownMenuLabel>

                  {connections
                    .filter(({ isDefault }) => !isDefault)
                    .map(({ url }) => {
                      const isActiveUrl = url === activeENSNodeUrl;
                      return (
                        <div key={url} className="flex items-center justify-between gap-1">
                          <DropdownMenuItem
                            onClick={() => handleSelect(url)}
                            className={cn(
                              "cursor-pointer flex-1 py-2.5 truncate",
                              isActiveUrl ? "bg-primary/10 text-primary" : null,
                            )}
                          >
                            <span className="font-mono text-xs flex-1">{url}</span>
                          </DropdownMenuItem>
                          <div className="flex items-center">
                            {!isActiveUrl && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRemove(url);
                                }}
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            )}
                            <CopyButton value={url} />
                          </div>
                        </div>
                      );
                    })}
                </>
              )}

              <DropdownMenuSeparator />

              <DialogTrigger asChild>
                <DropdownMenuItem className="gap-2 p-2 cursor-pointer">
                  <div className="flex size-6 items-center justify-center rounded-md border bg-background">
                    <Plus className="size-4" />
                  </div>
                  <div className="font-medium text-muted-foreground">Add connection</div>
                </DropdownMenuItem>
              </DialogTrigger>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>

      <DialogContent className="sm:max-w-[460px]">
        <DialogHeader>
          <DialogTitle>Add ENSNode Connection</DialogTitle>
          <DialogDescription>
            Enter the URL of the ENSNode you want to connect to.
          </DialogDescription>
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleAdd();
          }}
          className="grid gap-4 py-4"
        >
          <div className="grid gap-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="url">URL</Label>
              <span className="text-xs text-muted-foreground">Include http:// or https://</span>
            </div>
            <Input
              id="url"
              type="text"
              placeholder="https://your-ens-node.example.com"
              value={newUrl}
              onChange={(e) => {
                setNewUrl(e.target.value);
                addAndSelectConnection.reset();
              }}
              className={cn(
                "font-mono",
                addAndSelectConnection.isError ? "border-destructive" : "",
              )}
            />
            {addAndSelectConnection.isError && (
              <p className="text-xs text-destructive">{addAndSelectConnection.error.message}</p>
            )}
          </div>
        </form>
        <DialogFooter>
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              setDialogOpen(false);
              setNewUrl("");
              addAndSelectConnection.reset();
            }}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            onClick={handleAdd}
            disabled={addAndSelectConnection.isPending || !newUrl}
          >
            {addAndSelectConnection.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Adding...
              </>
            ) : (
              "Add Connection"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
