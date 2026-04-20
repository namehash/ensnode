import { replaceBigInts } from "@ponder/utils";
import type { InterpretedName } from "enssdk";
import { parseReverseName } from "enssdk";

import type { ResolverRecordsSelection } from "@ensnode/ensnode-sdk";

import { getENSIP19ReverseNameRecordFromIndex } from "@/lib/protocol-acceleration/get-primary-name-from-index";
import { isOperationResolved, type Operation } from "@/lib/resolution/operations";

/**
 * Acceleration pass for a Known ENSIP-19 Reverse Resolver, retrieving the Primary Name from
 * the index if possible.
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
  // Invariant: consumer must be selecting the `name` record at this point.
  // `selection` may contain bigints (e.g. `abi: ContentType`); stringify safely.
  if (selection.name !== true) {
    throw new Error(
      `Invariant(ENSIP-19 Reverse Resolver): expected 'name: true', got ${JSON.stringify(replaceBigInts(selection, String))}.`,
    );
  }

  // parse the Reverse Name into { address, coinType }
  const parsed = parseReverseName(name);
  if (!parsed) {
    throw new Error(
      `Invariant(ENSIP-19 Reverse Resolver): expected a valid reverse name, got '${name}'.`,
    );
  }

  const result = await getENSIP19ReverseNameRecordFromIndex(parsed.address, parsed.coinType);

  // resolve the 'name' operation with the indexed result, passing other along as-is
  return Promise.all(
    operations.map(async (op) => {
      if (isOperationResolved(op)) return op;
      if (op.functionName === "name") return { ...op, result };
      return op;
    }),
  );
}
