"use client";

import { CheckIcon, CopyIcon } from "lucide-react";
import { useTheme } from "next-themes";
import React, { useEffect, useState } from "react";
import { Highlighter, Lang, getHighlighter } from "shiki";

// Cache the highlighter to avoid creating it multiple times
let highlighterPromise: Promise<Highlighter> | null = null;

async function getOrCreateHighlighter(): Promise<Highlighter> {
  if (!highlighterPromise) {
    highlighterPromise = getHighlighter({
      themes: ["github-dark", "github-light"],
      langs: ["graphql", "javascript", "typescript", "json", "bash", "html", "css"],
    });
  }
  return highlighterPromise;
}

interface CodeSnippetProps {
  code: string;
  language?: Lang;
  filename?: string;
  showLineNumbers?: boolean;
  className?: string;
  copyable?: boolean;
}

export function CodeSnippet({
  code,
  language = "typescript",
  filename,
  showLineNumbers = true,
  className = "",
  copyable = true,
}: CodeSnippetProps) {
  const [highlightedCode, setHighlightedCode] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [isCopied, setIsCopied] = useState(false);
  const { resolvedTheme } = useTheme();
  const theme = resolvedTheme === "dark" ? "github-dark" : "github-light";

  useEffect(() => {
    let isMounted = true;

    const highlight = async () => {
      try {
        setIsLoading(true);
        const highlighter = await getOrCreateHighlighter();
        const html = highlighter.codeToHtml(code, { lang: language, theme });

        if (isMounted) {
          // Add line numbers if requested
          let processedHtml = html;
          if (showLineNumbers) {
            const codeContent = html.match(/<code>([\s\S]*?)<\/code>/)?.[1] || "";
            const lines = codeContent.split("\n");
            const lineCount = lines.length;
            const lineNumbersHtml = Array.from(
              { length: lineCount },
              (_, i) => `<span class="line-number" data-line="${i + 1}"></span>`,
            ).join("");

            processedHtml = html.replace(
              "<code>",
              `<code><div class="line-numbers">${lineNumbersHtml}</div>`,
            );
          }

          setHighlightedCode(processedHtml);
          setIsLoading(false);
        }
      } catch (error) {
        console.error("Error highlighting code:", error);
        if (isMounted) {
          setIsLoading(false);
          // Fallback to plaintext
          setHighlightedCode(`<pre class="shiki"><code>${escapeHtml(code)}</code></pre>`);
        }
      }
    };

    highlight();

    return () => {
      isMounted = false;
    };
  }, [code, language, theme, showLineNumbers]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  if (isLoading) {
    return (
      <div
        className={`animate-pulse bg-gray-200 dark:bg-gray-700 rounded-md ${className}`}
        style={{ minHeight: "100px" }}
      />
    );
  }

  return (
    <div className={`code-snippet-container ${className}`}>
      {filename && (
        <div className="code-snippet-header">
          <span className="filename">{filename}</span>
        </div>
      )}
      <div className="code-snippet-content relative group">
        <div className="shiki-container" dangerouslySetInnerHTML={{ __html: highlightedCode }} />

        {copyable && (
          <button className="copy-button" onClick={handleCopy} aria-label="Copy code">
            {isCopied ? <CheckIcon className="h-4 w-4" /> : <CopyIcon className="h-4 w-4" />}
          </button>
        )}
      </div>

      <style jsx global>{`
        .code-snippet-container {
          border-radius: 0.5rem;
          overflow: hidden;
          border: 1px solid #e2e8f0;
          margin: 1rem 0;
        }
        
        .dark .code-snippet-container {
          border-color: #2d3748;
        }
        
        .code-snippet-header {
          padding: 0.5rem 1rem;
          background-color: #f7fafc;
          border-bottom: 1px solid #e2e8f0;
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
          font-size: 0.875rem;
          color: #4a5568;
        }
        
        .dark .code-snippet-header {
          background-color: #1a202c;
          border-color: #2d3748;
          color: #a0aec0;
        }
        
        .code-snippet-content {
          position: relative;
          overflow: auto;
        }
        
        .shiki-container {
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
          font-size: 0.875rem;
          line-height: 1.7;
        }
        
        .shiki-container pre {
          margin: 0 !important;
          padding: 1rem !important;
          overflow: auto;
        }
        
        .line-numbers {
          counter-reset: line;
          position: absolute;
          left: 0;
          top: 0;
          width: 2.5rem;
          text-align: right;
          user-select: none;
          padding-top: 1rem;
          padding-right: 1rem;
          color: #a0aec0;
        }
        
        .dark .line-numbers {
          color: #4a5568;
        }
        
        .line-number {
          counter-increment: line;
          display: block;
          height: 1.7em;
        }
        
        .line-number:before {
          content: counter(line);
        }
        
        .copy-button {
          position: absolute;
          top: 0.5rem;
          right: 0.5rem;
          padding: 0.25rem;
          background-color: rgba(255, 255, 255, 0.8);
          color: #4a5568;
          border-radius: 0.25rem;
          border: 1px solid #e2e8f0;
          cursor: pointer;
          opacity: 0;
          transition: opacity 0.2s ease;
        }
        
        .dark .copy-button {
          background-color: rgba(26, 32, 44, 0.8);
          color: #a0aec0;
          border-color: #2d3748;
        }
        
        .code-snippet-content:hover .copy-button {
          opacity: 1;
        }
        
        .copy-button:hover {
          background-color: rgba(255, 255, 255, 1);
        }
        
        .dark .copy-button:hover {
          background-color: rgba(26, 32, 44, 1);
        }
      `}</style>
    </div>
  );
}

// Helper function to escape HTML
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
