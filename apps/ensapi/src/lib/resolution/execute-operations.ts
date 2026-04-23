import { trace } from "@opentelemetry/api";
import {
  type Address,
  asLiteralName,
  type ContentType,
  type Hex,
  type Name,
  type RecordVersion,
} from "enssdk";
import {
  ContractFunctionExecutionError,
  decodeAbiParameters,
  encodeFunctionData,
  getAbiItem,
  type PublicClient,
  size,
  toHex,
} from "viem";
import { packetToBytes } from "viem/ens";

import { ResolverABI } from "@ensnode/datasources";
import {
  interpretAddress,
  interpretAddressRecordValue,
  interpretContenthashValue,
  interpretDnszonehashValue,
  interpretNameRecordValue,
  interpretPubkeyValue,
  interpretTextRecordValue,
} from "@ensnode/ensnode-sdk/internal";

import { withActiveSpanAsync, withSpanAsync } from "@/lib/instrumentation/auto-span";
import { isOperationResolved, type Operation } from "@/lib/resolution/operations";

const tracer = trace.getTracer("execute-operations");

/**
 * Execute a set of Operations against `resolverAddress`, resolving any unresolved entries.
 * Operations already carrying a `result` (from an earlier acceleration pass) are passed through.
 *
 * @dev viem#readContract implements CCIP-Read, so we get that behavior for free
 * TODO: CCIP-Read Gateways can fail, should likely implement retries?
 */
export async function executeOperations({
  name,
  resolverAddress,
  useENSIP10Resolve,
  operations,
  publicClient,
}: {
  name: Name;
  resolverAddress: Address;
  useENSIP10Resolve: boolean;
  operations: Operation[];
  publicClient: PublicClient;
}): Promise<Operation[]> {
  return withActiveSpanAsync(tracer, "executeOperations", { name }, async (span) => {
    const ResolverContract = { abi: ResolverABI, address: resolverAddress } as const;

    // NOTE: automatically multicalled by viem
    return await Promise.all(
      operations.map(async (op) => {
        if (isOperationResolved(op)) return op;

        try {
          if (useENSIP10Resolve) {
            return await withSpanAsync(
              tracer,
              `resolve(${op.functionName}, ${op.args})`,
              {},
              async (span) => {
                const encodedName = toHex(packetToBytes(name)); // DNS-encode `name` for resolve()
                // NOTE: cast through unknown — viem cannot narrow our Operation union back into
                // its generic EncodeFunctionDataParameters constraint.
                const encodedMethod = encodeFunctionData({
                  abi: ResolverABI,
                  functionName: op.functionName,
                  args: op.args,
                } as unknown as Parameters<typeof encodeFunctionData>[0]);

                span.setAttribute("encodedName", encodedName);
                span.setAttribute("encodedMethod", encodedMethod);

                const value = await publicClient.readContract({
                  ...ResolverContract,
                  functionName: "resolve",
                  args: [encodedName, encodedMethod],
                });

                if (size(value) === 0) return interpretOperationWithRawResult(op, null);

                const results = decodeAbiParameters(
                  getAbiItem({ abi: ResolverABI, name: op.functionName, args: op.args }).outputs,
                  value,
                );

                // Some calls (ABI, pubkey) return a tuple; single-output calls unwrap.
                const raw = results.length === 1 ? results[0] : results;
                return interpretOperationWithRawResult(op, raw);
              },
            );
          }

          return await withSpanAsync(
            tracer,
            `${op.functionName}(${op.args})`,
            {},
            async (): Promise<Operation> => {
              // NOTE: cast through unknown — same viem-narrowing limitation as the ENSIP-10 branch.
              const raw = await publicClient.readContract({
                ...ResolverContract,
                functionName: op.functionName,
                args: op.args,
              } as unknown as Parameters<typeof publicClient.readContract>[0]);
              return interpretOperationWithRawResult(op, raw);
            },
          );
        } catch (error) {
          // reverts are expected, treat as null
          if (error instanceof ContractFunctionExecutionError) {
            return interpretOperationWithRawResult(op, null);
          }

          if (error instanceof Error) span.recordException(error);
          throw error;
        }
      }),
    );
  });
}

/**
 * Interprets a single raw RPC result into its semantic value, producing a resolved Operation.
 *
 * A `null` raw maps to `result: null` for all call types — including `recordVersions`, where
 * revert (resolver doesn't implement `IVersionableResolver`) is surfaced to callers rather than
 * conflated with an explicit `0n`.
 */
export function interpretOperationWithRawResult(call: Operation, raw: unknown): Operation {
  if (raw === null) return { ...call, result: null } as Operation;

  switch (call.functionName) {
    case "name":
      return { ...call, result: interpretNameRecordValue(asLiteralName(raw as string)) };
    case "addr":
      return { ...call, result: interpretAddressRecordValue(raw as string) };
    case "text":
      return { ...call, result: interpretTextRecordValue(raw as string) };
    case "contenthash":
      return { ...call, result: interpretContenthashValue(raw as Hex) };
    case "pubkey": {
      const [x, y] = raw as [Hex, Hex];
      return { ...call, result: interpretPubkeyValue(x, y) };
    }
    case "zonehash":
      return { ...call, result: interpretDnszonehashValue(raw as Hex) };
    case "recordVersions":
      return { ...call, result: raw as RecordVersion };
    case "ABI": {
      const [contentType, data] = raw as [ContentType, Hex];
      return { ...call, result: size(data) === 0 ? null : { contentType, data } };
    }
    case "interfaceImplementer":
      return { ...call, result: interpretAddress(raw as Address) };
  }
}
