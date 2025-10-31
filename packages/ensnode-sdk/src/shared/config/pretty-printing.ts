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
 * Pretty print a JSON object.
 *
 * @param json The JSON object to print
 */
export const prettyPrintJson = (json: any) => JSON.stringify(json, configJSONReplacer, 2);
