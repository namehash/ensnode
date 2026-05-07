import { deserializePonderAppContext, type PonderAppContext } from "@ensnode/ponder-sdk";

if (!globalThis.PONDER_COMMON) {
  throw new Error("PONDER_COMMON must be defined by Ponder at runtime as a global variable.");
}

/**
 * Local Ponder app context
 *
 * Represents the {@link PonderAppContext} object provided by Ponder runtime to
 * the local Ponder app. Useful for accessing internal Ponder app configuration
 * and utilities such as the logger.
 */
export const localPonderContext = deserializePonderAppContext(globalThis.PONDER_COMMON);
