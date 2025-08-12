import {
  type ChainId,
  type MultichainPrimaryNameResolutionArgs,
  type MultichainPrimaryNameResolutionResult,
  uniq,
} from "@ensnode/ensnode-sdk";
import { trace } from "@opentelemetry/api";

import { resolveReverse } from "@/api/lib/resolution/reverse-resolution";
import config from "@/config";
import { withActiveSpanAsync } from "@/lib/auto-span";
import { DatasourceNames, getDatasource, getDatasourceInAnyNamespace } from "@ensnode/datasources";

const tracer = trace.getTracer("multichain-primary-name-resolution");

const ENSIP19_SUPPORTED_CHAIN_IDS: ChainId[] = uniq(
  [
    // always include the ENS Root Chain
    getDatasource(config.namespace, DatasourceNames.ENSRoot),

    // include all ENSIP-19 Supported Chains defined in this namespace
    getDatasourceInAnyNamespace(config.namespace, DatasourceNames.ReverseResolverRoot),
    getDatasourceInAnyNamespace(config.namespace, DatasourceNames.ReverseResolverBase),
    getDatasourceInAnyNamespace(config.namespace, DatasourceNames.ReverseResolverLinea),
    getDatasourceInAnyNamespace(config.namespace, DatasourceNames.ReverseResolverOptimism),
    getDatasourceInAnyNamespace(config.namespace, DatasourceNames.ReverseResolverArbitrum),
    getDatasourceInAnyNamespace(config.namespace, DatasourceNames.ReverseResolverScroll),
  ]
    .filter((ds) => ds !== undefined)
    .map((ds) => ds.chain.id),
);

/**
 * Implements batch resolution of an address' Primary Name across the provided `chainIds`. If
 * `chainIds` is undefined, defaults to all ENSIP-19 supported chains.
 *
 * @see https://docs.ens.domains/ensip/19
 *
 * @param address the adddress whose Primary Names to resolve
 * @param chainIds the set of chainIds within which to resolve the address' Primary Name
 */
export async function resolvePrimaryNames(
  address: MultichainPrimaryNameResolutionArgs["address"],
  chainIds: MultichainPrimaryNameResolutionArgs["chainIds"] = ENSIP19_SUPPORTED_CHAIN_IDS,
  options: { accelerate?: boolean } = { accelerate: true },
): Promise<MultichainPrimaryNameResolutionResult> {
  // parallel reverseResolve
  const names = await withActiveSpanAsync(tracer, "resolvePrimaryNames", { address }, () =>
    Promise.all(chainIds.map((chainId) => resolveReverse(address, chainId, options))),
  );

  // key results by chainId
  return chainIds.reduce((memo, chainId, i) => {
    // NOTE: names[i] guaranteed to be defined, silly typescript
    memo[chainId] = names[i]!;
    return memo;
  }, {} as MultichainPrimaryNameResolutionResult);
}
