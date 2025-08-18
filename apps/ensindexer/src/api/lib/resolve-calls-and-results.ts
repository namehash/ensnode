import { ResolverABI } from "@ensnode/datasources";
import type { Name, Node, ResolverRecordsSelection } from "@ensnode/ensnode-sdk";
import { trace } from "@opentelemetry/api";
import {
  type Address,
  ContractFunctionExecutionError,
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

import { withActiveSpanAsync, withSpanAsync } from "@/lib/auto-span";
import { sanitizeNameRecordValue } from "@/lib/sanitize-name-record";

const tracer = trace.getTracer("resolve-calls-and-results");

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
 *
 * TODO: CCIP-Read Gateways can fail, should likely implement retries?
 */
export async function executeResolveCalls<SELECTION extends ResolverRecordsSelection>({
  name,
  resolverAddress,
  useENSIP10Resolve,
  calls,
  publicClient,
}: {
  name: Name;
  resolverAddress: Address;
  useENSIP10Resolve: boolean;
  calls: ResolveCalls<SELECTION>;
  publicClient: PublicClient;
}): Promise<ResolveCallsAndRawResults<SELECTION>> {
  return withActiveSpanAsync(tracer, "executeResolveCalls", { name }, async (span) => {
    const ResolverContract = { abi: ResolverABI, address: resolverAddress } as const;

    return await Promise.all(
      calls.map(async (call) => {
        try {
          // NOTE: ENSIP-10 — If extended resolver, resolver.resolve(name, data)
          if (useENSIP10Resolve) {
            return await withSpanAsync(
              tracer,
              `resolve(${call.functionName}, ${call.args})`,
              {},
              async (span) => {
                const encodedName = toHex(packetToBytes(name)); // DNS-encode `name` for resolve()
                const encodedMethod = encodeFunctionData({ abi: ResolverABI, ...call });

                span.setAttribute("encodedName", encodedName);
                span.setAttribute("encodedMethod", encodedMethod);

                const value = await publicClient.readContract({
                  ...ResolverContract,
                  functionName: "resolve",
                  args: [encodedName, encodedMethod],
                });

                // if resolve() returned empty bytes or reverted, coalece to null
                if (size(value) === 0) {
                  span.setAttribute("result", "null");
                  return { call, result: null, reason: "returned empty response" };
                }

                // ENSIP-10 — resolve() always returns bytes that need to be decoded
                const results = decodeAbiParameters(
                  getAbiItem({ abi: ResolverABI, name: call.functionName, args: call.args })
                    .outputs,
                  value,
                );

                // NOTE: results is type-guaranteed to have at least 1 result (because each abi item's outputs.length >= 1)
                const result = results[0];

                span.setAttribute("result", result);

                return {
                  call,
                  result: result,
                  reason: `.resolve(${call.functionName}, ${call.args})`,
                };
              },
            );
          }

          // if not extended resolver, resolve directly
          return withSpanAsync(tracer, `${call.functionName}(${call.args})`, {}, async () => {
            // NOTE: discrimminate against the `functionName` type, otherwise typescript complains about
            // `call` not matching the expected types of the `readContract` arguments. also helpfully
            // infers the return type of `readContract` matches the result type of each `call`
            switch (call.functionName) {
              case "name":
                return {
                  call,
                  result: await publicClient.readContract({ ...ResolverContract, ...call }),
                  reason: `.name(${call.args})`,
                };
              case "addr":
                return {
                  call,
                  result: await publicClient.readContract({ ...ResolverContract, ...call }),
                  reason: `.addr(${call.args})`,
                };
              case "text":
                return {
                  call,
                  result: await publicClient.readContract({ ...ResolverContract, ...call }),
                  reason: `.text(${call.args})`,
                };
            }
          });
        } catch (error) {
          if (error instanceof Error) span.recordException(error);

          // in general, reverts are expected behavior
          if (error instanceof ContractFunctionExecutionError) {
            return { call, result: null, reason: error.shortMessage };
          }

          // otherwise, rethrow
          throw error;
        }
      }),
    );
  });
}

/**
 * Interprets the raw rpc results into more application-specific semantic values.
 *
 * ex: converting 0x, empty string, or zeroAddress to null, etc
 */
export function interpretRawCallsAndResults<SELECTION extends ResolverRecordsSelection>(
  callsAndRawResults: ResolveCallsAndRawResults<SELECTION>,
): ResolveCallsAndResults<SELECTION> {
  return callsAndRawResults.map(({ call, result }) => {
    // pass along null results, nothing to do
    if (result === null) return { call, result };

    switch (call.functionName) {
      // make sure address is valid (i.e. specifically not empty bytes)
      case "addr": {
        // coerce '0x' empty result to null
        if (result === "0x") return { call, result: null };

        // if it is a valid EVM address...
        if (isAddress(result)) {
          // coerce zeroAddress to null
          if (isAddressEqual(result, zeroAddress)) return { call, result: null };

          // otherwise, ensure checksummed
          return { call, result: getAddress(result) };
        }

        // not an EVM address, just coerce falsy string values (i.e. empty string) to null
        if (!result) return { call, result: null };

        // and otherwise return it as-is
        return { call, result };
      }
      // for name records, we need to sanitize the result
      case "name": {
        return { call, result: sanitizeNameRecordValue(result) };
      }
      case "text": {
        // coalesce falsy string values (i.e. empty string) to null
        if (!result) return { call, result: null };

        // and otherwise return it as-is
        return { call, result };
      }
    }
  });
}
