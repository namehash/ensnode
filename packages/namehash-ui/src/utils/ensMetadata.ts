import type { ENSNamespaceId } from "@ensnode/datasources";
import { ENSNamespaceIds, type Name } from "@ensnode/ensnode-sdk";

/**
 * Builds the ENS Metadata Service avatar URL for a given ENS name and namespace.
 *
 * @param name - ENS name to build the avatar URL for
 * @param namespaceId - ENS namespace identifier used to select the metadata endpoint
 * @returns The avatar image URL for the name on the specified ENS namespace, or `null` if the namespace is not supported
 */
export function getEnsMetadataServiceAvatarUrl(
  name: Name,
  namespaceId: ENSNamespaceId,
): URL | null {
  switch (namespaceId) {
    case ENSNamespaceIds.Mainnet:
      return new URL(name, `https://metadata.ens.domains/mainnet/avatar/`);
    case ENSNamespaceIds.Sepolia:
    case ENSNamespaceIds.SepoliaV2:
      return new URL(name, `https://metadata.ens.domains/sepolia/avatar/`);
    case ENSNamespaceIds.EnsTestEnv:
      // ens-test-env runs on a local chain and is not supported by metadata.ens.domains
      // TODO: Above comment is not true. Details at https://github.com/namehash/ensnode/issues/1078
      return null;
  }
}