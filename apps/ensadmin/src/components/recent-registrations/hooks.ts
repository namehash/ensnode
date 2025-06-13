import { ensAdminVersion, selectedEnsNodeUrl } from "@/lib/env";
import { useQuery } from "@tanstack/react-query";
import {
  Registration,
} from "./types";
import {Address, getAddress, isAddressEqual} from "viem";

/**
 * The data model returned by a GraphQL query for the latest registrations.
 */
interface LatestRegistrationResult {
  registrationDate: string;
  expiryDate: string;
  domain: {
    name: string;
    createdAt: string;
    expiryDate: string;
    owner: {
      id: Address;
    };
    wrappedOwner?: {
      id: Address;
    };
  }
}

/**
 * The NameWrapper contract address
 */
const NAME_WRAPPER_ADDRESS = "0xd4416b13d2b3a9abae7acd5d6c2bbdbe25686401";

/**
 * Determines the effective owner of a domain.
 * If the owner is the NameWrapper contract, returns the wrapped owner instead.
 *
 * @param graphQLQueryResponseElement - Data associated with Registration event
 */
function getTrueOwner(graphQLQueryResponseElement: LatestRegistrationResult) {
  // Only use wrapped owner if the owner is the NameWrapper contract
  if (isAddressEqual(graphQLQueryResponseElement.domain.owner.id, NAME_WRAPPER_ADDRESS)
  ) {
    if (graphQLQueryResponseElement.domain.wrappedOwner){
      return getAddress(graphQLQueryResponseElement.domain.wrappedOwner.id);
    }
    throw new Error("Wrapped owner is not defined 'true' owner is an ENS Name Wrapper")
  }

  // Otherwise, use the regular owner
  return getAddress(graphQLQueryResponseElement.domain.owner.id);
}

/**
 * Fetches info about the 5 most recently registered .eth domains that have been indexed.
 *
 * @param baseUrl ENSNode URL
 * @returns Info about the 5 most recently registered .eth domains that have been indexed.
 */
async function fetchRecentRegistrations(baseUrl: URL): Promise<Registration[]> {
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

  return toRegistrations(data.data.registrations);
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
 * Transforms a response of the GraphQL RecentRegistrationsQuery to an array of streamlined type Registration
 * @param graphQLResponseData - LatestRegistrationResult[] - GraphQL compatible representations of recently registered domains
 * @returns fetched data in Registration format
 */
function toRegistrations(
  graphQLResponseData: LatestRegistrationResult[],
): Registration[] {
  return graphQLResponseData.map((registration): Registration => ({
    registeredAt: registration.registrationDate,
    expiresAt: registration.expiryDate,
    name: registration.domain.name,
    domainCreatedAt: registration.domain.createdAt,
    expiresAtWithGracePeriod: registration.domain.expiryDate,
    ownerInRegistry: registration.domain.owner.id,
    owner: getTrueOwner(registration),
    ...(registration.domain.wrappedOwner && { ownerInNameWrapper: registration.domain.wrappedOwner.id }),
  }));
}
