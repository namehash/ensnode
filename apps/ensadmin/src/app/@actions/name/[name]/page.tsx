"use client";

import { ExternalLinkWithIcon } from "@/components/external-link-with-icon";
import { Button } from "@/components/ui/button";
import { useENSAppProfileUrl } from "@/hooks/async/use-ens-app-profile-url";
import { useParams } from "next/navigation";

export default function ActionsNamePage() {
  const { name } = useParams<{ name: string }>();

  const { data: ensAppProfileUrl } = useENSAppProfileUrl(name);

  if (!ensAppProfileUrl) return null;

  return (
    <Button variant="link" size="sm" asChild>
      <ExternalLinkWithIcon href={ensAppProfileUrl.toString()}>
        View in ENS App
      </ExternalLinkWithIcon>
    </Button>
  );
}
