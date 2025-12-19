import type { ConfigTemplateId } from "@ensnode/ensnode-sdk/internal";

/**
 * Parses a Host header value into a ConfigTemplateId.
 *
 * NOTE: This logic is specifically tailored for NameHash hosted ENSNode deployments, and MAY or
 * MAY NOT generalize to other host header values.
 *
 * @param value the Host header value
 * @returns a ConfigTemplateId or null if not matched
 */
export function parseHostHeader(value: string): ConfigTemplateId | null {
  // will match a pattern like
  // api.[configTemplateId].*
  const match = value.match(/^api\.([a-z-]+)\./i);
  if (!match) return null;

  return match[1];
}
