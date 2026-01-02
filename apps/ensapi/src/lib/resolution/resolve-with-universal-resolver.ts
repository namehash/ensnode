import config from "@/config";

import {
  bytesToHex,
  ContractFunctionExecutionError,
  decodeAbiParameters,
  encodeFunctionData,
  getAbiItem,
  type PublicClient,
  size,
} from "viem";
import { packetToBytes } from "viem/ens";

import { DatasourceNames, getDatasource, ResolverABI } from "@ensnode/datasources";
import type { Name, ResolverRecordsSelection } from "@ensnode/ensnode-sdk";

import type {
  ResolveCalls,
  ResolveCallsAndRawResults,
} from "@/lib/resolution/resolve-calls-and-results";

const ensroot = getDatasource(config.namespace, DatasourceNames.ENSRoot);

/**
 * Execute a set of ResolveCalls for `name` against the UniversalResolver.
 */
export async function executeResolveCallsWithUniversalResolver<
  SELECTION extends ResolverRecordsSelection,
>({
  name,
  calls,
  publicClient,
}: {
  name: Name;
  calls: ResolveCalls<SELECTION>;
  publicClient: PublicClient;
}): Promise<ResolveCallsAndRawResults<SELECTION>> {
  // NOTE: automatically multicalled by viem
  return await Promise.all(
    calls.map(async (call) => {
      try {
        const encodedName = bytesToHex(packetToBytes(name)); // DNS-encode `name` for resolve()
        const encodedMethod = encodeFunctionData({ abi: ResolverABI, ...call });

        const [value] = await publicClient.readContract({
          abi: ensroot.contracts.UniversalResolver.abi,
          address: ensroot.contracts.UniversalResolver.address,
          functionName: "resolve",
          args: [encodedName, encodedMethod],
        });

        // if resolve() returned empty bytes or reverted, coalece to null
        if (size(value) === 0) {
          return { call, result: null, reason: "returned empty response" };
        }

        // ENSIP-10 — resolve() always returns bytes that need to be decoded
        const results = decodeAbiParameters(
          getAbiItem({ abi: ResolverABI, name: call.functionName, args: call.args }).outputs,
          value,
        );

        // NOTE: results is type-guaranteed to have at least 1 result (because each abi item's outputs.length >= 1)
        const result = results[0];

        console.log(`.resolve(${call.functionName}, ${call.args}) -> ${result}`);

        return {
          call,
          result: result,
          reason: `.resolve(${call.functionName}, ${call.args})`,
        };
      } catch (error) {
        console.log(`.resolve(${call.functionName}, ${call.args}) -> ${error}`);

        // in general, reverts are expected behavior
        if (error instanceof ContractFunctionExecutionError) {
          return { call, result: null, reason: error.shortMessage };
        }

        // otherwise, rethrow
        throw error;
      }
    }),
  );
}
