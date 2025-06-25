import {
  UnixTimestampInSeconds,
  unixTimestampToDate,
} from "@/components/recent-registrations/utils";
import { ensAdminVersion } from "@/lib/env";
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
 * The NameWrapper contract address
 */
const FALLBACK_NAME_WRAPPER_ADDRESS = "0xd4416b13d2b3a9abae7acd5d6c2bbdbe25686401";

/**
 * Determines the effective owner of a domain.
 * If the owner is the NameWrapper contract, returns the wrapped owner instead.
 */

//TODO: for now this function handles nameWrapperAddress being possibly undefined, but that will probably change
function getEffectiveOwner(
  registrationResult: RegistrationResult,
  nameWrapperAddress: Address | null,
): Address {
  const validatedNameWrapperAddress = nameWrapperAddress || FALLBACK_NAME_WRAPPER_ADDRESS;
  // Use the regular owner if it's not the NameWrapper contract
  if (!isAddressEqual(registrationResult.domain.owner.id, validatedNameWrapperAddress)) {
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
  nameWrapperAddress: Address | null,
): Registration {
  return {
    registeredAt: unixTimestampToDate(registrationResult.registrationDate),
    expiresAt: unixTimestampToDate(registrationResult.expiryDate),
    name: registrationResult.domain.name,
    ownerInRegistry: getAddress(registrationResult.domain.owner.id),
    ownerInNameWrapper: registrationResult.domain.wrappedOwner
      ? getAddress(registrationResult.domain.wrappedOwner.id)
      : undefined,
    owner: getEffectiveOwner(registrationResult, nameWrapperAddress),
  };
}

/**
 * Fetches info about the most recent registrations that have been indexed.
 */
async function fetchRecentRegistrations(
  baseUrl: URL,
  maxResults: number,
  nameWrapperAddress: Address | null,
): Promise<Registration[]> {
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
    toRegistration(registration, nameWrapperAddress),
  );
}

/**
 * Hook to fetch info about most recently registered domains that have been indexed.
 *
 * @param ensNodeURL The URL of the selected ENS node instance.
 * @param maxResults the max number of recent registrations to retrieve
 * @param nameWrapperAddress address necessary for the determination of the effective owner of a domain
 */
export function useRecentRegistrations(
  ensNodeURL: URL,
  maxResults: number,
  nameWrapperAddress: Address | null,
) {
  return useQuery({
    queryKey: ["recent-registrations", ensNodeURL],
    queryFn: () => fetchRecentRegistrations(ensNodeURL, maxResults, nameWrapperAddress),
    throwOnError(error) {
      throw new Error(
        `Could not fetch recent registrations from '${ensNodeURL}'. Cause: ${error.message}`,
      );
    },
  });
}
