"use client";

import type { ResolverRecordsSelection } from "@ensnode/ensnode-sdk";
import { useQuery } from "@tanstack/react-query";

import type { ConfigParameter, UseRecordsParameters } from "../types";
import { createRecordsQueryOptions } from "../utils/query";
import { useENSNodeConfig } from "./useENSNodeConfig";

/**
 * Resolves records for an ENS name (Forward Resolution).
 *
 * The returned `name` field, if set, is guaranteed to be a normalized name.
 * If the name record returned by the resolver is not normalized, `null` is returned as if no name record was set.
 *
 * @param parameters - Configuration for the ENS name resolution
 * @returns Query result with resolved records
 *
 * @example
 * ```typescript
 * import { useRecords } from "@ensnode/ensnode-react";
 *
 * function DisplayNameRecords() {
 *   const { data, isLoading, error } = useRecords({
 *     name: "jesse.base.eth",
 *     selection: {
 *       addresses: [60], // ETH CoinType
 *       texts: ["avatar", "com.twitter"]
 *     }
 *   });
 *
 *   if (isLoading) return <div>Loading...</div>;
 *   if (error) return <div>Error: {error.message}</div>;
 *
 *   return (
 *     <div>
 *       <h3>Resolved Records for vitalik.eth</h3>
 *       {data.records.addresses && (
 *         <p>ETH Address: {data.records.addresses[60]}</p>
 *       )}
 *       {data.records.texts && (
 *         <div>
 *           <p>Avatar: {data.records.texts.avatar}</p>
 *           <p>Twitter: {data.records.texts["com.twitter"]}</p>
 *         </div>
 *       )}
 *     </div>
 *   );
 * }
 * ```
 */
export function useRecords<SELECTION extends ResolverRecordsSelection>(
  parameters: UseRecordsParameters<SELECTION> & ConfigParameter
) {
  const { config, query = {}, name, ...args } = parameters;
  const _config = useENSNodeConfig(config);

  const canEnable = name !== null;

  const queryOptions = canEnable
    ? createRecordsQueryOptions(_config, { ...args, name })
    : { enabled: false, queryKey: ["disabled"] as const };

  const options = {
    ...queryOptions,
    ...query,
    enabled: canEnable && (query.enabled ?? queryOptions.enabled),
  };

  return useQuery(options);
}
