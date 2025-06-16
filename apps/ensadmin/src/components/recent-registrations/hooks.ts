import { ensAdminVersion, selectedEnsNodeUrl } from "@/lib/env";
import { useQuery } from "@tanstack/react-query";
import { Address, getAddress, isAddressEqual } from "viem";
import { Registration } from "./types";
import {registration} from "@ensnode/ensnode-schema";

/**
 * The data model returned by a GraphQL query for registrations.
 */
interface RegistrationResult {
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
  };
}

/**
 * The NameWrapper contract address
 */
const NAME_WRAPPER_ADDRESS = "0xd4416b13d2b3a9abae7acd5d6c2bbdbe25686401";

/**
 * Determines the effective owner of a domain.
 * If the owner is the NameWrapper contract, returns the wrapped owner instead.
 *
 * @param registrationResult - Data associated with Registration event
 */
function getTrueOwner(registrationResult: RegistrationResult) {
  // Only use wrapped owner if the owner is the NameWrapper contract
  if (isAddressEqual(registrationResult.domain.owner.id, NAME_WRAPPER_ADDRESS)) {
    if (registrationResult.domain.wrappedOwner) {
      return getAddress(registrationResult.domain.wrappedOwner.id);
    }
    throw new Error("Wrapped owner is not defined 'true' owner is an ENS Name Wrapper");
  }

  // Otherwise, use the regular owner
  return getAddress(registrationResult.domain.owner.id);
}

/**
 * Transforms a registration object from the response of the GraphQL RecentRegistrationsQuery to an object of a streamlined type Registration
 * @param registrationResult - RegistrationResult - GraphQL compatible representation of recently registered domain
 * @returns fetched data in Registration format
 */
function toRegistration(registrationResult: RegistrationResult): Registration {
  return {
      registeredAt: registrationResult.registrationDate,
      expiresAt: registrationResult.expiryDate,
      name: registrationResult.domain.name,
      releasesAt: registrationResult.domain.expiryDate,
      ownerInRegistry: registrationResult.domain.owner.id,
      owner: getTrueOwner(registrationResult),
      ...(registrationResult.domain.wrappedOwner && {
        ownerInNameWrapper: registrationResult.domain.wrappedOwner.id,
      }),
    };
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

  return data.data.registrations.map((registration) => toRegistration(registration));
}

//TODO: The number of registrations to query should be a param passed into the function. (Remove the hardcoded "5")
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
