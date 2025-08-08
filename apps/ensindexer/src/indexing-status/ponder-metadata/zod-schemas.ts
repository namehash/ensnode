/**
 * All zod schemas we define must remain internal implementation details.
 * We want the freedom to move away from zod in the future without impacting
 * any users of the ensnode-sdk package.
 *
 * The only way to share Zod schemas is to re-export them from
 * `./src/internal.ts` file.
 */
import {
  type ChainIdString,
  type ChainIndexingStatus,
  type SerializedENSIndexerIndexingStatus,
  getApproximateRealtimeDistances,
  getOverallStatus,
} from "@ensnode/ensnode-sdk";
import {
  makeBlockRefSchema,
  makeChainIdSchema,
  makeNonNegativeIntegerSchema,
} from "@ensnode/ensnode-sdk/internal";
import z from "zod/v4";
import { getChainIndexingStatus } from "./chain";
import type { ChainName } from "./config";

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

      const serializedIndexingStatus = {
        chains: serializedChainIndexingStatuses,
        approximateRealtimeDistance: getApproximateRealtimeDistances(chains),
        overallStatus: getOverallStatus(chains),
      } satisfies SerializedENSIndexerIndexingStatus;

      return serializedIndexingStatus;
    });
};
