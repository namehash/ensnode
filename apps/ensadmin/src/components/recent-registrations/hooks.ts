import { ensAdminVersion } from "@/lib/env";
import { useQuery } from "@tanstack/react-query";
import { millisecondsInSecond } from "date-fns/constants";
import { Address, getAddress, isAddressEqual } from "viem";
import { Registration } from "./types";

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
 */
function getEffectiveOwner(registrationResult: RegistrationResult): Address {
  // Only use wrapped owner if the owner is the NameWrapper contract
  if (isAddressEqual(registrationResult.domain.owner.id, NAME_WRAPPER_ADDRESS)) {
    if (!registrationResult.domain.wrappedOwner) {
      throw new Error(
        "Wrapped owner is not defined while the 'official' owner is an ENS Name Wrapper",
      );
    }
    return getAddress(registrationResult.domain.wrappedOwner.id);
  }

  // Otherwise, use the regular owner
  return getAddress(registrationResult.domain.owner.id);
}

function transformTimestamp(timestamp: string): Date {
  try {
    return new Date(parseInt(timestamp) * millisecondsInSecond);
  } catch (error) {
    throw new Error("Error parsing timestamp to date");
  }
}

/**
 * Transforms a RegistrationResult into a Registration
 */
function toRegistration(registrationResult: RegistrationResult): Registration {
  return {
    registeredAt: transformTimestamp(registrationResult.registrationDate),
    expiresAt: transformTimestamp(registrationResult.expiryDate),
    name: registrationResult.domain.name,
    ownerInRegistry: registrationResult.domain.owner.id,
    owner: getEffectiveOwner(registrationResult),
    ownerInNameWrapper: registrationResult.domain.wrappedOwner?.id,
  };
}

/**
 * Fetches info about most recent registrations that have been indexed.
 */
async function fetchRecentRegistrations(baseUrl: URL, maxResults: number): Promise<Registration[]> {
  const query = `
    query RecentRegistrationsQuery {
      registrations(first: ${maxResults}, orderBy: registrationDate, orderDirection: desc) {
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

  return data.data.registrations.map((registration: RegistrationResult) =>
    toRegistration(registration),
  );
}

/**
 * Hook to fetch info about most recently registered domains that have been indexed.
 *
 * @param ensNodeURL The URL of the selected ENS node instance.
 * @param maxResults number of the maximal number of latest registrations to be retrieved by the query
 */
export function useRecentRegistrations(ensNodeURL: URL, maxResults: number) {
  return useQuery({
    queryKey: ["recent-registrations", ensNodeURL],
    queryFn: () => fetchRecentRegistrations(ensNodeURL, maxResults),
    throwOnError(error) {
      throw new Error(`Could not fetch ENSNode data from '${ensNodeURL}'. Cause: ${error.message}`);
    },
  });
}
