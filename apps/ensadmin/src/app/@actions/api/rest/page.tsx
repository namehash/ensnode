"use client";

import { CopyButton } from "@namehash/namehash-ui";
import { CheckIcon, CopyIcon } from "lucide-react";

import { useOpenApiUrl } from "@/hooks/active/use-openapi-url";

export default function Actions() {
  const url = useOpenApiUrl();

  return (
    <div className="flex w-full max-w-md min-w-0 items-center space-x-2">
      <span className="font-mono text-xs select-none text-gray-500 truncate min-w-0" title={url}>
        {url}
      </span>
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
