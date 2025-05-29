/**
 * A value-type based replacer function for serialization with JSON.stringify
 */
export function jsonStringifyReplacer<V>(key: string, value: V) {
  if (value instanceof Date) return value.toISOString();

  if (typeof value === "bigint") return `${value.toString()}n`;

  return value;
}

/**
 * A value-type based reviver function for parsing with JSON.parse
 */
export function jsonParseReviver<V>(key: string, value: V) {
  const isoDateRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z$/;
  const bigintStringRegex = /^-?\d+n$/;

  if (typeof value === "string") {
    if (isoDateRegex.test(value)) {
      return new Date(value);
    }

    if (bigintStringRegex.test(value)) {
      return BigInt(value.slice(0, -1));
    }
  }

  return value;
}
