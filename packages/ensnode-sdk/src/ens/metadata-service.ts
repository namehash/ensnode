import type { ENSNamespaceId } from "@ensnode/datasources";
import { ENSNamespaceIds } from "@ensnode/datasources";

import type { Name } from "./types";

/**
 * Build the avatar image URL for a name on the given ENS Namespace that (once fetched) would
 * load the avatar image for the given name from the ENS Metadata Service
 * (https://metadata.ens.domains/docs).
 *
 * The returned URL is dynamically built based on the provided ENS namespace. Not all ENS
 * namespaces are supported by the ENS Metadata Service. Therefore, the returned URL may
 * be null.
 *
 * @param {Name} name - ENS name to build the avatar image URL for
 * @param {ENSNamespaceId} namespaceId - ENS Namespace identifier
 * @returns avatar image URL for the name on the given ENS Namespace, or null if the given
 *          ENS namespace is not supported by the ENS Metadata Service
 */
export function buildEnsMetadataServiceAvatarUrl(
  name: Name,
  namespaceId: ENSNamespaceId,
): URL | null {
  switch (namespaceId) {
    case ENSNamespaceIds.Mainnet:
      return new URL(name, `https://metadata.ens.domains/mainnet/avatar/`);
    case ENSNamespaceIds.Sepolia:
      return new URL(name, `https://metadata.ens.domains/sepolia/avatar/`);
    case ENSNamespaceIds.Holesky:
      // metadata.ens.domains doesn't currently support holesky
      return null;
    case ENSNamespaceIds.EnsTestEnv:
      // ens-test-env runs on a local chain and is not supported by metadata.ens.domains
      // TODO: Above comment is not true. Details at https://github.com/namehash/ensnode/issues/1078
      return null;
  }
}
