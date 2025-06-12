import { ensAdminVersion, selectedEnsNodeUrl } from "@/lib/env";
import { useQuery } from "@tanstack/react-query";
import {
  LatestRegistration,
  LatestRegistrationResult,
  RecentRegistrationsResponse,
  Registration,
} from "./types";

/**
 * Fetches info about the 5 most recently registered .eth domains that have been indexed.
 *
 * @param baseUrl ENSNode URL
 * @returns Info about the 5 most recently registered .eth domains that have been indexed.
 */
async function fetchRecentRegistrations(baseUrl: URL): Promise<RecentRegistrationsResponse> {
  const query = `
    query RecentRegistrationsQuery {
      registrations(first: 5, orderBy: registrationDate, orderDirection: desc) {
        registrationDate
        expiryDate
        domain {
          id
          name
          labelName
          createdAt
          expiryDate
          owner {
            id
          }
          wrappedOwner {
            id
          }
        }
      }
    }
  `;

  const response = await fetch(new URL(`/subgraph`, baseUrl), {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-ensadmin-version": await ensAdminVersion(),
    },
    body: JSON.stringify({ query }),
  });

  if (!response.ok) {
    console.error("Failed to fetch recent registrations", response);
    throw new Error("Failed to fetch recent registrations");
  }

  const data = await response.json();
  data.data.registrations = data.data.registrations.map(
    (graphQLQueryResult: {
      registrationDate: string;
      expiryDate: string;
      domain: LatestRegistrationResult;
    }) => ({
      ...graphQLQueryResult,
      registration: toLatestRegistration(graphQLQueryResult.domain),
    }),
  );

  return data.data;
}

/**
 * Hook to fetch info about the 5 most recently registered .eth domains that have been indexed.
 * @param searchParams The URL search params including the selected ENS node URL.
 * @returns React Query hook result.
 */
export function useRecentRegistrations(searchParams: URLSearchParams) {
  const ensNodeUrl = selectedEnsNodeUrl(searchParams);

  return useQuery({
    queryKey: ["recent-registrations", ensNodeUrl],
    queryFn: () => fetchRecentRegistrations(ensNodeUrl),
    throwOnError(error) {
      throw new Error(`Could not fetch ENSNode data from '${ensNodeUrl}'. Cause: ${error.message}`);
    },
  });
}

/**
 * Function that transforms a LatestRegistrationResult to a LatestRegistration
 * @param graphQLResponseData - LatestRegistrationResult - GraphQL compatible representation of recently registered domain, dubed 'domain' in the query
 * @returns fetched data in new, streamlined LatestRegistration format
 */
export function toLatestRegistration(
  graphQLResponseData: LatestRegistrationResult,
): LatestRegistration {
  return {
    name: graphQLResponseData.name,
    createdAt: parseInt(graphQLResponseData.createdAt),
    expiresAt: parseInt(graphQLResponseData.expiryDate),
    ownerInRegistry: graphQLResponseData.owner.id,
    ...(graphQLResponseData.wrappedOwner && { wrappedOwner: graphQLResponseData.wrappedOwner.id }),
  };
}
