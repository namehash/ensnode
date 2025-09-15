import { ExternalLink as ExternalLinkIcon } from "lucide-react";
import { ReactNode } from "react";

interface ExternalLinkWithIconProps {
  href: string;
  children: ReactNode;
  className?: string;
}

/**
 * Renders an external link with an external link icon.
 */
export function ExternalLinkWithIcon({ href, children, className }: ExternalLinkWithIconProps) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`flex items-center gap-1 text-blue-600 hover:underline ${className || ""}`}
    >
      {children}
      <ExternalLinkIcon size={12} />
    </a>
  );
}
