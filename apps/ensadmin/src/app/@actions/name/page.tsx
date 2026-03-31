"use client";

import { getEnsManagerNameDetailsUrl } from "@namehash/namehash-ui";
import { ScanSearch } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

import type { Name } from "@ensnode/ensnode-sdk";

import { ExternalLinkWithIcon } from "@/components/link";
import { getRecordResolutionRelativePath } from "@/components/name-links";
import { Button } from "@/components/ui/button";
import { useNamespace } from "@/hooks/async/use-namespace";
import { useRawConnectionUrlParam } from "@/hooks/use-connection-url-param";

export default function ActionsNamePage() {
  const searchParams = useSearchParams();
  const name = (searchParams.get("name")?.trim() || null) as Name | null;

  const { data: namespace } = useNamespace();
  const { retainCurrentRawConnectionUrlParam } = useRawConnectionUrlParam();

  if (!name) return null;

  const inspectRecordsHref = retainCurrentRawConnectionUrlParam(
    getRecordResolutionRelativePath(name),
  );
  const ensAppProfileUrl = namespace ? getEnsManagerNameDetailsUrl(name, namespace) : null;

  return (
    <div className="flex items-center gap-2">
      <Button variant="link" size="sm" asChild>
        <Link href={inspectRecordsHref} className="inline-flex items-center gap-1">
          Inspect Records
          <ScanSearch size={12} />
        </Link>
      </Button>
      {ensAppProfileUrl && (
        <Button variant="link" size="sm" asChild>
          <ExternalLinkWithIcon href={ensAppProfileUrl.toString()}>
            View in ENS App
          </ExternalLinkWithIcon>
        </Button>
      )}
    </div>
  );
}
