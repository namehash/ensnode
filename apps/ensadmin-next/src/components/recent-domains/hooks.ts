import { ensAdminVersion, selectedEnsNodeUrl } from "@/lib/env";
import { useQuery } from "@tanstack/react-query";
import { RecentDomainsResponse } from "./types";

/**
 * Fetches the last 5 newly registered domains.
 *
 * @param baseUrl ENSNode URL
 * @returns Information about the last 5 newly registered domains.
 */
async function fetchRecentDomains(baseUrl: string): Promise<RecentDomainsResponse> {
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
    console.error("Failed to fetch recent domains", response);
    throw new Error("Failed to fetch recent domains");
  }

  const data = await response.json();
  return data.data;
}

/**
 * Hook to fetch the last 5 newly registered domains.
 * @param searchParams The URL search params including the selected ENS node URL.
 * @returns React Query hook result.
 */
export function useRecentDomains(searchParams: URLSearchParams) {
  const ensNodeUrl = selectedEnsNodeUrl(searchParams);

  return useQuery({
    queryKey: ["recent-domains", ensNodeUrl],
    queryFn: () => fetchRecentDomains(ensNodeUrl),
    throwOnError(error) {
      throw new Error(`ENSNode request error at '${ensNodeUrl}'. Cause: ${error.message}`);
    },
  });
}
