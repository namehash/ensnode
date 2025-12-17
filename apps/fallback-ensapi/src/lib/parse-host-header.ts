import type { ConfigTemplateId } from "@ensnode/ensnode-sdk/internal";

/**
 * Parses a Host header value into a ConfigTemplateId
 *
 * @param value the Host header value
 * @returns a ConfigTemplateId or null if not matched
 */
export function parseHostHeader(value: string): ConfigTemplateId | null {
  // host will match a pattern like
  // api.[configTemplateId].[environment].ensnode.io
  const match = value.match(/^api\.([a-z-]+)\./i);
  if (!match) return null;

  return match[1];
}
