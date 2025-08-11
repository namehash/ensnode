"use client";

import {
  ENSNodeClient,
  ResolvePrimaryNameRequest,
  ResolveRecordsRequest,
  ResolverRecordsSelection,
} from "@ensnode/ensnode-sdk";
import type { ENSNodeConfig } from "../types";

/**
 * Query key factory for ENSNode queries
 * Includes endpoint URL for proper cache isolation between different ENSNode instances
 *
 * @example
 * ```typescript
 * // Forward resolution
 * queryKeys.records(
 *   "https://api.alpha.ensnode.io",
 *   { name: "vitalik.eth", selection: { addresses: [60] } },
 * )
 * // Results in:
 * // [
 * //   "ensnode",
 * //   "https://api.alpha.ensnode.io",
 * //   "resolution",
 * //   "records",
 * //   { name: "vitalik.eth", selection: { addresses: [60] } }
 * // ]
 *
 * // Primary name resolution
 * queryKeys.primaryName(
 *   "https://api.alpha.ensnode.io",
 *   { address: "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045", chainId: 1 },
 * )
 * // Results in:
 * // [
 * //   "ensnode",
 * //   "https://api.alpha.ensnode.io",
 * //   "resolution",
 * //   "primaryName",
 * //   { address: "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045", chainId: 1 }
 * // ]
 *
 * // Different endpoints have separate cache keys
 * queryKeys.records(
 *   "https://api.testnet.ensnode.io",
 *   { name: "vitalik.eth", selection: { addresses: [60] } },
 * )
 * // Results in:
 * // [
 * //   "ensnode",
 * //   "https://api.testnet.ensnode.io",
 * //   "resolution",
 * //   "records",
 * //   { name: "vitalik.eth", selection: { addresses: [60] } }
 * // ]
 * ```
 */
export const queryKeys = {
  all: (url: string) => ["ensnode", url] as const,
  resolution: (url: string) => [...queryKeys.all(url), "resolution"] as const,
  records: (url: string, args: ResolveRecordsRequest<any>) =>
    [...queryKeys.resolution(url), "records", args] as const,
  primaryName: (url: string, args: ResolvePrimaryNameRequest) =>
    [...queryKeys.resolution(url), "primaryName", args] as const,
};

/**
 * Creates query options for Records Resolution
 */
export function createRecordsQueryOptions<SELECTION extends ResolverRecordsSelection>(
  config: ENSNodeConfig,
  args: ResolveRecordsRequest<SELECTION>,
) {
  return {
    queryKey: queryKeys.records(config.client.url.href, args),
    queryFn: async () => {
      const client = new ENSNodeClient(config.client);
      return client.resolveRecords(args.name, args.selection, args.trace);
    },
    enabled: true,
  };
}

/**
 * Creates query options for Primary Name Resolution
 */
export function createPrimaryNameQueryOptions(
  config: ENSNodeConfig,
  args: ResolvePrimaryNameRequest,
) {
  return {
    queryKey: queryKeys.primaryName(config.client.url.href, args),
    queryFn: async () => {
      const client = new ENSNodeClient(config.client);
      return client.resolvePrimaryName(args.address, args.chainId, args.trace);
    },
    enabled: true,
  };
}
