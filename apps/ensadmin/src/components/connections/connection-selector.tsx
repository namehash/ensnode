"use client";

import { preferredEnsNodeUrl, selectedEnsNodeUrl } from "@/lib/env";
import { cn } from "@/lib/utils";
import { ChevronsUpDown, ExternalLink, Loader2, Plus, Server, Trash2 } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

import { ENSAdminIcon } from "@/components/ensadmin-icon";
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
import { useConnections } from "./use-connections";

export function ConnectionSelector() {
  const { isMobile } = useSidebar();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const selectedUrl = selectedEnsNodeUrl(searchParams);

  const [newUrl, setNewUrl] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  const { connections, isLoading, addConnection, removeConnection } = useConnections();

  const handleSelect = (url: string) => {
    const params = new URLSearchParams(searchParams);
    params.set("ensnode", url);

    router.push(`${pathname}?${params.toString()}`);

    window.dispatchEvent(new CustomEvent("ensnode/connection/set", { detail: { url } }));
  };

  const handleAdd = async () => {
    if (!newUrl) return;

    addConnection.mutate(
      { url: newUrl },
      {
        onSuccess: () => {
          setNewUrl("");
          setIsAdding(false);
        },
      },
    );
  };

  const handleRemove = (url: string) => {
    if (url === preferredEnsNodeUrl()) return;
    removeConnection.mutate({ url });
  };

  return (
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
              ENS Node Connections
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

            {isAdding ? (
              <div className="px-3 py-2 space-y-2">
                <input
                  type="url"
                  placeholder="Enter URL"
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                  disabled={addConnection.isPending}
                  className={cn(
                    "w-full px-2 py-1 text-sm font-mono rounded border bg-background",
                    addConnection.isError ? "border-destructive" : "border-input",
                    addConnection.isPending && "opacity-50",
                  )}
                  autoFocus
                />
                {addConnection.isError && (
                  <p className="text-xs text-destructive">
                    {addConnection.error instanceof Error
                      ? addConnection.error.message
                      : "Failed to add connection"}
                  </p>
                )}
                <div className="flex justify-end gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsAdding(false);
                      setNewUrl("");
                      addConnection.reset();
                    }}
                    disabled={addConnection.isPending}
                    className="px-2 py-1 text-xs text-muted-foreground hover:text-foreground disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAdd();
                    }}
                    disabled={addConnection.isPending}
                    className={cn(
                      "px-2 py-1 text-xs rounded inline-flex items-center gap-1",
                      "bg-primary text-primary-foreground",
                      "hover:bg-primary/90 disabled:opacity-50",
                    )}
                  >
                    {addConnection.isPending ? (
                      <>
                        <Loader2 className="w-3 h-3 animate-spin" />
                        <span>Adding...</span>
                      </>
                    ) : (
                      <span>Add</span>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <DropdownMenuItem
                className="gap-2 p-2"
                onClick={(e) => {
                  e.preventDefault();
                  setIsAdding(true);
                }}
              >
                <div className="flex size-6 items-center justify-center rounded-md border bg-background">
                  <Plus className="size-4" />
                </div>
                <div className="font-medium text-muted-foreground">Add connection</div>
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
