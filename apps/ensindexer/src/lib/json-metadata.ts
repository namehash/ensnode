import type { LiteralLabel, Name } from "@ensnode/ensnode-sdk";

const POSSIBLE_PREFIXES = [
  "data:application/json;base64,",
  "data:application/json;_base64,", // idk, sometimes 3dns returns this malformed prefix
];

/**
 * Parses a base64-encoded JSON metadata URI into a JSON object.
 */
function parseOnChainMetadata(uri: string) {
  if (!POSSIBLE_PREFIXES.some((prefix) => uri.startsWith(prefix))) return null;

  const base64String = POSSIBLE_PREFIXES.reduce((memo, prefix) => memo.replace(prefix, ""), uri);
  const jsonString = Buffer.from(base64String, "base64").toString("utf-8");

  return JSON.parse(jsonString);
}

/**
 * Parses a base64-encoded JSON metadata URI to extract the label and name.
 *
 * @param uri - The base64-encoded JSON metadata URI string
 * @returns A tuple containing [label, name] if parsing succeeds, or [null, null] if it fails
 */
export function parseLabelAndNameFromOnChainMetadata(
  uri: string,
): [LiteralLabel, Name] | [null, null] {
  const metadata = parseOnChainMetadata(uri);
  if (!metadata) return [null, null];

  // trim the . off the end of the fqdn
  const name = metadata?.name?.slice(0, -1);
  if (!name) return [null, null];

  const [label] = name.split(".");

  return [label, name];
}
