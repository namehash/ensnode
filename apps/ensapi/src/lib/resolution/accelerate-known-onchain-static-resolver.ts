import type { AccountId, Node } from "enssdk";

import type { ResolverRecordsSelection } from "@ensnode/ensnode-sdk";

import { getRecordsFromIndex } from "@/lib/protocol-acceleration/get-records-from-index";
import { isOperationResolved, type Operation } from "@/lib/resolution/operations";

type IndexedRecords = Awaited<ReturnType<typeof getRecordsFromIndex>>;

/**
 * Acceleration pass for a Known On-Chain Static Resolver whose records are fully indexed.
 *
 * Fills in resolved results for calls that are indexable (name, addr, text, contenthash, pubkey,
 * zonehash, recordVersions). Calls that aren't indexable (ABI, interfaceImplementer) remain
 * unresolved and flow to the terminal RPC pass.
 */
export async function accelerateKnownOnchainStaticResolver({
  operations,
  resolver,
  node,
  selection,
}: {
  operations: Operation[];
  resolver: AccountId;
  node: Node;
  selection: ResolverRecordsSelection;
}): Promise<Operation[]> {
  const records = await getRecordsFromIndex({ resolver, node, selection });

  return operations.map((op) => {
    if (isOperationResolved(op)) return op;
    return resolveOperationWithIndex(op, records);
  });
}

/**
 * Attempts to resolve an Operation from indexed records.
 *
 * For indexable calls returns a new Operation with a resolved `result`. For calls that aren't
 * indexable (ABI, interfaceImplementer) returns the input Operation unchanged — so its
 * `result: undefined` flows on to the RPC tail.
 *
 * Pass `null` `records` when there is no indexed row for (resolver, node) — indexable calls still
 * have well-defined "no record" results in that case.
 */
function resolveOperationWithIndex(op: Operation, records: IndexedRecords): Operation {
  switch (op.functionName) {
    case "name":
      return { ...op, result: records?.name ?? null };
    case "addr": {
      const coinType = op.args[1];
      const found = records?.addressRecords.find((r) => r.coinType === coinType);
      return { ...op, result: found?.value ?? null };
    }
    case "text": {
      const key = op.args[1];
      const found = records?.textRecords.find((r) => r.key === key);
      return { ...op, result: found?.value ?? null };
    }
    case "contenthash":
      return { ...op, result: records?.contenthash ?? null };
    case "pubkey":
      return {
        ...op,
        result:
          records?.pubkeyX && records?.pubkeyY ? { x: records.pubkeyX, y: records.pubkeyY } : null,
      };
    case "zonehash":
      return { ...op, result: records?.dnszonehash ?? null };
    case "recordVersions":
      // null when no `VersionChanged` event has been seen for this node
      return { ...op, result: records?.version ?? null };
    /**
     * The following return the Operation as-is, instructing forward-resolution to resolve them via RPC.
     */
    case "ABI":
    case "interfaceImplementer":
      return op;
  }
}
