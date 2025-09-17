"use client";

import { ExternalLinkWithIcon } from "@/components/external-link-with-icon";
import { Button } from "@/components/ui/button";
import { useNamespaceId } from "@/hooks/useNamespaceId";
import { getExternalEnsAppNameUrl } from "@/lib/namespace-utils";
import { useParams } from "next/navigation";

export default function ActionsNamePage() {
  const params = useParams();
  const name = decodeURIComponent(params.name as string);
  const { data: namespaceId, isLoading } = useNamespaceId();

  const ensAppUrl = namespaceId ? getExternalEnsAppNameUrl(name, namespaceId) : null;

  if (isLoading || !ensAppUrl) return null;

  return (
    <Button variant="link" size="sm" asChild>
      <ExternalLinkWithIcon href={ensAppUrl.toString()}>View in ENS App</ExternalLinkWithIcon>
    </Button>
  );
}
