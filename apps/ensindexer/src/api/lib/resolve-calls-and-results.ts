import type { Name, Node } from "@ensnode/ensnode-sdk";
import {
  type Address,
  type PublicClient,
  decodeAbiParameters,
  encodeFunctionData,
  getAbiItem,
  getAddress,
  isAddress,
  isAddressEqual,
  size,
  toHex,
  zeroAddress,
} from "viem";
import { packetToBytes } from "viem/ens";

import { DatasourceNames, ENSNamespaceIds, getDatasource } from "@ensnode/datasources";
import type { ResolverRecordsSelection } from "./resolver-records-selection";

// for all relevant eth_calls here, all Resolver contracts share the same abi, so just grab one from
// @ensnode/datasources that is guaranted to exist
const RESOLVER_ABI = getDatasource(ENSNamespaceIds.Mainnet, DatasourceNames.ENSRoot).contracts
  .Resolver.abi;

/**
 * Represents a set of eth_call arguments to a Resolver
 */
export type ResolveCalls<SELECTION extends ResolverRecordsSelection> = ReturnType<
  typeof makeResolveCalls<SELECTION>
>;

/**
 * Represents a set of eth_calls to a Resolver and their _raw_ results from the rpc.
 *
 * NOTE: using conditional branches to support future calls that may not return string
 */
export type ResolveCallsAndRawResults<SELECTION extends ResolverRecordsSelection> = Array<{
  call: ResolveCalls<SELECTION>[number];
  result: ResolveCalls<SELECTION>[number] extends { functionName: infer FN }
    ? FN extends "name"
      ? string | null
      : FN extends "addr"
        ? string | null
        : FN extends "text"
          ? string | null
          : unknown
    : unknown;
}>;

/**
 * Represents a set of eth_calls to a Resolver and their (semantically interpreted) results.
 *
 * NOTE: using conditional branches to support future calls that may not result in string | null
 */
export type ResolveCallsAndResults<SELECTION extends ResolverRecordsSelection> = Array<{
  call: ResolveCalls<SELECTION>[number];
  result: ResolveCalls<SELECTION>[number] extends { functionName: infer FN }
    ? FN extends "name"
      ? string | null
      : FN extends "addr"
        ? string | null
        : FN extends "text"
          ? string | null
          : unknown
    : unknown;
}>;

// builds an array of calls from a ResolverRecordsSelection
export function makeResolveCalls<SELECTION extends ResolverRecordsSelection>(
  node: Node,
  selection: SELECTION,
) {
  return [
    selection.name && ({ functionName: "name", args: [node] } as const),
    ...(selection.addresses ?? []).map(
      (coinType) =>
        ({
          functionName: "addr",
          args: [node, BigInt(coinType)],
        }) as const,
    ),
    ...(selection.texts ?? []).map(
      (key) =>
        ({
          functionName: "text",
          args: [node, key],
        }) as const,
    ),
  ].filter(
    // filter out falsy values, excluding them from the inferred type
    (call): call is Exclude<typeof call, undefined | null | false> => !!call,
  );
}

/**
 * Execute a set of ResolveCalls against the provided `resolverAddress`.
 *
 * NOTE: viem#readContract implements CCIP-Read, so we get that behavior for free
 * NOTE: viem#multicall _doesn't_ implement CCIP-Read so maybe this can be optimized further
 */
export async function executeResolveCalls<SELECTION extends ResolverRecordsSelection>({
  name,
  resolverAddress,
  requiresWildcardSupport,
  calls,
  publicClient,
}: {
  name: Name;
  resolverAddress: Address;
  requiresWildcardSupport: boolean;
  calls: ResolveCalls<SELECTION>;
  publicClient: PublicClient;
}): Promise<ResolveCallsAndRawResults<SELECTION>> {
  const ResolverContract = { abi: RESOLVER_ABI, address: resolverAddress } as const;

  return await Promise.all(
    calls.map(async (call) => {
      // NOTE: ENSIP-10 — If extended resolver, resolver.resolve(name, data)
      if (requiresWildcardSupport) {
        const value = await publicClient.readContract({
          ...ResolverContract,
          functionName: "resolve",
          args: [
            toHex(packetToBytes(name)), // DNS-encode `name` for resolve()
            encodeFunctionData({ abi: RESOLVER_ABI, ...call }),
          ],
        });

        // if resolve() returned empty bytes or reverted, coalece to null
        if (size(value) === 0) return { call, result: null };

        // ENSIP-10 resolve() always returns bytes that need to be decoded
        const results = decodeAbiParameters(
          getAbiItem({ abi: RESOLVER_ABI, name: call.functionName, args: call.args }).outputs,
          value,
        );

        // NOTE: results is type-guaranteed to have at least 1 result (because each abi item's outputs.length > 0)
        return { call, result: results[0] };
      }

      // if not extended resolver, resolve directly
      // NOTE: discrimminate against the `functionName` type, otherwise typescript complains about
      // `call` not matching the expected types of the `readContract` arguments. also helpfully
      // infers the return type of `readContract` matches the result type of each `call`
      switch (call.functionName) {
        case "name":
          return {
            call,
            result: await publicClient.readContract({ ...ResolverContract, ...call }),
          };
        case "addr":
          return {
            call,
            result: await publicClient.readContract({ ...ResolverContract, ...call }),
          };
        case "text":
          return {
            call,
            result: await publicClient.readContract({ ...ResolverContract, ...call }),
          };
      }
    }),
  );
}

export function interpretRawCallsAndResults<SELECTION extends ResolverRecordsSelection>(
  callsAndRawResults: ResolveCallsAndRawResults<SELECTION>,
): ResolveCallsAndResults<SELECTION> {
  return callsAndRawResults.map(({ call, result }) => {
    // pass along null results, nothing to do
    if (result === null) return { call, result };

    switch (call.functionName) {
      // make sure address is valid (i.e. specifically not empty bytes)
      case "addr": {
        // if it is a valid EVM address...
        if (isAddress(result)) {
          // coerce zeroAddress to null
          if (isAddressEqual(result, zeroAddress)) return { call, result: null };

          // otherwise, ensure checksummed
          return { call, result: getAddress(result) };
        }

        // otherwise, it's not an EVM address, so we coerce falsy string values to null
        // but otherwise return it as-is
        return { call, result: result || null };
      }
      // for name and text recods, just coalesce falsy string values to null
      case "name":
      case "text":
        return { call, result: result || null };
    }
  });
}
