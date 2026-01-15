import type { PropsWithChildren } from "react";
import * as React from "react";

import { type Name } from "@ensnode/ensnode-sdk";

import { InternalLink } from "@/components/link";
import { useRawConnectionUrlParam } from "@/hooks/use-connection-url-param";

/**
 * Gets the relative path of the internal name details page for a given name.
 */
export function getNameDetailsRelativePath(name: Name): string {
  return `/name?name=${encodeURIComponent(name)}`;
}

interface NameLinkProps {
  name: Name;
  className?: string;
}

/**
 * Displays an ENS name with a link to the internal name detail page that
 * retains the current connection URL parameter if it exists.
 *
 * Can take other components (ex.Avatar) as children
 * and display them alongside the link as one common interaction area.
 */
export function NameLink({ name, className, children }: PropsWithChildren<NameLinkProps>) {
  const { retainCurrentRawConnectionUrlParam } = useRawConnectionUrlParam();
  const href = retainCurrentRawConnectionUrlParam(getNameDetailsRelativePath(name));

  return (
    <InternalLink href={href} className={className}>
      {children}
    </InternalLink>
  );
}
