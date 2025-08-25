import config from "@/config";
import { ChainId, DatasourceNames, maybeGetDatasource } from "@ensnode/datasources";
import { PluginName } from "@ensnode/ensnode-sdk";
import { Address, isAddressEqual } from "viem";

// NOTE: we know ensRoot is defined for all namespaces, so enforce that at runtime with !
const ensRoot = maybeGetDatasource(config.namespace, DatasourceNames.ENSRoot)!;
const basenames = maybeGetDatasource(config.namespace, DatasourceNames.Basenames);
const lineanames = maybeGetDatasource(config.namespace, DatasourceNames.Lineanames);

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
  chainId: ChainId,
  resolverAddress: Address,
): { pluginName: PluginName; chainId: ChainId } | null {
  // on the ENS Deployment Chain
  if (chainId === ensRoot.chain.id) {
    const basenamesL1ResolverAddress = ensRoot.contracts.BasenamesL1Resolver?.address as
      | Address
      | undefined;

    // the ENSRoot's BasenamesL1Resolver, if exists, defers to the Basenames plugin,
    if (
      basenamesL1ResolverAddress &&
      isAddressEqual(resolverAddress, basenamesL1ResolverAddress) &&
      basenames
    ) {
      return {
        pluginName: PluginName.Basenames,
        chainId: basenames.chain.id,
      };
    }

    const lineanamesL1ResolverAddress = ensRoot.contracts.LineanamesL1Resolver?.address as
      | Address
      | undefined;

    // the ENSRoot's BasenamesL1Resolver, if exists, defers to the Lineanames plugin
    if (
      lineanamesL1ResolverAddress &&
      isAddressEqual(resolverAddress, lineanamesL1ResolverAddress) &&
      lineanames
    ) {
      return {
        pluginName: PluginName.Lineanames,
        chainId: lineanames.chain.id,
      };
    }

    // TODO: ThreeDNS
  }

  return null;
}
