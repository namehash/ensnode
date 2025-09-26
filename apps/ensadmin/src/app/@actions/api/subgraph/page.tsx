"use client";

import { CopyButton } from "@/components/copy-button";
import { useSelectedENSNodeUrl } from "@/hooks/active/use-selected-ensnode-url";

export default function ActionsSubgraphCompatPage() {
  const baseUrl = useSelectedENSNodeUrl();
  const url = new URL(`/subgraph`, baseUrl).toString();

  return (
    <div className="flex w-full max-w-md items-center space-x-2">
      <span className="font-mono text-xs select-none text-gray-500">{url}</span>
      <CopyButton value={url} message="URL copied to clipboard!" />
    </div>
  );
}
