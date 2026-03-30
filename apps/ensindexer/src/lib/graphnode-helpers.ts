import pRetry from "p-retry";

import type { LabelHash, LiteralLabel } from "@ensnode/ensnode-sdk";
import { type EnsRainbow, ErrorCode, isHealError } from "@ensnode/ensrainbow-sdk";

import { getENSRainbowApiClient } from "@/lib/ensraibow-api-client";

const ensRainbowApiClient = getENSRainbowApiClient();

/**
 * Attempt to heal a labelHash to its original label.
 * It mirrors the `ens.nameByHash` function implemented in GraphNode:
 * https://github.com/graphprotocol/graph-node/blob/3c448de/runtime/test/wasm_test/api_version_0_0_4/ens_name_by_hash.ts#L9-L11
 *
 * ## Transient vs. non-transient errors
 *
 * ENSIndexer calls this function for every indexed ENS event that requires label healing. A single
 * transient failure (e.g. a momentary network blip or a brief ENSRainbow server hiccup) would
 * otherwise crash the ENSIndexer process, forcing a full restart and re-index from the last
 * checkpoint. To avoid this disproportionate impact, transient failures are retried with
 * exponential backoff (up to 3 retries, with backoff delays between 1 and 30 seconds between attempts) before the error is thrown:
 * - Network/fetch failure: heal() throws because the ENSRainbow service was unreachable.
 * - HealServerError (errorCode 500): ENSRainbow returned a transient server-side error.
 *
 * Non-transient outcomes are thrown immediately without retry, because retrying would not change
 * the result:
 * - HealSuccess: the label was healed successfully; returned.
 * - HealNotFoundError (errorCode 404): no label is known for this labelHash; null returned.
 * - HealBadRequestError (errorCode 400): the labelHash is malformed; retrying would not help.
 *
 * ## Non-recoverable throws
 *
 * Any throw from this function is not recoverable or has exceeded the max retries. It propagates to the calling indexing handler
 * (Registry, Registrar, ThreeDNSToken, label-db-helpers) which does not catch it, causing the
 * ENSIndexer process to terminate.
 *
 * @returns the original label if found, or null if not found for the labelHash.
 * @throws if ENSRainbow returns a non-retryable error response (e.g. HealBadRequestError / 400),
 *   or if a transient error (network failure, HealServerError / 500) persists after all retries
 *   are exhausted.
 */
export async function labelByLabelHash(labelHash: LabelHash): Promise<LiteralLabel | null> {
  // Reset at the start of each attempt so that after p-retry exhaustion we can distinguish
  // "last failure was HealServerError" (set) from "last failure was a network throw" (undefined).
  let lastServerError: EnsRainbow.HealServerError | undefined;

  let response: Awaited<ReturnType<typeof ensRainbowApiClient.heal>>;

  try {
    response = await pRetry(
      async () => {
        lastServerError = undefined;
        const result = await ensRainbowApiClient.heal(labelHash);

        if (isHealError(result) && result.errorCode === ErrorCode.ServerError) {
          lastServerError = result;
          throw new Error(result.error);
        }

        return result;
      },
      {
        retries: 3,
        minTimeout: 1_000,
        maxTimeout: 30_000,
        onFailedAttempt({ error, attemptNumber, retriesLeft }) {
          console.warn(
            `ENSRainbow heal failed (attempt ${attemptNumber}): ${error.message}. ${retriesLeft} retries left.`,
          );
        },
      },
    );
  } catch (error) {
    if (lastServerError) {
      // Not recoverable; causes the ENSIndexer process to terminate.
      throw new Error(
        `Error healing labelHash: "${labelHash}". Error (${lastServerError.errorCode}): ${lastServerError.error}.`,
        { cause: error },
      );
    }

    // Not recoverable; causes the ENSIndexer process to terminate.
    if (error instanceof Error) {
      error.message = `ENSRainbow Heal Request Failed: ENSRainbow unavailable at '${ensRainbowApiClient.getOptions().endpointUrl}'.`;
    }

    throw error;
  }

  if (isHealError(response)) {
    if (response.errorCode === ErrorCode.NotFound) return null;

    // Not recoverable; causes the ENSIndexer process to terminate.
    throw new Error(
      `Error healing labelHash: "${labelHash}". Error (${response.errorCode}): ${response.error}.`,
    );
  }

  return response.label as LiteralLabel;
}
