"use client";

import { CopyButton } from "@/components/copy-button";
import { useSelectedConnection } from "@/hooks/active/use-selected-connection";

export default function ActionsSubgraphCompatPage() {
  const { validatedSelectedConnection } = useSelectedConnection();

  // TODO: we need a broader refactor to recognize the difference between
  // a selected connection being in a valid format or not.
  if (!validatedSelectedConnection.isValid) return null;

  const url = new URL(`/subgraph`, validatedSelectedConnection.url).toString();

  return (
    <div className="flex w-full max-w-md items-center space-x-2">
      <span className="font-mono text-xs select-none text-gray-500">{url}</span>
      <CopyButton value={url} message="URL copied to clipboard!" />
    </div>
  );
}
