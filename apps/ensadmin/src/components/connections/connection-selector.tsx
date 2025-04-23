"use client";

import { selectedEnsNodeUrl } from "@/lib/env";
import { cn } from "@/lib/utils";
import { ChevronsUpDown, Loader2, Plus, Trash2 } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

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
import { CopyButton } from "../ui/copy-button";
import { useConnections } from "./use-connections";

const validateUrl = (url: string) => {
  if (!url) return null;
  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    return "URL must start with http:// or https://";
  }
  try {
    new URL(url);
    return null;
  } catch {
    return "Please enter a valid URL";
  }
};

export function ConnectionSelector() {
  const { isMobile } = useSidebar();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const selectedUrl = selectedEnsNodeUrl(searchParams);

  const [newUrl, setNewUrl] = useState("");
  const [urlError, setUrlError] = useState<string | null>(null);

  const [dialogOpen, setDialogOpen] = useState(false);

  const { connections, isLoading, addConnection, removeConnection } = useConnections({
    selectedEnsNodeUrl: selectedUrl,
  });

  const handleSelect = (url: string) => {
    const params = new URLSearchParams(searchParams);
    params.set("ensnode", url);

    router.push(`${pathname}?${params.toString()}`);

    window.dispatchEvent(new CustomEvent("ensnode/connection/set", { detail: { url } }));
  };

  const handleAdd = async () => {
    if (!newUrl) return;

    const error = validateUrl(newUrl);
    if (error) {
      setUrlError(error);
      return;
    }

    addConnection.mutate(
      { url: newUrl },
      {
        onSuccess: () => {
          setNewUrl("");
          setUrlError(null);
          setDialogOpen(false);
        },
      },
    );
  };

  const handleRemove = (url: string) => {
    const connectionToBeRemoved = connections.find((c) => c.isDefault === false && c.url === url);

    if (connectionToBeRemoved) {
      removeConnection.mutate(connectionToBeRemoved);
    }
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
                  <span className="truncate text-xs font-mono">{selectedUrl.toString()}</span>
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

              {isLoading ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                </div>
              ) : (
                connections
                  .filter(({ isDefault }) => isDefault)
                  .map(({ url }) => {
                    const isCurrentlySelectedConnection = url === selectedUrl.toString();
                    return (
                      <div key={url} className="flex items-center justify-between gap-1">
                        <DropdownMenuItem
                          onClick={() => handleSelect(url)}
                          className={cn(
                            "cursor-pointer flex-1 py-2.5 truncate",
                            isCurrentlySelectedConnection ? "bg-primary/10 text-primary" : null,
                          )}
                        >
                          <span className="font-mono text-xs flex-1">{url}</span>
                        </DropdownMenuItem>
                        <CopyButton value={url} />
                      </div>
                    );
                  })
              )}

              {!isLoading && connections.some(({ isDefault }) => !isDefault) && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel className="text-xs text-muted-foreground">
                    My Custom Connections
                  </DropdownMenuLabel>

                  {connections
                    .filter(({ isDefault }) => !isDefault)
                    .map(({ url }) => {
                      const isCurrentlySelectedConnection = url === selectedUrl.toString();
                      return (
                        <div key={url} className="flex items-center justify-between gap-1">
                          <DropdownMenuItem
                            onClick={() => handleSelect(url)}
                            className={cn(
                              "cursor-pointer flex-1 py-2.5 truncate",
                              isCurrentlySelectedConnection ? "bg-primary/10 text-primary" : null,
                            )}
                          >
                            <span className="font-mono text-xs flex-1">{url}</span>
                          </DropdownMenuItem>
                          <div className="flex items-center">
                            {!isCurrentlySelectedConnection && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRemove(url);
                                }}
                                disabled={removeConnection.isPending}
                                className={cn(
                                  removeConnection.isPending ? "cursor-not-allowed" : "",
                                )}
                              >
                                {removeConnection.isPending &&
                                removeConnection.variables?.url === url ? (
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                ) : (
                                  <Trash2 className="w-3 h-3" />
                                )}
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
                setUrlError(null);
              }}
              className={cn(
                "font-mono",
                urlError || addConnection.isError ? "border-destructive" : "",
              )}
            />
            {urlError && <p className="text-xs text-destructive">{urlError}</p>}
            {addConnection.isError && !urlError && (
              <p className="text-xs text-destructive">
                {addConnection.error instanceof Error
                  ? addConnection.error.message
                  : "Failed to add connection"}
              </p>
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
              addConnection.reset();
            }}
          >
            Cancel
          </Button>
          <Button type="submit" onClick={handleAdd} disabled={addConnection.isPending || !newUrl}>
            {addConnection.isPending ? (
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
