import type { Name } from "@ensnode/ensnode-sdk";
import { trace } from "@opentelemetry/api";
import type { Address } from "viem";

import { resolveReverse } from "@/api/lib/reverse-resolution";
import config from "@/config";
import { withActiveSpanAsync } from "@/lib/auto-span";
import { ENSNamespaceIds } from "@ensnode/datasources";

const tracer = trace.getTracer("primary-names-resolution");

const COIN_TYPES_BY_NAMESPACE = {
  // Mainnet via https://docs.ens.domains/ensip/19/#mainnet
  [ENSNamespaceIds.Mainnet]: [0, 1, 10, 8453, 42161, 59144, 59144],

  // Sepolia via https://docs.ens.domains/ensip/19/#sepolia
  [ENSNamespaceIds.Sepolia]: [0, 1, 11155420, 59141, 84532, 421614, 534351],

  [ENSNamespaceIds.Holesky]: [0, 1],
  [ENSNamespaceIds.EnsTestEnv]: [0, 1],
} as const;

type PrimaryNames = Record<number, Name | null>;

/**
 * Implements batch resolution of an address' Primary Name for all well-known EVM Chain Ids.
 *
 * @see https://docs.ens.domains/ensip/19
 *
 * @param address the adddress to lookup the Primary Names of
 */
export async function resolvePrimaryNames(
  address: Address,
  options: { accelerate?: boolean } = { accelerate: true },
): Promise<PrimaryNames> {
  const chainIds = COIN_TYPES_BY_NAMESPACE[config.namespace];

  const names = await withActiveSpanAsync(tracer, "resolvePrimaryNames", { address }, () =>
    Promise.all(chainIds.map((chainId) => resolveReverse(address, chainId, options))),
  );

  return chainIds.reduce((memo, chainId, i) => {
    // NOTE: names[i] guaranteed to not be undefined
    memo[chainId] = names[i]!;
    return memo;
  }, {} as PrimaryNames);
}
