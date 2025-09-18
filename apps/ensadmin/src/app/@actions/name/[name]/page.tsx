"use client";

import { ExternalLinkWithIcon } from "@/components/external-link-with-icon";
import { Button } from "@/components/ui/button";
import { useENSAppNameUrl } from "@/hooks/use-ens-app-name-url";
import { useParams } from "next/navigation";

export default function ActionsNamePage() {
  const { name } = useParams<{ name: string }>();

  const { data: ensAppUrl } = useENSAppNameUrl(name);

  if (!ensAppUrl) return null;

  return (
    <Button variant="link" size="sm" asChild>
      <ExternalLinkWithIcon href={ensAppUrl.toString()}>View in ENS App</ExternalLinkWithIcon>
    </Button>
  );
}
