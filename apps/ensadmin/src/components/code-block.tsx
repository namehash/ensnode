import { cn } from "@/lib/utils";
import { PropsWithChildren } from "react";

export function CodeBlock({ children, className }: PropsWithChildren<{ className?: string }>) {
  return (
    <pre
      className={cn(
        className,
        "bg-muted font-mono text-sm p-4 rounded overflow-auto whitespace-pre break-normal overflow-x-auto",
      )}
    >
      {children}
    </pre>
  );
}
