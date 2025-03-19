"use client";

import { preferredEnsNodeUrl, selectedEnsNodeUrl } from "@/lib/env";
import { cn } from "@/lib/utils";
import { ChevronsUpDown, ExternalLink, Loader2, Plus, Trash2 } from "lucide-react";
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

  const { connections, isLoading, addConnection, removeConnection } = useConnections();

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
    if (url === preferredEnsNodeUrl()) return;
    removeConnection.mutate({ url });
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
                  <span className="truncate text-xs font-mono">{selectedUrl}</span>
                </div>
                <ChevronsUpDown className="ml-auto" />
              </SidebarMenuButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
              align="start"
              side={isMobile ? "bottom" : "right"}
              sideOffset={4}
            >
              <DropdownMenuLabel className="text-xs text-muted-foreground">
                ENSNode Connections
              </DropdownMenuLabel>

              {isLoading ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                </div>
              ) : (
                connections.map(({ url, isPreferred }) => (
                  <DropdownMenuItem
                    key={url}
                    onClick={() => handleSelect(url)}
                    className={cn(
                      "group gap-2 p-2 font-mono text-xs justify-between",
                      url === selectedUrl ? "bg-primary/10 text-primary" : "",
                    )}
                  >
                    <span className="truncate flex-1">{url}</span>
                    <div className="flex items-center gap-1">
                      <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="p-1 hover:text-foreground rounded"
                      >
                        <ExternalLink className="w-3 h-3" />
                      </a>
                      {!isPreferred && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemove(url);
                          }}
                          disabled={removeConnection.isPending}
                          className={cn(
                            "p-1 rounded",
                            removeConnection.isPending
                              ? "text-muted-foreground cursor-not-allowed"
                              : "hover:text-destructive",
                          )}
                        >
                          {removeConnection.isPending && removeConnection.variables?.url === url ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <Trash2 className="w-3 h-3" />
                          )}
                        </button>
                      )}
                    </div>
                  </DropdownMenuItem>
                ))
              )}

              <DropdownMenuSeparator />

              <DialogTrigger asChild>
                <DropdownMenuItem className="gap-2 p-2">
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
            Enter the URL of the ENSNode service you want to connect to.
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
