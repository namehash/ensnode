import { useMatches, useSearch } from "@tanstack/react-router";

import type { Name } from "@ensnode/ensnode-sdk";

import { ExternalLinkWithIcon } from "@/components/link";
import { Button } from "@/components/ui/button";
import { useNamespace } from "@/hooks/async/use-namespace";
import { buildExternalEnsAppProfileUrl } from "@/lib/namespace-utils";

export function RouteActions() {
  const matches = useMatches();
  const lastMatch = matches[matches.length - 1];
  const pathname = lastMatch?.pathname || "/";
  const search = useSearch({ strict: false }) as Record<string, any>;

  // Extract name from search params if present
  const nameParam = search?.name;
  const name = nameParam ? (decodeURIComponent(nameParam as string) as Name) : null;

  const { data: namespace } = useNamespace();

  // Name page with "View in ENS App" action
  if (pathname === "/name" && name && namespace) {
    const ensAppProfileUrl = buildExternalEnsAppProfileUrl(name, namespace);
    if (ensAppProfileUrl) {
      return (
        <Button variant="link" size="sm" asChild>
          <ExternalLinkWithIcon href={ensAppProfileUrl.toString()}>
            View in ENS App
          </ExternalLinkWithIcon>
        </Button>
      );
    }
  }

  // Most routes don't have actions
  return null;
}
