import { trace } from "@opentelemetry/api";
import { mainnet } from "viem/chains";

import { DatasourceNames, type ENSNamespaceId, maybeGetDatasource } from "@ensnode/datasources";
import {
  type MultichainPrimaryNameResolutionArgs,
  type MultichainPrimaryNameResolutionResult,
  uniq,
} from "@ensnode/ensnode-sdk";

import { withActiveSpanAsync } from "@/lib/instrumentation/auto-span";
import { resolveReverse } from "@/lib/resolution/reverse-resolution";

const tracer = trace.getTracer("multichain-primary-name-resolution");

const getENSIP19SupportedChainIds = (namespace: ENSNamespaceId) => [
  // always include Mainnet, because its chainId corresponds to the ENS Root Chain's coinType,
  // regardless of the current namespace
  mainnet.id,

  // then include any ENSIP-19 Supported Chains defined in this namespace
  ...uniq(
    [
      maybeGetDatasource(namespace, DatasourceNames.ReverseResolverRoot),
      maybeGetDatasource(namespace, DatasourceNames.ReverseResolverBase),
      maybeGetDatasource(namespace, DatasourceNames.ReverseResolverLinea),
      maybeGetDatasource(namespace, DatasourceNames.ReverseResolverOptimism),
      maybeGetDatasource(namespace, DatasourceNames.ReverseResolverArbitrum),
      maybeGetDatasource(namespace, DatasourceNames.ReverseResolverScroll),
    ]
      .filter((ds) => ds !== undefined)
      .map((ds) => ds.chain.id),
  ),
];

/**
 * Implements batch resolution of an address' Primary Name across the provided `chainIds`.
 *
 * @see https://docs.ens.domains/ensip/19
 *
 * @param namespace the ENS namespace within which to resolve the address' Primary Names
 * @param plugins the set of plugins to use for resolution
 * @param address the adddress whose Primary Names to resolve
 * @param chainIds the set of chainIds within which to resolve the address' Primary Name (default:
 * all ENSIP-19 supported chains)
 * @param options Optional settings
 * @param options.accelerate Whether acceleration is requested (default: true)
 * @param options.canAccelerate Whether acceleration is currently possible (default: false)
 */
export async function resolvePrimaryNames(
  namespace: ENSNamespaceId,
  plugins: string[],
  address: MultichainPrimaryNameResolutionArgs["address"],
  chainIds: MultichainPrimaryNameResolutionArgs["chainIds"],
  options: Parameters<typeof resolveReverse>[4],
): Promise<MultichainPrimaryNameResolutionResult> {
  const _chainIds = chainIds ?? getENSIP19SupportedChainIds(namespace);

  // parallel reverseResolve
  const names = await withActiveSpanAsync(tracer, "resolvePrimaryNames", { address }, () =>
    Promise.all(
      _chainIds.map((chainId) => resolveReverse(namespace, plugins, address, chainId, options)),
    ),
  );

  // key results by chainId
  return _chainIds.reduce((memo, chainId, i) => {
    // biome-ignore lint/style/noNonNullAssertion: names[i] guaranteed to be defined
    memo[chainId] = names[i]!;
    return memo;
  }, {} as MultichainPrimaryNameResolutionResult);
}
