"use client";

import { highlightCode } from "@/lib/shiki-highlighter";
import { useTheme } from "next-themes";
import React, { useEffect, useState } from "react";
import { Lang } from "shiki";

interface ShikiHighlightProps {
  code: string;
  language?: Lang;
  className?: string;
  style?: React.CSSProperties;
  lineNumbers?: boolean;
}

export function ShikiHighlight({
  code,
  language = "graphql",
  className = "",
  style,
  lineNumbers = false,
}: ShikiHighlightProps) {
  const [highlightedCode, setHighlightedCode] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const { resolvedTheme } = useTheme();
  const theme = resolvedTheme === "dark" ? "github-dark" : "github-light";

  useEffect(() => {
    let isMounted = true;

    const highlight = async () => {
      try {
        setIsLoading(true);
        const html = await highlightCode(code, language, theme);

        if (isMounted) {
          setHighlightedCode(html);
          setIsLoading(false);
        }
      } catch (error) {
        console.error("Error highlighting code:", error);
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    highlight();

    return () => {
      isMounted = false;
    };
  }, [code, language, theme]);

  if (isLoading) {
    return (
      <div
        className={`animate-pulse bg-gray-200 dark:bg-gray-700 rounded p-4 ${className}`}
        style={{ ...style, minHeight: "100px" }}
      />
    );
  }

  // Apply line numbers if requested
  let finalHtml = highlightedCode;
  if (lineNumbers) {
    // Extract the code content and add line numbers
    const codeContent = highlightedCode.match(/<code>([\s\S]*?)<\/code>/)?.[1] || "";
    const lines = codeContent.split("\n");
    const numberedLines = lines
      .map((line, i) => `<span class="line-number">${i + 1}</span>${line}`)
      .join("\n");

    finalHtml = highlightedCode.replace(
      /<code>([\s\S]*?)<\/code>/,
      `<code><div class="line-numbers">${numberedLines}</div></code>`,
    );
  }

  return (
    <div
      className={`shiki-highlight ${className}`}
      style={style}
      dangerouslySetInnerHTML={{ __html: finalHtml }}
    />
  );
}

// Additional component for highlighting variables (JSON)
export function JsonHighlight({
  json,
  className = "",
  style,
  lineNumbers = false,
}: Omit<ShikiHighlightProps, "code" | "language"> & { json: any }) {
  let formattedJson = "";

  try {
    if (typeof json === "string") {
      // Try to parse if it's a JSON string
      try {
        const parsedJson = JSON.parse(json);
        formattedJson = JSON.stringify(parsedJson, null, 2);
      } catch {
        // If it's not valid JSON, use the original string
        formattedJson = json;
      }
    } else {
      // If it's already an object, stringify it
      formattedJson = JSON.stringify(json, null, 2);
    }
  } catch (error) {
    console.error("Error processing JSON:", error);
    formattedJson = String(json);
  }

  return (
    <ShikiHighlight
      code={formattedJson}
      language="json"
      className={className}
      style={style}
      lineNumbers={lineNumbers}
    />
  );
}

// Additional component for GraphQL queries
export function GraphQLHighlight({
  query,
  className = "",
  style,
  lineNumbers = false,
}: Omit<ShikiHighlightProps, "code" | "language"> & { query: string }) {
  return (
    <ShikiHighlight
      code={query}
      language="graphql"
      className={className}
      style={style}
      lineNumbers={lineNumbers}
    />
  );
}

// Add some basic styles for line numbers
export function ShikiStyles() {
  return (
    <style jsx global>{`
      .shiki-highlight {
        position: relative;
        border-radius: 0.375rem;
        overflow: auto;
      }
      
      .shiki-highlight pre {
        margin: 0;
        padding: 1rem;
        overflow: auto;
      }
      
      .shiki-highlight .line-numbers {
        counter-reset: line;
      }
      
      .shiki-highlight .line-number {
        display: inline-block;
        width: 2.5rem;
        text-align: right;
        color: #888;
        margin-right: 1rem;
        user-select: none;
      }
    `}</style>
  );
}
