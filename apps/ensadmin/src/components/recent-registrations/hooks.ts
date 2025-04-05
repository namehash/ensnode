import { schema } from "@/components/providers/ponder-client-provider";
import { ensAdminVersion, selectedEnsNodeUrl } from "@/lib/env";
import { and, desc, eq, like, notLike } from "@ponder/client";
import { usePonderQuery } from "@ponder/react";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
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

  const data = await response.json();
  return data.data;
}

/**
 * Hook to fetch info about the most recently registered .eth domains that have been indexed.
 * @param searchParams The URL search params including the selected ENSNode URL.
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

export function useRecentRegistrationsViaPonder(skipChildrenOfDomains: Array<string> = []) {
  const ponderQuery = usePonderQuery({
    // we need this query to fetch in a very specific way driven by manual triggers
    enabled: false,
    queryFn: (db) =>
      db
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
        .limit(RECENT_REGISTRATIONS_LIMIT),
  });

  useEffect(() => {
    // manually refetch this expensive query
    ponderQuery.refetch();

    const intervalId = setInterval(ponderQuery.refetch, 15000);

    return () => clearInterval(intervalId);
  }, [ponderQuery]);

  const mappedData = ponderQuery.data?.map((row) => {
    if (!row.domainName) {
      throw new Error(`Registration is missing its linked domain name for node '${row.domainId}'`);
    }

    if (!row.domainOwnerId) {
      throw new Error(
        `Registration is missing its linked domain owner ID for node '${row.domainId}'`,
      );
    }

    return {
      registrationDate: row.registrationDate.toString(),
      expiryDate: row.expiryDate.toString(),
      domain: {
        id: row.domainId,
        name: row.domainName,
        labelName: row.domainLabelName,
        createdAt: row.domainCreatedAt.toString(),
        expiryDate: row.domainExpiryDate?.toString(),
        // FIXME: for some reason owner ID is always null (it should never be like that)
        owner: {
          id: row.domainOwnerId,
        },
        wrappedOwner: row.domainWrappedOwnerId
          ? {
              id: row.domainWrappedOwnerId,
            }
          : undefined,
      },
    };
  });

  return {
    ...ponderQuery,
    data: {
      registrations: mappedData ?? [],
    },
  };
}
