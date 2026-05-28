import { trace } from "@opentelemetry/api";
import type { Address, CoinType } from "enssdk";
import { mainnet } from "viem/chains";

import { DatasourceNames, maybeGetDatasource } from "@ensnode/datasources";
import {
  type MultichainPrimaryNameResolutionArgs,
  type MultichainPrimaryNameResolutionResult,
  type ReverseResolutionResult,
  uniq,
} from "@ensnode/ensnode-sdk";

import di from "@/di";
import { withActiveSpanAsync } from "@/lib/instrumentation/auto-span";
import { resolveReverse, resolveReverseByCoinType } from "@/lib/resolution/reverse-resolution";

const tracer = trace.getTracer("multichain-primary-name-resolution");

export const getENSIP19SupportedChainIds = () => {
  return uniq([
    // always include Mainnet, because its chainId corresponds to the ENS Root Chain's coinType,
    // regardless of the current namespace
    mainnet.id,

    // then include any ENSIP-19 Supported Chains defined in this namespace
    ...[
      maybeGetDatasource(di.context.namespace, DatasourceNames.ReverseResolverRoot),
      maybeGetDatasource(di.context.namespace, DatasourceNames.ReverseResolverBase),
      maybeGetDatasource(di.context.namespace, DatasourceNames.ReverseResolverLinea),
      maybeGetDatasource(di.context.namespace, DatasourceNames.ReverseResolverOptimism),
      maybeGetDatasource(di.context.namespace, DatasourceNames.ReverseResolverArbitrum),
      maybeGetDatasource(di.context.namespace, DatasourceNames.ReverseResolverScroll),
    ]
      .filter((ds) => ds !== undefined)
      .map((ds) => ds.chain.id),
  ]);
};

export type MultichainPrimaryNameByCoinTypeResolutionResult = Partial<
  Record<CoinType, ReverseResolutionResult>
>;

type PrimaryNameResolutionOptions = Parameters<typeof resolveReverseByCoinType>[2];

/**
 * Batch-resolves an address' primary name for each requested coin type.
 *
 * @see https://docs.ens.domains/ensip/19
 */
export async function resolvePrimaryNamesByCoinTypes(
  address: Address,
  coinTypes: CoinType[],
  options: PrimaryNameResolutionOptions,
): Promise<MultichainPrimaryNameByCoinTypeResolutionResult> {
  const names = await withActiveSpanAsync(
    tracer,
    "resolvePrimaryNamesByCoinTypes",
    { address },
    () =>
      Promise.all(
        coinTypes.map((coinType) => resolveReverseByCoinType(address, coinType, options)),
      ),
  );

  return coinTypes.reduce((memo, coinType, i) => {
    // biome-ignore lint/style/noNonNullAssertion: names[i] guaranteed to be defined
    memo[coinType] = names[i]!;
    return memo;
  }, {} as MultichainPrimaryNameByCoinTypeResolutionResult);
}

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
  chainIds: MultichainPrimaryNameResolutionArgs["chainIds"] = getENSIP19SupportedChainIds(),
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
