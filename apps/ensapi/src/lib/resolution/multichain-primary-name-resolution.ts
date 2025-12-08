import config from "@/config";

import { trace } from "@opentelemetry/api";

import { DatasourceNames, getDatasource, maybeGetDatasource } from "@ensnode/datasources";
import {
  type ChainId,
  type MultichainPrimaryNameResolutionArgs,
  type MultichainPrimaryNameResolutionResult,
  uniq,
} from "@ensnode/ensnode-sdk";

import { resolveReverse } from "@/lib/resolution/reverse-resolution";
import { withActiveSpanAsync } from "@/lib/tracing/auto-span";

const tracer = trace.getTracer("multichain-primary-name-resolution");

const ENSIP19_SUPPORTED_CHAIN_IDS: ChainId[] = uniq(
  [
    // always include the ENS Root Chain
    getDatasource(config.namespace, DatasourceNames.ENSRoot),

    // include all ENSIP-19 Supported Chains defined in this namespace
    maybeGetDatasource(config.namespace, DatasourceNames.ReverseResolverRoot),
    maybeGetDatasource(config.namespace, DatasourceNames.ReverseResolverBase),
    maybeGetDatasource(config.namespace, DatasourceNames.ReverseResolverLinea),
    maybeGetDatasource(config.namespace, DatasourceNames.ReverseResolverOptimism),
    maybeGetDatasource(config.namespace, DatasourceNames.ReverseResolverArbitrum),
    maybeGetDatasource(config.namespace, DatasourceNames.ReverseResolverScroll),
  ]
    .filter((ds) => ds !== undefined)
    .map((ds) => ds.chain.id),
);

/**
 * Implements batch resolution of an address' Primary Name across the provided `chainIds`.
 *
 * @see https://docs.ens.domains/ensip/19
 *
 * @param address the adddress whose Primary Names to resolve
 * @param chainIds the set of chainIds within which to resolve the address' Primary Name (default:
 * all ENSIP-19 supported chains)
 * @param options Optional settings
 * @param options.accelerate Whether acceleration is requested (default: true)
 * @param options.canAccelerate Whether acceleration is currently possible (default: false)
 */
export async function resolvePrimaryNames(
  address: MultichainPrimaryNameResolutionArgs["address"],
  chainIds: MultichainPrimaryNameResolutionArgs["chainIds"] = ENSIP19_SUPPORTED_CHAIN_IDS,
  options: Parameters<typeof resolveReverse>[2],
): Promise<MultichainPrimaryNameResolutionResult> {
  // parallel reverseResolve
  const names = await withActiveSpanAsync(tracer, "resolvePrimaryNames", { address }, () =>
    Promise.all(chainIds.map((chainId) => resolveReverse(address, chainId, options))),
  );

  // key results by chainId
  return chainIds.reduce((memo, chainId, i) => {
    // biome-ignore lint/style/noNonNullAssertion: names[i] guaranteed to be defined
    memo[chainId] = names[i]!;
    return memo;
  }, {} as MultichainPrimaryNameResolutionResult);
}
