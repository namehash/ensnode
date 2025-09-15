"use client";

import { ExternalLinkWithIcon } from "@/components/external-link-with-icon";
import { Button } from "@/components/ui/button";
import { getExternalEnsAppNameUrl } from "@/lib/namespace-utils";
import { ENSNamespaceIds } from "@ensnode/datasources";
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
    <Button variant="link" size="sm" asChild>
      <ExternalLinkWithIcon href={ensAppUrl.toString()}>View in ENS App</ExternalLinkWithIcon>
    </Button>
  );
}
