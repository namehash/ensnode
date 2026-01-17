"use client";

import { CopyButton } from "@namehash/namehash-ui";
import { CheckIcon, CopyIcon } from "lucide-react";
import * as React from "react";

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
      <CopyButton
        value={url}
        message="URL copied to clipboard!"
        successIcon={<CheckIcon className="h-4 w-4" />}
        icon={<CopyIcon className="h-4 w-4" />}
        showToast={true}
      />
    </div>
  );
}
