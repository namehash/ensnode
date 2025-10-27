import type { PropsWithChildren } from "react";

import { cn } from "@/lib/utils";

export function CodeBlock({ children, className }: PropsWithChildren<{ className?: string }>) {
  return (
    <pre
      className={cn(
        "bg-muted font-mono text-sm p-4 overflow-auto whitespace-pre break-normal overflow-x-auto",
        className,
      )}
    >
      {children}
    </pre>
  );
}
