import { cn } from "@/lib/utils";
import { PropsWithChildren } from "react";

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
