import { useActiveNamespace } from "@/hooks/active/use-active-namespace";
import { useSelectedConnection } from "@/hooks/active/use-selected-connection";
import { ensAdminVersion } from "@/lib/env";
import { getNameWrapperAddress } from "@/lib/namespace-utils";
import { ENSNamespaceId } from "@ensnode/datasources";
import { Name, UnixTimestamp, deserializeUnixTimestamp } from "@ensnode/ensnode-sdk";
import { UseQueryResult, useQuery } from "@tanstack/react-query";
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
 * Uses the selected and validated ENSNode connection URL and namespace from context.
 *
 * @returns A React Query result containing an array of Registration objects or an error
 *
 * This hook is protected by multiple upstream guardrails that ensure a valid connection exists:
 * 1. `RequireSelectedConnection` blocks rendering until a connection is selected
 * 2. `SelectedENSNodeProvider` validates URL format and shows fallback UI for invalid URLs
 * 3. `useSelectedConnection` throws if no connection exists
 *
 * The validation check below is defensive programming - it should never fail in production.
 * If it does fail, React Query catches the error and displays it gracefully in the UI (components.tsx:95-100).
 *
 * TODO: Refactor `SelectedENSNodeProvider` to use an error boundary for more graceful
 * handling of invalid connections.
 */
export function useRecentRegistrations({
  maxRecords,
}: UseRecentRegistrationsProps): UseQueryResult<Registration[], Error> {
  const { validatedSelectedConnection } = useSelectedConnection();
  const namespaceId = useActiveNamespace();

  // Defensive validation - protected by upstream guardrails (see JSDoc above)
  if (!validatedSelectedConnection.isValid) {
    throw new Error(`Invalid ENSNode connection: ${validatedSelectedConnection.error}`);
  }

  const ensNodeUrl = validatedSelectedConnection.url;

  return useQuery({
    queryKey: ["recent-registrations", ensNodeUrl.href, namespaceId, maxRecords],
    queryFn: () => fetchRecentRegistrations(ensNodeUrl, maxRecords, namespaceId),
    refetchInterval: 10 * 1000,
    throwOnError(error) {
      throw new Error(
        `Could not fetch recent registrations from '${ensNodeUrl}'. Cause: ${error.message}`,
      );
    },
  });
}
