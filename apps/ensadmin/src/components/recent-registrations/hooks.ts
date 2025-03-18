import { ensAdminVersion, selectedEnsNodeUrl } from "@/lib/env";
import { useQuery } from "@tanstack/react-query";
import { type RecentRegistrationsResponse } from "./types";

/**
 * Fetches info about the 5 most recently registered .eth domains that have been indexed.
 *
 * @param baseUrl ENSNode URL
 * @returns Info about the 5 most recently registered .eth domains that have been indexed.
 */
async function fetchRecentRegistrations(baseUrl: string): Promise<RecentRegistrationsResponse> {
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
  return data.data;
}

/**
 * Hook to fetch info about the 5 most recently registered .eth domains that have been indexed.
 * @param searchParams The URL search params including the selected ENSNode URL.
 * @returns React Query hook result.
 */
export function useRecentRegistrations(searchParams: URLSearchParams) {
  const ensNodeUrl = selectedEnsNodeUrl(searchParams);

  return useQuery({
    queryKey: ["recent-registrations", ensNodeUrl],
    queryFn: () => fetchRecentRegistrations(ensNodeUrl),
    throwOnError(error) {
      throw new Error(`ENSNode request error at '${ensNodeUrl}'. Cause: ${error.message}`);
    },
  });
}
