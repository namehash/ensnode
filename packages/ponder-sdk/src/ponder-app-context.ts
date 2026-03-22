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
 * Ponder app context
 *
 * Represents the internal context of a local Ponder app.
 */
export interface PonderAppContext {
  /**
   * Command used to start the Ponder app.
   */
  command: PonderAppCommand;
}
