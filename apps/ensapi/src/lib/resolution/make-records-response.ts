import { bigintToCoinType } from "enssdk";

import type {
  ResolverRecordsResponse,
  ResolverRecordsResponseBase,
  ResolverRecordsSelection,
} from "@ensnode/ensnode-sdk";

import type { Operation } from "./operations";

/**
 * Folds a set of Operations into a ResolverRecordsResponse.
 *
 * SELECTION is a type-only argument — callers pass it explicitly (e.g.
 * `makeRecordsResponse<SELECTION>(operations)`) to shape the return type.
 */
export function makeRecordsResponse<SELECTION extends ResolverRecordsSelection>(
  operations: Operation[],
): ResolverRecordsResponse<SELECTION> {
  return operations.reduce<Partial<ResolverRecordsResponseBase>>((memo, op) => {
    switch (op.functionName) {
      case "name":
        memo.name = op.result ?? null;
        break;
      case "contenthash":
        memo.contenthash = op.result ?? null;
        break;
      case "pubkey":
        memo.pubkey = op.result ?? null;
        break;
      case "zonehash":
        memo.dnszonehash = op.result ?? null;
        break;
      case "recordVersions":
        memo.version = op.result ?? null;
        break;
      case "ABI":
        memo.abi = op.result ?? null;
        break;
      case "addr": {
        memo.addresses ??= {} as ResolverRecordsResponseBase["addresses"];
        memo.addresses[bigintToCoinType(op.args[1])] = op.result ?? null;
        break;
      }
      case "text": {
        memo.texts ??= {} as ResolverRecordsResponseBase["texts"];
        memo.texts[op.args[1]] = op.result ?? null;
        break;
      }
      case "interfaceImplementer": {
        memo.interfaces ??= {} as ResolverRecordsResponseBase["interfaces"];
        memo.interfaces[op.args[1]] = op.result ?? null;
        break;
      }
    }
    return memo;
  }, {}) as ResolverRecordsResponse<SELECTION>;
}
