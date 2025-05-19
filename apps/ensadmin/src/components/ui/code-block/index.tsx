"use client";

import { CopyButton } from "@/components/ui/copy-button";
import { cn } from "@/lib/utils";
import React, { useEffect, useState } from "react";
// Import Shiki for syntax highlighting
import { Highlighter, getHighlighter } from "shiki";
import "./styles.css";

interface CodeBlockProps {
  language: string;
  children: string;
  className?: string;
  showLineNumbers?: boolean;
}

// Cache the highlighter instance to avoid creating it multiple times
let highlighterCache: Highlighter | null = null;
const initHighlighter = async () => {
  if (!highlighterCache) {
    highlighterCache = await getHighlighter({
      themes: ["github-light"],
      langs: [
        // Support a wide range of programming languages
        "javascript",
        "typescript",
        "jsx",
        "tsx",
        "json",
        "bash",
        "graphql",
        "css",
        "html",
        "markdown",
        "yaml",
        "sql",
        "shell",
        "rust",
        "python",
        "go",
        "java",
        "ruby",
        "php",
        "c",
        "cpp",
        "csharp",
        "swift",
        "kotlin",
        "xml",
        "diff",
        "dockerfile",
        "toml",
      ],
    });
  }
  return highlighterCache;
};

export function CodeBlock({
  language,
  children,
  className,
  showLineNumbers = false,
}: CodeBlockProps) {
  // State to store the highlighted HTML output from Shiki
  const [highlightedCode, setHighlightedCode] = useState<string | null>(null);
  // Always use light theme for code blocks
  const theme = "github-light";

  useEffect(() => {
    // Handle syntax highlighting
    const highlight = async () => {
      try {
        const highlighter = await initHighlighter();
        const lang = language || "text";

        // Normalize language name for shiki
        // Shiki uses different naming conventions for some languages
        const normalizedLang =
          lang === "javascript"
            ? "js"
            : lang === "typescript"
              ? "ts"
              : lang === "jsx"
                ? "js"
                : lang === "tsx"
                  ? "ts"
                  : lang === "shell"
                    ? "bash"
                    : lang === "csharp"
                      ? "cs"
                      : lang === "cpp"
                        ? "c++"
                        : lang;

        // Fallback to plain text if language isn't supported
        const supportedLanguage = highlighter.getLoadedLanguages().includes(normalizedLang)
          ? normalizedLang
          : "text";

        const highlighted = highlighter.codeToHtml(children, {
          lang: supportedLanguage,
          theme: theme,
          transformers: [
            {
              // Transform the <pre> element
              pre(node) {
                node.properties.className = [
                  ...(node.properties.className || []),
                  "shiki-code-block",
                  "font-mono",
                  "text-sm",
                  "whitespace-pre",
                  "m-0",
                  "p-0",
                  "bg-transparent",
                  `language-${normalizedLang}`,
                ];
                // Add data attribute for line numbers styling
                if (showLineNumbers) {
                  node.properties["data-line-numbers"] = true;
                }
                return node;
              },
              // Transform the <code> element
              code(node) {
                node.properties.className = [...(node.properties.className || []), "block"];
                return node;
              },
              // Transform each line for line numbering
              line(node) {
                if (showLineNumbers) {
                  // Add line number as data attribute
                  const lineNumber = node.properties?.["data-line"];
                  node.properties.className = [...(node.properties.className || []), "table-row"];
                  node.properties["data-line"] = lineNumber;
                }
                return node;
              },
              // Transform individual tokens (no changes needed)
              token(token) {
                return token;
              },
            },
          ],
        });

        setHighlightedCode(highlighted);
      } catch (error) {
        console.error("Error highlighting code:", error);
        setHighlightedCode(null);
      }
    };

    highlight();
  }, [children, language, showLineNumbers]);

  // Fallback rendering while highlighter loads or if it fails
  if (!highlightedCode) {
    // Show a basic code block while Shiki is initializing
    return (
      <div className={cn("relative group rounded-md overflow-hidden bg-muted", className)}>
        <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity">
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
      <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <CopyButton value={children} variant="ghost" size="sm" />
      </div>
      <div className="p-4 overflow-x-auto">
        {showLineNumbers ? (
          <div className="table w-full" dangerouslySetInnerHTML={{ __html: highlightedCode }} />
        ) : (
          <div dangerouslySetInnerHTML={{ __html: highlightedCode }} />
        )}
      </div>
    </div>
  );
}
