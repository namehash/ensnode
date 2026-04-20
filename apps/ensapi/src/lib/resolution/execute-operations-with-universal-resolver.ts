import config from "@/config";

import type { InterpretedName } from "enssdk";
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

import { DatasourceNames, ResolverABI, UniversalResolverABI } from "@ensnode/datasources";
import {
  getDatasourceContract,
  maybeGetDatasourceContract,
  type ResolverRecordsSelection,
} from "@ensnode/ensnode-sdk";

import { lazy } from "@/lib/lazy";
import { interpretOperationWithRawResult } from "@/lib/resolution/execute-operations";
import { isOperationResolved, type Operations } from "@/lib/resolution/operations";

const getUniversalResolverV1 = lazy(() =>
  getDatasourceContract(config.namespace, DatasourceNames.ENSRoot, "UniversalResolver"),
);

const getUniversalResolverV2 = lazy(() =>
  maybeGetDatasourceContract(config.namespace, DatasourceNames.ENSRoot, "UniversalResolverV2"),
);

/**
 * Execute a set of Operations for `name` against the UniversalResolver.
 *
 * NOTE: this exists just for the ENSv2 bailout, will be removed once forward-resolution is updated
 * for ENSv2 (and interpretOperationWithRawResult can be un-exported).
 */
export async function executeOperationsWithUniversalResolver<
  SELECTION extends ResolverRecordsSelection,
>({
  name,
  operations,
  publicClient,
}: {
  name: InterpretedName;
  operations: Operations<SELECTION>;
  publicClient: PublicClient;
}): Promise<Operations<SELECTION>> {
  // NOTE: automatically multicalled by viem
  return await Promise.all(
    operations.map(async (op) => {
      if (isOperationResolved(op)) return op;

      try {
        const encodedName = bytesToHex(packetToBytes(name)); // DNS-encode `name` for resolve()
        // NOTE: cast through unknown — viem cannot narrow our Operation union back into its
        // generic EncodeFunctionDataParameters constraint.
        const encodedMethod = encodeFunctionData({
          abi: ResolverABI,
          functionName: op.functionName,
          args: op.args,
        } as unknown as Parameters<typeof encodeFunctionData>[0]);

        const [value] = await publicClient.readContract({
          abi: UniversalResolverABI,
          // NOTE(ensv2-transition): if UniversalResolverV2 is defined, prefer it over UniversalResolver
          // TODO(ensv2-transition): confirm this is correct
          address: getUniversalResolverV2()?.address ?? getUniversalResolverV1().address,
          functionName: "resolve",
          args: [encodedName, encodedMethod],
        });

        if (size(value) === 0) return interpretOperationWithRawResult(op, null);

        // ENSIP-10 — resolve() always returns bytes that need to be decoded
        const results = decodeAbiParameters(
          getAbiItem({ abi: ResolverABI, name: op.functionName, args: op.args }).outputs,
          value,
        );
        // Some calls (ABI, pubkey) return a tuple; single-output calls unwrap.
        const raw = results.length === 1 ? results[0] : results;
        return interpretOperationWithRawResult(op, raw);
      } catch (error) {
        if (error instanceof ContractFunctionExecutionError) {
          return interpretOperationWithRawResult(op, null);
        }
        throw error;
      }
    }),
  );
}
