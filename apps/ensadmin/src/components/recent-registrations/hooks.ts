import { schema } from "@/components/providers/ponder-client-provider";
import { ensAdminVersion, selectedEnsNodeUrl } from "@/lib/env";
import { and, desc, eq, like, notLike } from "@ponder/client";
import { usePonderQuery } from "@ponder/react";
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

export function useRecentRegistrationsViaPonder(skipChildrenOfDomains: Array<string> = []) {
  return usePonderQuery({
    queryFn: (db) => {
      const q = db
        .select({
          registrationDate: schema.registration.registrationDate,
          expiryDate: schema.registration.expiryDate,
          domainId: schema.domain.id,
          domainName: schema.domain.name,
          domainLabelName: schema.domain.labelName,
          domainCreatedAt: schema.domain.createdAt,
          domainExpiryDate: schema.domain.expiryDate,
          domainOwnerId: schema.domain.ownerId,
          domainWrappedOwnerId: schema.domain.wrappedOwnerId,
        })
        .from(schema.registration)
        .innerJoin(schema.domain, eq(schema.registration.domainId, schema.domain.id))
        .where(
          and(
            // exclude domains with unhealed labels
            notLike(schema.domain.name, "[%"),
            // exclude domains with name that ends with any element of skipChildrenOfDomains
            ...skipChildrenOfDomains.map((skipChildrenOfDomain) =>
              notLike(schema.domain.name, `%${skipChildrenOfDomain}`),
            ),
          ),
        )
        .orderBy(desc(schema.registration.registrationDate))
        .limit(5);

      console.log(q.toSQL());

      return q;
    },
    // @ts-ignore
    select(data) {
      console.table(data);
      const mappedData = data.map((row) => ({
        registrationDate: row.registrationDate,
        expiryDate: row.expiryDate,
        domain: {
          id: row.domainId,
          name: row.domainName,
          labelName: row.domainLabelName,
          createdAt: row.domainCreatedAt,
          expiryDate: row.domainExpiryDate,
          owner: {
            id: row.domainOwnerId,
          },
          wrappedOwner: {
            id: row.domainWrappedOwnerId,
          },
        },
      }));

      return { registrations: mappedData };
    },
  });
}
