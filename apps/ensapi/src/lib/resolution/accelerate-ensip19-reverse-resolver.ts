import type { InterpretedName } from "enssdk";
import { parseReverseName } from "enssdk";

import type { ResolverRecordsSelection } from "@ensnode/ensnode-sdk";

import { getENSIP19ReverseNameRecordFromIndex } from "@/lib/protocol-acceleration/get-primary-name-from-index";
import { isOperationResolved, type Operation } from "@/lib/resolution/operations";

/**
 * Acceleration pass for a Known ENSIP-19 Reverse Resolver, retrieving the Primary Name from
 * the index if possible.
 *
 * If the caller didn't select `name`, this is a no-op — any other selected operations flow
 * through to the RPC tail unchanged. A reverse resolver won't meaningfully answer them either
 * way; letting the rpc return its natural null-per-record response preserves parity with the
 * unaccelerated path.
 */
export async function accelerateENSIP19ReverseResolver({
  operations,
  name,
  selection,
}: {
  operations: Operation[];
  name: InterpretedName;
  selection: ResolverRecordsSelection;
}): Promise<Operation[]> {
  if (selection.name !== true) return operations;

  // parse the Reverse Name into { address, coinType }
  const parsed = parseReverseName(name);
  if (!parsed) {
    throw new Error(
      `Invariant(ENSIP-19 Reverse Resolver): expected a valid reverse name, got '${name}'.`,
    );
  }

  const result = await getENSIP19ReverseNameRecordFromIndex(parsed.address, parsed.coinType);

  // resolve the 'name' operation with the indexed result, passing others along as-is
  return operations.map((op) => {
    if (isOperationResolved(op)) return op;
    if (op.functionName === "name") return { ...op, result };
    return op;
  });
}
