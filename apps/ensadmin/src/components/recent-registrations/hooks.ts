import { useActiveNamespace } from "@/hooks/active/use-active-namespace";
import { ensAdminVersion } from "@/lib/env";
import { getNameWrapperAddress } from "@/lib/namespace-utils";
import { ENSNamespaceId } from "@ensnode/datasources";
import { useENSIndexerConfig, useENSNodeConfig } from "@ensnode/ensnode-react";
import { Name, UnixTimestamp, deserializeUnixTimestamp } from "@ensnode/ensnode-sdk";
import { useQuery } from "@tanstack/react-query";
import { Address, getAddress, isAddressEqual } from "viem";
import { Registration } from "./types";

/**
 * An integer value (representing a Unix timestamp in seconds) formatted as a string.
 */
export type UnixTimestampString = string;

/**
 * Converts a string representing a Unix timestamp in seconds to a Unix timestamp
 * (a number).
 *
 * @param timestamp - A string representing a Unix timestamp in seconds.
 * @returns A Unix timestamp.
 * @throws An error if the provided string is not properly formatted.
 */
export const toUnixTimestamp = (timestamp: UnixTimestampString): UnixTimestamp => {
  if (timestamp === "") {
    throw new Error("Timestamp cannot be an empty string");
  }

  return deserializeUnixTimestamp(Number(timestamp));
};

/**
 * The data model returned by a GraphQL query for registrations.
 */
interface RegistrationResult {
  registrationDate: UnixTimestampString;
  expiryDate: UnixTimestampString;
  domain: {
    name: Name;
    createdAt: UnixTimestampString;
    expiryDate: UnixTimestampString;
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
 * If the owner is the NameWrapper contract with the specified ENS namespace, returns the wrapped owner instead.
 */
function getEffectiveOwner(
  registrationResult: RegistrationResult,
  namespaceId: ENSNamespaceId,
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
  namespaceId: ENSNamespaceId,
): Registration {
  return {
    registeredAt: toUnixTimestamp(registrationResult.registrationDate),
    expiresAt: toUnixTimestamp(registrationResult.expiryDate),
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
  ensNodeUrl: URL,
  maxResults: number,
  namespaceId: ENSNamespaceId,
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

  const response = await fetch(new URL(`/subgraph`, ensNodeUrl), {
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
    toRegistration(registration, namespaceId),
  );
}

interface UseRecentRegistrationsProps {
  /**
   * The max number of recent registrations to retrieve.
   */
  maxRecords: number;
}

/**
 * Hook to fetch info about most recently registered domains that have been indexed.
 * Uses the selected ENSNode connection URL and namespace from context.
 */
export function useRecentRegistrations({ maxRecords }: UseRecentRegistrationsProps) {
  const config = useENSNodeConfig(undefined);
  const ensNodeUrl = config.client.url;
  const namespaceId = useActiveNamespace();

  return useQuery({
    queryKey: [ensNodeUrl.href, namespaceId, "recent-registrations", maxRecords],
    queryFn: () => fetchRecentRegistrations(ensNodeUrl, maxRecords, namespaceId),
    refetchInterval: 10 * 1000,
    throwOnError(error) {
      throw new Error(
        `Could not fetch recent registrations from '${ensNodeUrl}'. Cause: ${error.message}`,
      );
    },
  });
}
