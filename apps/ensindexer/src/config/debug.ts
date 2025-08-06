import { serializeRedactedENSIndexerConfig } from "./serialize";
import { ENSIndexerConfig } from "./types";

/**
 * A replacer function to be used with `JSON.stringify` for
 * {@link ENSIndexerConfig} object.
 *
 * It truncates the ABI objects that otherwise would become very long strings,
 * and serializes URL objects.
 */
function ENSIndexerConfigJSONReplacer(key: string, value: unknown) {
  // stringify a URL object
  if (value instanceof URL) {
    return value.href;
  }

  // truncate ABI value
  if (key === "abi") {
    return `(truncated ABI output)`;
  }

  // pass-through value
  return value;
}

/**
 * Pretty print {@link ENSIndexerConfig} object.
 *
 * Invariant:
 * - All sensitive values are redacted before printing a string representation
 *   of the config into stdout.
 */
export function prettyPrintRedactedConfig(config: ENSIndexerConfig) {
  // Serialized redacted ENSIndexerConfig object.
  const serializedConfig = serializeRedactedENSIndexerConfig(config);

  // Stringify serializedConfig using special replacer function.
  const configString = JSON.stringify(serializedConfig, ENSIndexerConfigJSONReplacer, 2);

  // Finally, print the stringified config into stdout.
  console.log(`ENSIndexer running with config:\n${configString}`);
}
