import type { PonderAppLogger } from "./ponder-app-logger";

/**
 * Ponder app commands
 *
 * Represents the commands that can be used to start a Ponder app.
 */
export const PonderAppCommands = {
  Dev: "dev",
  Start: "start",
} as const;

export type PonderAppCommand = (typeof PonderAppCommands)[keyof typeof PonderAppCommands];

/**
 * Ponder shutdown manager runtime shape.
 *
 * Mirrors `ponder/src/internal/shutdown.ts` — the object Ponder publishes
 * on `globalThis.PONDER_COMMON.{shutdown,apiShutdown}`. Reload-scoped:
 * Ponder kills and replaces these on every dev-mode hot reload, so
 * consumers must always read the current instance fresh and never cache
 * a captured reference.
 */
export interface PonderAppShutdownManager {
  add: (callback: () => undefined | Promise<unknown>) => void;
  isKilled: boolean;
  abortController: AbortController;
}

export function isPonderAppShutdownManager(value: unknown): value is PonderAppShutdownManager {
  if (typeof value !== "object" || value === null) return false;
  const obj = value as Record<string, unknown>;
  return (
    typeof obj.add === "function" &&
    typeof obj.isKilled === "boolean" &&
    obj.abortController instanceof AbortController
  );
}

/**
 * Ponder app context
 *
 * Represents the internal context of a local Ponder app.
 */
export interface PonderAppContext {
  /**
   * Command used to start the Ponder app.
   */
  command: PonderAppCommand;

  /**
   * URL of the local Ponder app.
   */
  localPonderAppUrl: URL;

  /**
   * Logger provided by the Ponder runtime
   */
  logger: PonderAppLogger;
}
