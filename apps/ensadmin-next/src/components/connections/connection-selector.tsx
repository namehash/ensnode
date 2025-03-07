"use client";

import { preferredEnsNodeUrl, selectedEnsNodeUrl } from "@/lib/env";
import { cn } from "@/lib/utils";
import {
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Loader2,
  Plus,
  Server,
  Trash2,
} from "lucide-react";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import { useState } from "react";
import { useConnections } from "./use-connections";

export function ConnectionSelector() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const selectedUrl = selectedEnsNodeUrl(searchParams);

  const [isExpanded, setIsExpanded] = useState(false);
  const [newUrl, setNewUrl] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  const { connections, isLoading, addConnection, removeConnection } = useConnections();

  const handleSelect = (url: string) => {
    const params = new URLSearchParams(searchParams);
    params.set("ensnode", url);

    router.push(`${pathname}?${params.toString()}`)

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
    <div className="border-b">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={cn(
          "w-full h-14 px-4",
          "flex flex-col justify-center",
          "hover:bg-muted/50 transition-colors",
        )}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Server className="w-4 h-4" />
            <span>Connection</span>
          </div>
          {isExpanded ? (
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          )}
        </div>
        <div className="text-xs font-mono text-primary truncate text-left mt-1">{selectedUrl}</div>
      </button>

      {isExpanded && (
        <div className="px-2 pb-2">
          {/* Connection List */}
          <div className="space-y-1 mb-2">
            {isLoading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
              </div>
            ) : (
              connections.map(({ url, isPreferred }) => (
                <div
                  key={url}
                  className={cn(
                    "group flex items-center justify-between",
                    "px-3 py-2 rounded-md",
                    url === selectedUrl
                      ? "bg-primary/10 text-primary"
                      : "hover:bg-muted/50 text-muted-foreground",
                  )}
                >
                  <button
                    className="flex-1 text-left font-mono text-xs truncate"
                    onClick={() => handleSelect(url)}
                  >
                    {url}
                  </button>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
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
                </div>
              ))
            )}
          </div>

          {/* Add New Connection */}
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
                  onClick={() => {
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
                  onClick={handleAdd}
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
            <button
              onClick={() => setIsAdding(true)}
              className={cn(
                "w-full px-3 py-2 text-sm",
                "flex items-center gap-2",
                "text-muted-foreground hover:text-foreground",
                "rounded-md hover:bg-muted/50",
              )}
            >
              <Plus className="w-4 h-4" />
              <span>Add Connection</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
