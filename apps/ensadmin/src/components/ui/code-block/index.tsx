"use client";

import { CopyButton } from "@/components/ui/copy-button";
import { cn } from "@/lib/utils";
import React from "react";

interface CodeBlockProps {
  language: string;
  children: string;
  className?: string;
  showLineNumbers?: boolean;
}

export function CodeBlock({
  language,
  children,
  className,
  showLineNumbers = false,
}: CodeBlockProps) {
  // Format the code with line numbers if needed
  const formattedCode = showLineNumbers
    ? children.split("\n").map((line, i) => (
        <div key={i} className="table-row">
          <span className="table-cell pr-4 text-right opacity-50 select-none">{i + 1}</span>
          <span className="table-cell">{line}</span>
        </div>
      ))
    : children;

  return (
    <div className={cn("relative group rounded-md overflow-hidden bg-muted", className)}>
      <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <CopyButton value={children} variant="ghost" size="sm" />
      </div>
      <div className="p-4 overflow-x-auto">
        {showLineNumbers ? (
          <div className="table w-full">{formattedCode}</div>
        ) : (
          <pre className="font-mono text-sm">{children}</pre>
        )}
      </div>
    </div>
  );
}
