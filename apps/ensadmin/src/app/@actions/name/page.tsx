"use client";

import { ExternalLinkWithIcon } from "@/components/link";
import { Button } from "@/components/ui/button";
import { useENSAppProfileUrl } from "@/hooks/async/use-ens-app-profile-url";
import type { Name } from "@ensnode/ensnode-sdk";
import { useSearchParams } from "next/navigation";

export default function ActionsNamePage() {
  const searchParams = useSearchParams();
  const nameParam = searchParams.get("name");

  const name = nameParam ? decodeURIComponent(nameParam as Name) : null;

  const { data: ensAppProfileUrl } = useENSAppProfileUrl(name ?? "");

  if (!name || !ensAppProfileUrl) return null;

  return (
    <Button variant="link" size="sm" asChild>
      <ExternalLinkWithIcon href={ensAppProfileUrl.toString()}>
        View in ENS App
      </ExternalLinkWithIcon>
    </Button>
  );
}
