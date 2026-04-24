import { waitForEnsRainbowToBeReady } from "@/lib/ensrainbow/singleton";

/**
 * Prepare for executing the "onchain" event handlers.
 *
 * During Ponder startup, the "onchain" event handlers are executed
 * after all "setup" event handlers have completed.
 *
 * This function is useful to make sure any long-running preconditions for
 * onchain event handlers are met, for example, waiting for
 * the ENSRainbow instance to be ready before processing any onchain events
 * that require data from ENSRainbow.
 *
 * @example A single blocking precondition
 * ```ts
 * await waitForEnsRainbowToBeReady();
 * ```
 *
 * @example Multiple blocking preconditions
 * ```ts
 * await Promise.all([
 *   waitForEnsRainbowToBeReady(),
 *   waitForAnotherPrecondition(),
 * ]);
 * ```
 */
export async function initIndexingOnchainEvents(): Promise<void> {
  await waitForEnsRainbowToBeReady();
}
