import type { PonderAppLog, PonderAppLogger } from "../ponder-app-logger";

/**
 * Represents a primitive value type that can be logged directly
 * without formatting.
 */
type Primitive = string | number | boolean | bigint | symbol | null | undefined;

/**
 * Type guard helper to check if a value is a primitive type.
 *
 * Used with {@link formatLogValue}.
 */
function isPrimitive(value: unknown): value is Primitive {
  return value === null || (typeof value !== "object" && typeof value !== "function");
}

/**
 * JSON replacer function that handles special types for serialization.
 * - bigints are converted to strings
 * - URL objects are converted to their href string
 * - Map objects are converted to plain objects
 * - Set objects are converted to arrays
 *
 * Used with {@link formatLogValue}.
 */
function replacer(_key: string, value: unknown): unknown {
  // stringify bigints
  if (typeof value === "bigint") return value.toString();

  // stringify a URL object
  if (value instanceof URL) return value.href;

  // convert Map to plain object for serialization
  if (value instanceof Map) return Object.fromEntries(value);

  // convert Set to array for serialization
  if (value instanceof Set) return Array.from(value);

  // pass-through value
  return value;
}

/**
 * Formats a value for logging.
 * - Primitives and Errors are returned as-is
 * - Objects are JSON stringified with the replacer and collapsed to single line
 *
 * Used with {@link wrapLogMethod} to automatically format log parameters before
 * passing to the underlying logger.
 */
function formatLogValue(value: unknown): unknown {
  // Primitives pass through
  if (isPrimitive(value)) return value;

  // Error instances pass through (handled specially by logger)
  if (value instanceof Error) return value;

  // Otherwise JSON stringify with replacer
  try {
    return JSON.stringify(value, replacer);
  } catch {
    // And if JSON.stringify throws, fall back to String()
    return String(value);
  }
}

/**
 * Wraps a logger method to provide automatic parameter formatting.
 * - Non-Error values in the `error` field are filtered out
 * - Complex values are automatically JSON stringified
 */
function wrapLogMethod<Log extends PonderAppLog>(fn: (options: Log) => void) {
  return (options: Log) => {
    const formattedOptions = Object.fromEntries(
      Object.entries(options)
        // Filter out non-Error values in the `error` field
        .filter(([key, value]) => {
          if (key === "error" && !(value instanceof Error)) return false;
          return true;
        })
        // Format values
        .map(([key, value]) => [key, formatLogValue(value)]),
    ) as Log;

    return fn(formattedOptions);
  };
}

/**
 * Wraps the raw Ponder App Logger provided by the Ponder runtime to
 * automatically format log parameters:
 *
 * - Primitives are passed through as-is
 * - Error instances are passed through as-is (and handled specially by the logger)
 * - Objects are JSON stringified (with special handling for bigint, URL, Map, Set)
 * - Non-Error `error` values are automatically filtered out
 *
 * This maintains full compatibility with the {@link PonderAppLogger} interface.
 */
export function wrapPonderAppLogger(rawLogger: PonderAppLogger): PonderAppLogger {
  return Object.freeze({
    ...rawLogger,
    error: wrapLogMethod(rawLogger.error.bind(rawLogger)),
    warn: wrapLogMethod(rawLogger.warn.bind(rawLogger)),
    info: wrapLogMethod(rawLogger.info.bind(rawLogger)),
    debug: wrapLogMethod(rawLogger.debug.bind(rawLogger)),
    trace: wrapLogMethod(rawLogger.trace.bind(rawLogger)),
  });
}
