/**
 * A replacer function to be used with `JSON.stringify` for configuration objects.
 *
 * It handles common patterns like:
 * - Stringifying URL objects
 * - Truncating large ABI objects
 * - Converting Map objects to plain objects for serialization
 */
function configJSONReplacer(key: string, value: unknown): unknown {
  // stringify a URL object
  if (value instanceof URL) return value.href;

  // truncate ABI value
  if (key === "abi") return "(truncated ABI output)";

  // convert Map to plain object for serialization
  if (value instanceof Map) return Object.fromEntries(value);

  // convert Set to array for serialization
  if (value instanceof Set) return Array.from(value);

  // pass-through value
  return value;
}

/**
 * Stringify a config object.
 *
 * @param json The config object to print
 * @param options.pretty Whether to pretty print the JSON output. Defaults to false (minified).
 * @returns The JSON string representation of the config object
 */
export const stringifyConfig = (json: any, options: { pretty: boolean } = { pretty: false }) =>
  JSON.stringify(json, configJSONReplacer, options.pretty ? 2 : undefined);
