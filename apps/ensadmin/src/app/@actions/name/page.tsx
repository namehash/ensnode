"use client";

import { getEnsManagerNameDetailsUrl } from "@namehash/namehash-ui";
import { ScanSearch } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

import type { Name } from "@ensnode/ensnode-sdk";

import { getRecordResolutionRelativePath } from "@/app/inspect/records/page";
import { ExternalLinkWithIcon } from "@/components/link";
import { Button } from "@/components/ui/button";
import { useNamespace } from "@/hooks/async/use-namespace";
import { useRawConnectionUrlParam } from "@/hooks/use-connection-url-param";

export default function ActionsNamePage() {
  const searchParams = useSearchParams();
  const nameParam = searchParams.get("name");

  const name = nameParam ? (decodeURIComponent(nameParam) as Name) : null;

  const { data: namespace } = useNamespace();
  const { retainCurrentRawConnectionUrlParam } = useRawConnectionUrlParam();

  const ensAppProfileUrl = name && namespace ? getEnsManagerNameDetailsUrl(name, namespace) : null;
  const inspectRecordsHref = name
    ? retainCurrentRawConnectionUrlParam(getRecordResolutionRelativePath(name))
    : null;

  if (!name) return null;

  return (
    <div className="flex items-center gap-2">
      {inspectRecordsHref && (
        <Button variant="link" size="sm" asChild>
          <Link href={inspectRecordsHref} className="inline-flex items-center gap-1">
            Inspect Records
            <ScanSearch size={12} />
          </Link>
        </Button>
      )}
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
