"use client";

import { Button } from "@/components/ui/button";
import { getExternalEnsAppNameUrl } from "@/lib/namespace-utils";
import { ENSNamespaceIds } from "@ensnode/datasources";
import { ExternalLink } from "lucide-react";
import { useParams } from "next/navigation";

export default function ActionsNamePage() {
  const params = useParams();
  const name = decodeURIComponent(params.name as string);

  // TODO: Get the namespace from the active ENSNode connection
  // For now, defaulting to Mainnet
  const namespaceId = ENSNamespaceIds.Mainnet;
  const ensAppUrl = getExternalEnsAppNameUrl(name, namespaceId);

  if (!ensAppUrl) return null;

  return (
    <Button variant="outline" size="sm" asChild>
      <a
        href={ensAppUrl.toString()}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-1"
      >
        View in ENS App
        <ExternalLink size={14} />
      </a>
    </Button>
  );
}
