import config from "@/config";
import { getDatasourceAsFullyDefinedAtCompileTime } from "@/lib/plugin-helpers";
import { DatasourceNames } from "@ensnode/datasources";
import { AccountId, ChainId } from "@ensnode/ensnode-sdk";
import { Address, isAddressEqual } from "viem";

const ensRoot = getDatasourceAsFullyDefinedAtCompileTime(config.namespace, DatasourceNames.ENSRoot);
const basenames = getDatasourceAsFullyDefinedAtCompileTime(
  config.namespace,
  DatasourceNames.Basenames,
);
const lineanames = getDatasourceAsFullyDefinedAtCompileTime(
  config.namespace,
  DatasourceNames.Lineanames,
);

/**
 * For a given `resolverAddress` on a specific `chainId`, if it is an Offchain Lookup Resolver, return
 * the chainId whose (shadow)Registry it defers resolution to.
 *
 * These Offchain Lookup Resolvers must abide the following pattern:
 * 1. They _always_ emit OffchainLookup for any resolve() call to a well-known CCIP-Read Gateway
 * 2. That CCIP-Read Gateway exclusively sources the data necessary to process CCIP-Read Requests from
 *   the indicated chain.
 * 3. Its behavior is unlikely to change (i.e. the contract is not upgradable or is unlikely to be
 *   upgraded in a way that violates principles 1. or 2.).
 *
 * The intent is to encode the following information:
 * - base.eth name on ENS Root Chain always emits OffchainLookup to resolve against the
 *   (shadow)Registry on Base (or Base Sepolia, etc)
 * - linea.eth name on ENS Root Chain always emits OffchainLookup to resolve against the
 *   (shadow)Registry on Linea (or Linea Sepolia, etc)
 *
 * TODO: these relationships could/should be encoded in an ENSIP, likely as a mapping from
 * resolverAddress to (shadow)Registry on a specified chain.
 */
export function possibleKnownOffchainLookupResolverDefersTo(
  chainId: ChainId,
  resolverAddress: Address,
): AccountId | null {
  // on the ENS Deployment Chain
  if (chainId === ensRoot.chain.id) {
    // NOTE: using getDatasourceAsFullyDefinedAtCompileTime requires runtime definition check
    if (basenames) {
      // the ENSRoot's BasenamesL1Resolver, if exists, defers to the Basenames chain
      if (isAddressEqual(resolverAddress, ensRoot.contracts.BasenamesL1Resolver.address)) {
        return {
          chainId: basenames.chain.id,
          address: basenames.contracts.Registry.address as Address,
        };
      }
    }

    // NOTE: using getDatasourceAsFullyDefinedAtCompileTime requires runtime definition check
    if (lineanames) {
      // the ENSRoot's LineanamesL1Resolver, if exists, defers to the Lineanames chain
      if (isAddressEqual(resolverAddress, ensRoot.contracts.LineanamesL1Resolver.address)) {
        return {
          chainId: lineanames.chain.id,
          address: lineanames.contracts.Registry.address,
        };
      }
    }

    // TODO: ThreeDNS
  }

  return null;
}
