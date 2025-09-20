"use client";

import { cn } from "@/lib/utils";
import { ChevronsUpDown, Loader2, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
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
import { useENSNodeConnection } from "@/hooks/active-ensnode-url";
import { useENSNodeConnections } from "@/hooks/ensnode-connections";
import { useMutation } from "@tanstack/react-query";
import { CopyButton } from "../ui/copy-button";

export function ConnectionSelector() {
  const { isMobile } = useSidebar();

  const {
    connections,
    addAndSelectConnection: _addAndSelectConnection,
    removeConnection,
    selectConnection,
  } = useENSNodeConnections();
  const activeENSNodeUrl = useENSNodeConnection().toString();
  const addAndSelectConnection = useMutation({
    mutationFn: _addAndSelectConnection,
  });

  const [newUrl, setNewUrl] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleSelect = (url: string) => {
    selectConnection(url);
    setDialogOpen(false);
  };

  const handleAdd = () => {
    addAndSelectConnection.mutate(newUrl, {
      onSuccess: (url) => {
        setNewUrl("");
        setDialogOpen(false);
        toast.success(`You are now connected to ${url}`);

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
