"use client";

import { CopyButton } from "@namehash/namehash-ui";
import { CheckIcon, CopyIcon } from "lucide-react";
import { useMemo } from "react";

import { useValidatedSelectedConnection } from "@/hooks/active/use-selected-connection";

export default function Actions() {
  const selectedConnection = useValidatedSelectedConnection();
  const url = useMemo(
    () => new URL(`/api/omnigraph`, selectedConnection).toString(),
    [selectedConnection],
  );

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
