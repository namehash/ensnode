import { Link } from "@tanstack/react-router";
import { ExternalLink as ExternalLinkIcon } from "lucide-react";
import type { PropsWithChildren } from "react";

interface LinkProps {
  href: string;
  className?: string;
}

/**
 * Renders an internal link.
 */
export function InternalLink({
  href,
  className,
  children,
}: PropsWithChildren<LinkProps>) {
  return (
    <Link
      to={href}
      className={` text-blue-600 hover:underline ${className || ""}`}
    >
      {children}
    </Link>
  );
}

/**
 * Renders an external link that opens in a new tab.
 */
export function ExternalLink({
  href,
  className,
  children,
}: PropsWithChildren<LinkProps>) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={` inline-flex items-center gap-1 text-blue-600 hover:underline ${
        className || ""
      }`}
    >
      {children}
    </a>
  );
}

/**
 * Renders an external link with an external link icon.
 */
export function ExternalLinkWithIcon({
  href,
  className,
  children,
}: PropsWithChildren<LinkProps>) {
  return (
    <ExternalLink href={href} className={className}>
      {children}
      <ExternalLinkIcon size={12} />
    </ExternalLink>
  );
}
