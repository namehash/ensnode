import { DefaultableChainId, ENSNamespaceId, Name } from "@ensnode/ensnode-sdk";
import { Address } from "viem";

/**
 * Represents the result of an ENSIP-19 identity resolution.
 */
export interface ResolvedIdentity {
  /**
   * The address of the identity that was resolved.
   */
  address: Address;

  /**
   * If `null`, represents that `address` had no primary name on `chainId`.
   */
  name: Name | null;

  /**
   * The namespace of the identity that was resolved.
   */
  namespaceId: ENSNamespaceId;

  /**
   * The defaultable chain id where an ENSIP-19 primary name lookup
   * of `address` returned `name`.
   */
  chainId: DefaultableChainId;
}
