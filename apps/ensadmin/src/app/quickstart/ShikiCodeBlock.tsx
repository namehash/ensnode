"use client";

import { CopyButton } from "@/components/ui/copy-button";
import { cn } from "@/lib/utils";
import React, { useEffect, useState } from "react";
import { codeToHtml } from "shiki";
import "./shiki-styles.css";

interface ShikiCodeBlockProps {
  language: string;
  children: string;
  className?: string;
  showLineNumbers?: boolean;
}

export function ShikiCodeBlock({
  language,
  children,
  className,
  showLineNumbers = false,
}: ShikiCodeBlockProps) {
  const [highlightedCode, setHighlightedCode] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const highlight = async () => {
      try {
        setIsLoading(true);
        // Normalize language name for shiki
        const normalizedLang =
          language === "javascript"
            ? "javascript"
            : language === "typescript"
              ? "typescript"
              : language === "jsx"
                ? "javascript"
                : language === "tsx"
                  ? "typescript"
                  : language === "shell"
                    ? "bash"
                    : language === "graphql"
                      ? "graphql"
                      : language || "text";

        const html = await codeToHtml(children, {
          lang: normalizedLang,
          theme: "github-light",
          transformers: [
            {
              // Transform the <pre> element
              pre(node) {
                node.properties.className = [
                  ...(node.properties.className || []),
                  "shiki-code-block",
                  showLineNumbers ? "line-numbers" : "",
                ];
                return node;
              },
              line(node, line) {
                if (showLineNumbers) {
                  node.properties["line-number"] = line + 1;
                  node.properties.className = [...(node.properties.className || []), "line"];
                }
                return node;
              },
            },
          ],
        });

        setHighlightedCode(html);
        setIsLoading(false);
      } catch (error) {
        console.error("Error highlighting code:", error);
        setHighlightedCode(null);
        setIsLoading(false);
      }
    };

    highlight();
  }, [children, language, showLineNumbers]);

  // Fallback rendering while highlighter loads or if it fails
  if (isLoading || !highlightedCode) {
    return (
      <div className={cn("relative group rounded-md overflow-hidden bg-muted", className)}>
        <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
          <CopyButton value={children} variant="ghost" size="sm" />
        </div>
        <div className="p-4 overflow-x-auto">
          {showLineNumbers ? (
            <div className="table w-full">
              {children.split("\n").map((line, i) => (
                <div key={i} className="table-row">
                  <span className="table-cell pr-4 text-right opacity-50 select-none">{i + 1}</span>
                  <span className="table-cell">{line}</span>
                </div>
              ))}
            </div>
          ) : (
            <pre className="font-mono text-sm">{children}</pre>
          )}
        </div>
      </div>
    );
  }

  // Render the highlighted code from Shiki
  return (
    <div className={cn("relative group rounded-md overflow-hidden bg-muted", className)}>
      <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
        <CopyButton value={children} variant="ghost" size="sm" />
      </div>
      <div className="p-4 overflow-x-auto w-full">
        <div dangerouslySetInnerHTML={{ __html: highlightedCode }} className="w-full" />
      </div>
    </div>
  );
}
