/**
 * Represents a single log entry for the Ponder app logger.
 *
 * It is a loose object that:
 * - must contain a `msg` property of type string, and
 * - can optionally include an `error` property of type Error, and
 * - can optionally include any additional properties relevant to
 *   the log message. The additional properties can be used to provide more
 *   context about the log message, and will be included in the log output.
 */
export type PonderAppLog = {
  /**
   * Log message
   */
  msg: string;

  /**
   * Optional error object to log.
   *
   * If provided, the logger will log the error's stack trace and message.
   */
  error?: unknown;

  /**
   * Optional additional properties.
   *
   * If provided, they will be included in the log output.
   */
  [key: string]: unknown;
};

/**
 * Ponder app logger
 *
 * Represents the logger provided by the Ponder runtime to a local Ponder app.
 * @see https://github.com/ponder-sh/ponder/blob/6fcc15d4234e43862cb6e21c05f3c57f4c2f7464/packages/core/src/internal/logger.ts#L8-L31
 */
export interface PonderAppLogger {
  /**
   * Logs a message at the "error" level.
   *
   * @param options - The log message and additional properties to log.
   *
   * @example
   * ```ts
   * logger.error({
   *   msg: "Incorrect omnichain status",
   *   error: new Error("The omnichain status must be either 'omnichain-backfill' or 'omnichain-following'"),
   *    expected: "omnichain-backfill or omnichain-following",
   *    actual: "omnichain-unstarted"
   * });
   *
   * logger.error({
   *   msg: "Incorrect omnichain status",
   *   error: new Error("The omnichain status must be either 'omnichain-backfill' or 'omnichain-following'"),
   * });
   *
   * logger.error({
   *   msg: "The omnichain status must be either 'omnichain-backfill' or 'omnichain-following'"
   * });
   * ```
   */
  error<T extends PonderAppLog>(options: T): void;

  /**
   * Logs a message at the "warn" level.
   *
   * @param options - The log message and additional properties to log.
   *
   * @example
   * ```ts
   * logger.warn({
   *   msg: "Both the '${PluginName.Subgraph}' and '${PluginName.ENSv2}' plugins are enabled.",
   *   effects: "This results in the availability of both the legacy Subgraph-Compatible GraphQL API (/subgraph) _and_ ENSNode's Omnigraph API (/api/omnigraph), and comes with an associated increase in indexing time. If your intent is to have both APIs available in parallel, excellent, otherwise you may benefit from only enabling the plugin for the API you plan to use."
   * });
   *
   * logger.warn({
   *   msg: "Both the '${PluginName.Subgraph}' and '${PluginName.ENSv2}' plugins are enabled."
   * });
   * ```
   */
  warn<T extends PonderAppLog>(options: T): void;

  /**
   * Logs a message at the "info" level.
   * @param options
   *
   * @example
   * ```ts
   * logger.info({
   *   msg: "An informational message",
   *   details: "Here are some details about the info"
   * });
   * ```
   */
  info<T extends PonderAppLog>(options: T): void;

  /**
   * Logs a message at the "debug" level.
   * @param options
   *
   * @example
   * ```ts
   * logger.debug({
   *   msg: "A debug message",
   *   arg1: "Here is some debug information about arg1",
   *   arg2: "Here is some debug information about arg2"
   * });
   * ```
   */
  debug<T extends PonderAppLog>(options: T): void;

  /**
   * Logs a message at the "trace" level.
   * @param options
   *
   * @example
   * ```ts
   * logger.trace({
   *   msg: "A trace message",
   *   detailA: "Here are some details about the trace message",
   *   detailB: "Here are some more details about the trace message"
   * });
   * ```
   */
  trace<T extends PonderAppLog>(options: T): void;
}
