import { Highlighter, Lang, getHighlighter } from "shiki";

// Cache the highlighter to avoid creating it multiple times
let highlighterPromise: Promise<Highlighter> | null = null;

/**
 * Get or create a Shiki highlighter instance
 */
export async function getOrCreateHighlighter(): Promise<Highlighter> {
  if (!highlighterPromise) {
    highlighterPromise = getHighlighter({
      themes: ["github-dark", "github-light"],
      langs: ["graphql", "javascript", "json"],
    });
  }
  return highlighterPromise;
}

/**
 * Highlight code using Shiki
 *
 * @param code - The code to highlight
 * @param language - The language of the code (defaults to 'graphql')
 * @param theme - The theme to use for highlighting (defaults to 'github-dark')
 * @returns The highlighted HTML
 */
export async function highlightCode(
  code: string,
  language: Lang = "graphql",
  theme: string = "github-dark",
): Promise<string> {
  try {
    const highlighter = await getOrCreateHighlighter();
    return highlighter.codeToHtml(code, { lang: language, theme });
  } catch (error) {
    console.error("Failed to highlight code:", error);
    return escapeHtml(code);
  }
}

/**
 * Escape HTML special characters to prevent XSS
 */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Extract the language from a code string containing a language comment
 * Example: "# language=graphql\nquery { user { id } }"
 */
export function extractLanguage(code: string): { code: string; language: Lang } {
  const languageRegex = /^#\s*language=(\w+)\s*\n/;
  const match = code.match(languageRegex);

  if (match && match[1]) {
    const language = match[1] as Lang;
    return {
      code: code.replace(languageRegex, ""),
      language,
    };
  }

  return { code, language: "graphql" };
}
