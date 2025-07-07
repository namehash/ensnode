import config from "@/config";
import { ENSNamespace, getENSNamespace } from "@ensnode/datasources";
import { PluginName } from "@ensnode/ensnode-sdk";
import { Address, isAddressEqual } from "viem";

// NOTE: typing as ENSNamespace so we can access possibly undefined Datasources
const ensNamespace = getENSNamespace(config.namespace) as ENSNamespace;

/**
 * For a given `resolverAddress` on a specific `chainId`, return the `PluginName` that, if it were
 * active, indexes all Domains (and Resolvers) necessary to answer resolution requests.
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
 *   (sub-)Registry on Base (or Base Sepolia, etc)
 * - linea.eth name on ENS Root Chain always emits OffchainLookup to resolve against the
 *   (sub-)Registry on Linea (or Linea Sepolia, etc)
 *
 * NOTE: ContractConfig['address'] can be Address | Address[] but we know all of these are just Address
 *
 * TODO: these relationships could/should be encoded in an ENSIP, likely as a mapping from
 * resolverAddress to (sub-)Registry on a specified chain.
 */
export function possibleKnownOffchainLookupResolverDefersTo(
  chainId: number,
  resolverAddress: Address,
): { pluginName: PluginName; chainId: number | undefined } | null {
  // on the ENS Deployment Chain
  if (chainId === ensNamespace.ensroot.chain.id) {
    const basenamesL1ResolverAddress = ensNamespace.ensroot.contracts.BasenamesL1Resolver
      ?.address as Address | undefined;

    // the ENSRoot's BasenamesL1Resolver, if exists, defers to the Basenames plugin
    if (basenamesL1ResolverAddress && isAddressEqual(resolverAddress, basenamesL1ResolverAddress)) {
      return {
        pluginName: PluginName.Basenames,
        chainId: ensNamespace.basenames?.chain.id,
      };
    }

    const lineanamesL1ResolverAddress = ensNamespace.ensroot.contracts.LineanamesL1Resolver
      ?.address as Address | undefined;

    // the ENSRoot's BasenamesL1Resolver, if exists, defers to the Lineanames plugin
    if (
      lineanamesL1ResolverAddress &&
      isAddressEqual(resolverAddress, lineanamesL1ResolverAddress)
    ) {
      return {
        pluginName: PluginName.Lineanames,
        chainId: ensNamespace.lineanames?.chain.id,
      };
    }

    // TODO: ThreeDNS
  }

  return null;
}
