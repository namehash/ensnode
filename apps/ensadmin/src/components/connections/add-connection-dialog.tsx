"use client";

import { cn } from "@/lib/utils";
import type { UrlString } from "@ensnode/ensnode-sdk";
import { Loader2 } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface AddConnectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (url: UrlString) => void;
  isLoading?: boolean;
  error?: string | null;
  onErrorReset?: () => void;
}

export function AddConnectionDialog({
  open,
  onOpenChange,
  onAdd,
  isLoading = false,
  error = null,
  onErrorReset,
}: AddConnectionDialogProps) {
  const [newUrl, setNewUrl] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newUrl.trim()) {
      onAdd(newUrl.trim() as UrlString);
    }
  };

  const handleClose = () => {
    setNewUrl("");
    onErrorReset?.();
    onOpenChange(false);
  };

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewUrl(e.target.value);
    if (error && onErrorReset) {
      onErrorReset();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[460px]">
        <DialogHeader>
          <DialogTitle>Add ENSNode Connection</DialogTitle>
          <DialogDescription>
            Enter the URL of the ENSNode you want to connect to.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="grid gap-4">
            <Label htmlFor="url">URL</Label>
            <Input
              id="url"
              type="text"
              placeholder="https://your-ens-node.example.com"
              value={newUrl}
              onChange={handleUrlChange}
              className={cn("font-mono", error ? "border-destructive" : "")}
            />
            {error && <p className="text-xs text-destructive">{error}</p>}
          </div>
        </form>
        <DialogFooter>
          <Button type="button" variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
          <Button type="submit" onClick={handleSubmit} disabled={isLoading || !newUrl.trim()}>
            {isLoading ? (
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
