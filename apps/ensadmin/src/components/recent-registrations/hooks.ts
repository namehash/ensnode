import {
  UnixTimestampInSeconds,
  unixTimestampToDate,
} from "@/components/recent-registrations/utils";
import { ensAdminVersion } from "@/lib/env";
import { ENSNamespaceId, getNameWrapperAddress } from "@ensnode/datasources";
import { useQuery } from "@tanstack/react-query";
import { Address, getAddress, isAddressEqual } from "viem";
import { Registration } from "./types";

/**
 * The data model returned by a GraphQL query for registrations.
 */
interface RegistrationResult {
  registrationDate: UnixTimestampInSeconds;
  expiryDate: UnixTimestampInSeconds;
  domain: {
    name: string;
    createdAt: UnixTimestampInSeconds;
    expiryDate: UnixTimestampInSeconds;
    owner: {
      id: Address;
    };
    wrappedOwner?: {
      id: Address;
    };
  };
}

/**
 * Determines the effective owner of a domain.
 * If the owner is the NameWrapper contract, returns the wrapped owner instead.
 */
function getEffectiveOwner(
  registrationResult: RegistrationResult,
  namespaceId: ENSNamespaceId | null,
): Address {
  const nameWrapperAddress = getNameWrapperAddress(namespaceId);
  // Use the regular owner if it's not the NameWrapper contract
  if (!isAddressEqual(registrationResult.domain.owner.id, nameWrapperAddress)) {
    return getAddress(registrationResult.domain.owner.id);
  }

  // Otherwise, use wrapped owner, if it exists
  if (!registrationResult.domain.wrappedOwner) {
    throw new Error(
      "Wrapped owner is not defined while the 'official' owner is an ENS Name Wrapper",
    );
  }

  return getAddress(registrationResult.domain.wrappedOwner.id);
}

/**
 * Transforms a RegistrationResult into a Registration
 */
function toRegistration(
  registrationResult: RegistrationResult,
  namespaceId: ENSNamespaceId | null,
): Registration {
  return {
    registeredAt: unixTimestampToDate(registrationResult.registrationDate),
    expiresAt: unixTimestampToDate(registrationResult.expiryDate),
    name: registrationResult.domain.name,
    ownerInRegistry: getAddress(registrationResult.domain.owner.id),
    ownerInNameWrapper: registrationResult.domain.wrappedOwner
      ? getAddress(registrationResult.domain.wrappedOwner.id)
      : undefined,
    owner: getEffectiveOwner(registrationResult, namespaceId),
  };
}

/**
 * Fetches info about the most recent registrations that have been indexed.
 */
async function fetchRecentRegistrations(
  baseUrl: URL,
  maxResults: number,
): Promise<RegistrationResult[]> {
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

  return data.data.registrations;
}

/**
 * Hook to fetch info about most recently registered domains that have been indexed.
 *
 * @param ensNodeURL The URL of the selected ENS node instance.
 * @param maxResults The max number of recent registrations to retrieve
 * @param namespaceId The ENSNamespace identifier (e.g. 'mainnet', 'sepolia', 'holesky', 'ens-test-env')
 */
export function useRecentRegistrations(
  ensNodeURL: URL,
  maxResults: number,
  namespaceId: ENSNamespaceId | null, //TODO: it would be optimal if it was not nullable, but idk yet how to achieve this (dependency on the other hook)
) {
  return useQuery({
    queryKey: ["recent-registrations", ensNodeURL],
    queryFn: () => fetchRecentRegistrations(ensNodeURL, maxResults),
    // Select the registrations from the response
    select: (data): Registration[] =>
      data.map((registration: RegistrationResult) => toRegistration(registration, namespaceId)),
    throwOnError(error) {
      throw new Error(
        `Could not fetch recent registrations from '${ensNodeURL}'. Cause: ${error.message}`,
      );
    },
  });
}
