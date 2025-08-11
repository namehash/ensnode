/**
 * All zod schemas we define must remain internal implementation details.
 * We want the freedom to move away from zod in the future without impacting
 * any users of the ensnode-sdk package.
 *
 * The only way to share Zod schemas is to re-export them from
 * `./src/internal.ts` file.
 *
 * This file defines Zod schemas required to validate data coming from
 * Ponder metrics and Ponder status endpoints and make this data fit
 * into the ENSIndexer application data model (and its constraints).
 */
import {
  type ChainIdString,
  type ChainIndexingStatus,
  OverallIndexingStatusIds,
  SerializedENSIndexerOverallIndexingStatusOk,
  SerializedENSIndexerOverallIndexingStatusOkFollowing,
  getOverallApproxRealtimeDistance,
  getOverallIndexingStatus,
} from "@ensnode/ensnode-sdk";
import {
  makeBlockRefSchema,
  makeChainIdSchema,
  makeNonNegativeIntegerSchema,
} from "@ensnode/ensnode-sdk/internal";
import z from "zod/v4";
import { getChainIndexingStatus } from "./ponder-metadata/chain";
import type { ChainName } from "./ponder-metadata/config";

const makeChainNameSchema = (indexedChainNames: string[]) => z.enum(indexedChainNames);

const PonderBlockRefSchema = makeBlockRefSchema();

const PonderCommandSchema = z.enum(["dev", "start"]);

const PonderOrderingSchema = z.literal("omnichain");

export const PonderAppSettingsSchema = z.strictObject({
  command: PonderCommandSchema,
  ordering: PonderOrderingSchema,
});

const PonderMetricBooleanSchema = z.coerce.string().transform((v) => v === "1");

const PonderChainMetadataSchema = z.strictObject({
  chainId: makeChainIdSchema(),
  config: z.object({
    startBlock: PonderBlockRefSchema,
    endBlock: PonderBlockRefSchema.nullable(),
  }),
  backfillEndBlock: PonderBlockRefSchema,
  historicalTotalBlocks: makeNonNegativeIntegerSchema(),
  isSyncComplete: PonderMetricBooleanSchema,
  isSyncRealtime: PonderMetricBooleanSchema,
  syncBlock: PonderBlockRefSchema,
  statusBlock: PonderBlockRefSchema,
});

export const makePonderChainMetadataSchema = (indexedChainNames: string[]) => {
  const ChainNameSchema = makeChainNameSchema(indexedChainNames);

  const invariant_definedEntryForEachIndexedChain = (v: Map<ChainName, unknown>) =>
    indexedChainNames.every((chainName) => Array.from(v.keys()).includes(chainName));

  return z
    .object({
      appSettings: PonderAppSettingsSchema,

      chains: z
        .map(ChainNameSchema, PonderChainMetadataSchema)
        .refine(invariant_definedEntryForEachIndexedChain, {
          error: "All `indexedChainNames` must be represented by Ponder Chains Block Refs object.",
        }),
    })
    .transform((ponderIndexingStatus) => {
      const serializedChainIndexingStatuses = {} as Record<ChainIdString, ChainIndexingStatus>;

      for (const chainName of indexedChainNames) {
        const indexedChain = ponderIndexingStatus.chains.get(chainName)!;

        serializedChainIndexingStatuses[indexedChain.chainId] =
          getChainIndexingStatus(indexedChain);
      }

      const chains = Object.values(serializedChainIndexingStatuses);
      const overallStatus = getOverallIndexingStatus(chains);

      if (overallStatus === OverallIndexingStatusIds.Following) {
        return {
          chains: serializedChainIndexingStatuses,
          overallStatus: overallStatus,
          approximateRealtimeDistance: getOverallApproxRealtimeDistance(chains),
        } satisfies SerializedENSIndexerOverallIndexingStatusOkFollowing;
      }

      return {
        chains: serializedChainIndexingStatuses,
        overallStatus: overallStatus,
      } satisfies SerializedENSIndexerOverallIndexingStatusOk;
    });
};

export const makePonderStatusSchema = (valueLabel?: "Value") => {
  const chainIdSchema = makeChainIdSchema(valueLabel);
  const blockRefSchema = makeBlockRefSchema(valueLabel);

  return z.record(
    z.string().transform(Number).pipe(chainIdSchema),
    z.object({
      id: chainIdSchema,
      block: blockRefSchema,
    }),
    {
      error: "Ponder Status must be an object mapping valid chain name to a chain status object.",
    },
  );
};
