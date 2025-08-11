import type { ChainId, Name } from "@ensnode/ensnode-sdk";
import { trace } from "@opentelemetry/api";
import type { Address } from "viem";

import { resolveReverse } from "@/api/lib/resolution/reverse-resolution";
import config from "@/config";
import { withActiveSpanAsync } from "@/lib/auto-span";
import { ENSNamespaceIds } from "@ensnode/datasources";

const tracer = trace.getTracer("batch-reverse-resolution");

// TODO: replace with deriving from datasources
const CHAIN_IDS_BY_NAMESPACE = {
  // Mainnet via https://docs.ens.domains/ensip/19/#mainnet
  [ENSNamespaceIds.Mainnet]: [0, 1, 10, 8453, 42161, 59144, 59144],

  // Sepolia via https://docs.ens.domains/ensip/19/#sepolia
  [ENSNamespaceIds.Sepolia]: [0, 1, 11155420, 59141, 84532, 421614, 534351],

  [ENSNamespaceIds.Holesky]: [0, 1],
  [ENSNamespaceIds.EnsTestEnv]: [0, 1],
} as const;

type PrimaryNames = Record<ChainId, Name | null>;

/**
 * Implements batch resolution of an address' Primary Name across the provided `chainIds`. If
 * `chainIds` is undefined, defaults to the set of well-known ENSIP-19 chains.
 *
 * @see https://docs.ens.domains/ensip/19
 *
 * @param address the adddress whose Primary Names to resolve
 * @param chainIds the set of chainIds within which to resolve the address' Primary Name
 */
export async function batchResolveReverse(
  address: Address,
  chainIds: ChainId[] | undefined,
  options: { accelerate?: boolean } = { accelerate: true },
): Promise<PrimaryNames> {
  const _chainIds = chainIds || CHAIN_IDS_BY_NAMESPACE[config.namespace];

  // parallel reverseResolve
  const names = await withActiveSpanAsync(tracer, "batchResolveReverse", { address }, () =>
    Promise.all(_chainIds.map((chainId) => resolveReverse(address, chainId, options))),
  );

  // key results by chainId
  return _chainIds.reduce((memo, chainId, i) => {
    // NOTE: names[i] guaranteed to be defined, silly typescript
    memo[chainId] = names[i]!;
    return memo;
  }, {} as PrimaryNames);
}
