"use client";

import { ExternalLinkWithIcon } from "@/components/external-link-with-icon";
import { Button } from "@/components/ui/button";
import { useNamespaceId } from "@/hooks/use-namespace-id";
import { getExternalEnsAppNameUrl } from "@/lib/namespace-utils";
import { useParams } from "next/navigation";

// TODO BEFORE MERGE, NEED TO REFACTOR LAYOUT PROVIDERS
export default function ActionsNamePage() {
  return null;
  // const params = useParams();
  // const name = decodeURIComponent(params.name as string);

  // const { data: namespaceId, isLoading: namespaceLoading } = useNamespaceId();
  // const ensAppUrl = getExternalEnsAppNameUrl(name, namespaceId);

  // if (namespaceLoading || !ensAppUrl) return null;

  // return (
  //   <Button variant="link" size="sm" asChild>
  //     <ExternalLinkWithIcon href={ensAppUrl.toString()}>
  //       View in ENS App
  //     </ExternalLinkWithIcon>
  //   </Button>
  // );
}
