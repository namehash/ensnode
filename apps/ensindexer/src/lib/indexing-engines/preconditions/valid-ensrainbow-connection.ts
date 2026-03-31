import pRetry from "p-retry";

import {
  type CrossChainIndexingStatusSnapshot,
  type EnsRainbowPublicConfig,
  OmnichainIndexingStatusIds,
} from "@ensnode/ensnode-sdk";

import { ensDbClient } from "@/lib/ensdb/singleton";
import { ensRainbowClient, waitForEnsRainbowToBeReady } from "@/lib/ensrainbow/singleton";

/**
 * Invariant: The omnichain indexing status must be `Unstarted` before we can
 * upsert the ENSRainbow public config into ENSDb.
 *
 * @throws Error if the invariant is violated.
 */
function invariant_indexingStatusUnstarted(
  indexingStatusSnapshot: CrossChainIndexingStatusSnapshot,
): void {
  const { omnichainStatus } = indexingStatusSnapshot.omnichainSnapshot;

  if (omnichainStatus !== OmnichainIndexingStatusIds.Unstarted) {
    throw new Error(
      `The omnichain indexing status must be '${OmnichainIndexingStatusIds.Unstarted}' to upsert the ENSRainbow public config into ENSDb. Provided status: '${omnichainStatus}'.`,
    );
  }
}

/**
 * Invariant: The label set IDs in the stored and fetched
 * ENSRainbow public config objects must be the same.
 *
 * @throws Error if the invariant is violated.
 */
function invariant_labelSetIdCompatibility(
  storedConfig: EnsRainbowPublicConfig,
  fetchedConfig: EnsRainbowPublicConfig,
): void {
  const storedLabelSetId = storedConfig.labelSet.labelSetId;
  const fetchedLabelSetId = fetchedConfig.labelSet.labelSetId;

  if (storedLabelSetId !== fetchedLabelSetId) {
    throw new Error(
      `Label set IDs must be the same. Provided label set ID in stored config: '${storedLabelSetId}' and label set ID in fetched config: '${fetchedLabelSetId}'.`,
    );
  }
}

/**
 * The highest label set version in the fetched ENSRainbow public config must be
 * lower than or equal to the highest label set version in the stored ENSRainbow
 * public config.
 *
 * This invariant is necessary to ensure that we don't run indexing logic with
 * two incompatible versions of the label set, which could lead to
 * incorrect indexing results.
 *
 * @throws Error if the invariant is violated.
 */
function invariant_highestLabelSetVersionCompatibility(
  storedConfig: EnsRainbowPublicConfig,
  fetchedConfig: EnsRainbowPublicConfig,
): void {
  const storedHighestLabelSetVersion = storedConfig.labelSet.highestLabelSetVersion;
  const fetchedHighestLabelSetVersion = fetchedConfig.labelSet.highestLabelSetVersion;

  if (storedHighestLabelSetVersion > fetchedHighestLabelSetVersion) {
    throw new Error(
      `The highest label set version in the fetched config ('${fetchedHighestLabelSetVersion}') must be greater than or equal to the highest label set version in the stored config ('${storedHighestLabelSetVersion}').`,
    );
  }
}

/**
 * Get validated ENSRainbow Public Config to be stored in ENSDb.
 *
 * This function needs to be run after ensuring that ENSRainbow is ready to
 * serve HTTP requests.
 *
 * @param storedConfig The ENSRainbow Public Config stored in ENSDb,
 *                     may be undefined if no config is stored yet.
 * @returns The validated ENSRainbow Public Config object to be stored in ENSDb:
 *          1) If there is no stored config, returns the fetched config from ENSRainbow.
 *          2) If there is a stored config, returns the fetched config from ENSRainbow
 *             if it's compatible with the stored config.
 * @throws Error if fetching the ENSRainbow Public Config fails, or
 *         if the fetched config is not compatible with the stored config
 *         (if it exists), or if the invariant on the omnichain indexing status
 *         is violated when there is no stored config.
 */
async function getValidatedEnsRainbowPublicConfig(
  storedConfig: EnsRainbowPublicConfig | undefined,
): Promise<EnsRainbowPublicConfig> {
  const fetchedConfig = await ensRainbowClient.config();

  if (!fetchedConfig) {
    throw new Error("ENSRainbow Public Config is missing from the response.");
  }

  // Validate the fetched config compatibility with the stored one,
  // if the stored config exists.
  if (storedConfig) {
    invariant_labelSetIdCompatibility(storedConfig, fetchedConfig);
    invariant_highestLabelSetVersionCompatibility(storedConfig, fetchedConfig);
  }

  return fetchedConfig;
}

/**
 * Ensure that we have a valid connection to ENSRainbow and
 * a compatible ENSRainbow Public Config in ENSDb.
 *
 * All steps in this function are necessary preconditions before
 * we can start executing "onchain" event handlers.
 *
 * Successfully completing this function means that:
 * 1) ENSRainbow instance is ready to serve HTTP requests, and
 * 2) ENSRainbow Public Config stored in ENSDb is up-to-date and valid.
 *
 * @throws Error if ENSRainbow is not ready after multiple retries, or
 *         the Indexing Status snapshot is missing after multiple retries,
 *         the ENSRainbow Public Config validation failed.
 */
export async function ensureValidEnsRainbowConnection(): Promise<void> {
  const storedConfig = await ensDbClient.getEnsRainbowPublicConfig();

  /**
   * If there's no stored config in ENSDb, it means no indexing should have
   * happened yet. Therefore, we require the omnichain indexing status to
   * be `Unstarted` here.
   */
  if (!storedConfig) {
    console.log(
      'No stored ENSRainbow Public Config found in ENSDb. Validating the omnichain indexing status is "Unstarted"...',
    );
    /**
     * Fetch the indexing status snapshot with retries, to handle potential
     * transient errors, i.e. when ENSDb has not been yet populated with
     * ENSNode Metadata for Indexing Status.
     * If the fetch fails after all retries, something is likely wrong with
     * ENSDb state, so we throw the error to terminate the ENSIndexer process
     * and avoid running with an invalid state.
     */
    const indexingStatusSnapshot = await pRetry(
      async () => {
        const snapshot = await ensDbClient.getIndexingStatusSnapshot();

        if (!snapshot) {
          throw new Error("Indexing Status snapshot was not found in ENSDb.");
        }

        console.log("Successfully loaded Indexing Status snapshot from ENSDb.");

        return snapshot;
      },
      {
        retries: 3,
        onFailedAttempt: ({ error, attemptNumber, retriesLeft }) => {
          console.warn(
            `Indexing Status snapshot is unavailable. Attempt ${attemptNumber} failed (${error.message}). ${retriesLeft} retries left.`,
          );
        },
      },
    );

    invariant_indexingStatusUnstarted(indexingStatusSnapshot);

    console.log('Omnichain indexing status is "Unstarted".');
  }

  await waitForEnsRainbowToBeReady();

  // Once the connected ENSRainbow instance is ready, we we can try
  // upserting the ENSRainbow Public Config into ENSDb.
  console.log("Upserting the validated ENSRainbow Public Config into ENSDb...");
  const validatedEnsRainbowConfig = await getValidatedEnsRainbowPublicConfig(storedConfig);
  await ensDbClient.upsertEnsRainbowPublicConfig(validatedEnsRainbowConfig);
  console.log("Successfully upserted the validated ENSRainbow Public Config into ENSDb.");
}
