import { ensAdminVersion } from "@/lib/env";
import { useQuery } from "@tanstack/react-query";
import { type RecentRegistrationsResponse } from "./types";

const RECENT_REGISTRATIONS_LIMIT = 10;

/**
 * Fetches info about the most recently registered .eth domains that have been indexed.
 *
 * @param baseUrl ENSNode URL
 * @returns Info about the most recently registered .eth domains that have been indexed.
 */
async function fetchRecentRegistrations(baseUrl: URL): Promise<RecentRegistrationsResponse> {
  const query = `
    query RecentRegistrationsQuery {
      registrations(first: ${RECENT_REGISTRATIONS_LIMIT}, orderBy: registrationDate, orderDirection: desc) {
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

  return response.json();
}

/**
 * Hook to fetch info about the most recently registered .eth domains that have been indexed.
 * @param ensNodeUrl The URL of the selected ENSNode.
 * @returns React Query hook result.
 */
export function useRecentRegistrations(ensNodeUrl: URL) {
  return useQuery({
    queryKey: ["recent-registrations", ensNodeUrl],
    queryFn: async () => fetchRecentRegistrations(ensNodeUrl),
    // Select the registrations from the response
    select: (data) => data.data.registrations,
    throwOnError(error) {
      throw new Error(`Could not fetch ENSNode data from '${ensNodeUrl}'. Cause: ${error.message}`);
    },
  });
}
