"use client";

import type { UseQueryResult } from "@tanstack/react-query";
import { useMemo } from "react";

import type { Name, ResolveRecordsResponse, ResolverRecordsSelection } from "@ensnode/ensnode-sdk";

import type { ConfigParameter, QueryParameter } from "../types";
import { useRecords } from "./useRecords";

/**
 * Parameters for the useProfile hook.
 *
 * @template RECORDS_SELECTION - The resolver records selection type
 */
export type UseProfileParameters<RECORDS_SELECTION extends ResolverRecordsSelection> = {
  /**
   * The ENS name to resolve profile data for.
   * If null, the query will not be executed.
   */
  name: Name | null;

  /**
   * The selection of records to fetch.
   */
  selection: RECORDS_SELECTION;
} & ConfigParameter &
  QueryParameter<ResolveRecordsResponse<RECORDS_SELECTION>>;

/**
 * A transformation function that converts raw resolver records into a custom profile data model.
 *
 * This function is called with the ENS name and the raw records response from the resolver,
 * and should return a transformed profile object optimized for your application's use case.
 *
 * Invariant: This function is only called when records data is successfully fetched.
 * It will not be called with null or undefined data.
 *
 * @template RECORDS_SELECTION - The resolver records selection type
 * @template TRANSFORMED_PROFILE - The custom profile data model type
 *
 * @param name - The ENS name being resolved
 * @param recordsResponse - The raw records response from the resolver
 * @returns The transformed profile data model
 *
 * @example
 * ```typescript
 * const transformToMyProfile = (name, recordsResponse) => ({
 *   displayName: name,
 *   avatar: recordsResponse.records.texts.avatar ?? null,
 *   ethAddress: recordsResponse.records.addresses["60"] ?? null,
 * });
 * ```
 */
export type ProfileTransformFunction<
  RECORDS_SELECTION extends ResolverRecordsSelection,
  TRANSFORMED_PROFILE,
> = (name: Name, recordsResponse: ResolveRecordsResponse<RECORDS_SELECTION>) => TRANSFORMED_PROFILE;

/**
 * Hook for fetching ENS records with custom transformation logic.
 *
 * This hook wraps `useRecords` and allows applications to define their own
 * data transformation logic to convert raw resolver records into a custom
 * profile data model optimized for their specific use case.
 *
 * The transformation function is memoized and only re-runs when the underlying
 * records data changes, ensuring efficient re-renders.
 *
 * @template RECORDS_SELECTION - The resolver records selection type
 * @template TRANSFORMED_PROFILE - The custom profile data model type
 *
 * @param parameters - Configuration for fetching and transforming profile data
 * @param transform - Pure function to transform records into profile model
 * @returns Query result containing the transformed profile data
 *
 * @example
 * ```typescript
 * import { useProfile } from "@ensnode/ensnode-react";
 * import type { ResolverRecordsSelection } from "@ensnode/ensnode-sdk";
 *
 * const selection = {
 *   addresses: [60] as const,
 *   texts: ["avatar", "description", "com.twitter"] as const,
 * } satisfies ResolverRecordsSelection;
 *
 * type MyProfile = {
 *   name: string;
 *   avatar: string | null;
 *   description: string | null;
 *   ethAddress: string | null;
 *   twitter: string | null;
 * };
 *
 * function MyComponent() {
 *   const { data: profile, isLoading, error } = useProfile(
 *     {
 *       name: "vitalik.eth",
 *       selection,
 *     },
 *     (name, recordsResponse) => ({
 *       name,
 *       avatar: recordsResponse.records.texts.avatar ?? null,
 *       description: recordsResponse.records.texts.description ?? null,
 *       ethAddress: recordsResponse.records.addresses["60"] ?? null,
 *       twitter: recordsResponse.records.texts["com.twitter"] ?? null,
 *     })
 *   );
 *
 *   if (isLoading) return <div>Loading...</div>;
 *   if (error) return <div>Error: {error.message}</div>;
 *   if (!profile) return <div>No profile found</div>;
 *
 *   return (
 *     <div>
 *       <h1>{profile.name}</h1>
 *       {profile.avatar && <img src={profile.avatar} alt="Avatar" />}
 *       <p>{profile.description}</p>
 *       <p>ETH: {profile.ethAddress}</p>
 *       {profile.twitter && <p>Twitter: @{profile.twitter}</p>}
 *     </div>
 *   );
 * }
 * ```
 *
 * @example
 * ```typescript
 * // Building a reusable profile hook for your application
 * import { useProfile } from "@ensnode/ensnode-react";
 * import type { ResolverRecordsSelection } from "@ensnode/ensnode-sdk";
 *
 * const MY_APP_SELECTION = {
 *   addresses: [60, 0] as const, // ETH and BTC
 *   texts: ["avatar", "description", "url", "com.twitter", "com.github"] as const,
 * } satisfies ResolverRecordsSelection;
 *
 * type MyAppProfile = {
 *   name: string;
 *   avatar: string | null;
 *   description: string | null;
 *   website: string | null;
 *   social: {
 *     twitter: string | null;
 *     github: string | null;
 *   };
 *   crypto: {
 *     eth: string | null;
 *     btc: string | null;
 *   };
 * };
 *
 * export function useMyAppProfile(name: string | null) {
 *   return useProfile(
 *     {
 *       name,
 *       selection: MY_APP_SELECTION,
 *     },
 *     (name, recordsResponse) => ({
 *       name,
 *       avatar: recordsResponse.records.texts.avatar ?? null,
 *       description: recordsResponse.records.texts.description ?? null,
 *       website: recordsResponse.records.texts.url ?? null,
 *       social: {
 *         twitter: recordsResponse.records.texts["com.twitter"] ?? null,
 *         github: recordsResponse.records.texts["com.github"] ?? null,
 *       },
 *       crypto: {
 *         eth: recordsResponse.records.addresses["60"] ?? null,
 *         btc: recordsResponse.records.addresses["0"] ?? null,
 *       },
 *     })
 *   );
 * }
 *
 * // Usage in components is now simple:
 * function ProfileCard({ name }: { name: string }) {
 *   const { data: profile, isLoading } = useMyAppProfile(name);
 *
 *   if (isLoading) return <div>Loading...</div>;
 *   if (!profile) return null;
 *
 *   return (
 *     <div>
 *       <h2>{profile.name}</h2>
 *       <p>{profile.description}</p>
 *       <a href={profile.website}>Website</a>
 *       <p>Twitter: {profile.social.twitter}</p>
 *       <p>ETH: {profile.crypto.eth}</p>
 *     </div>
 *   );
 * }
 * ```
 */
export function useProfile<RECORDS_SELECTION extends ResolverRecordsSelection, TRANSFORMED_PROFILE>(
  parameters: UseProfileParameters<RECORDS_SELECTION>,
  transform: ProfileTransformFunction<RECORDS_SELECTION, TRANSFORMED_PROFILE>,
): UseQueryResult<TRANSFORMED_PROFILE | undefined, Error> {
  const { name, selection, config, query } = parameters;

  const recordsQueryResult = useRecords({
    name,
    selection,
    config,
    query,
  });

  // Memoize the transformed profile data
  // Only recompute when records data or transform function changes
  const transformedProfileData = useMemo<TRANSFORMED_PROFILE | undefined>(() => {
    // Invariant: Only transform when we have successful data
    if (!recordsQueryResult.data || !name) {
      return undefined;
    }

    return transform(name, recordsQueryResult.data);
  }, [recordsQueryResult.data, name, transform]);

  // Return the query result with transformed data
  // Preserve all other query states from useRecords
  return {
    ...recordsQueryResult,
    data: transformedProfileData,
  } as UseQueryResult<TRANSFORMED_PROFILE | undefined, Error>;
}
