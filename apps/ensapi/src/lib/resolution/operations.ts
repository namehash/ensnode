import type {
  Address,
  CoinType,
  ContentType,
  Hex,
  InterfaceId,
  InterpretedName,
  Node,
  RecordVersion,
} from "enssdk";

import type { ResolverRecordsSelection } from "@ensnode/ensnode-sdk";

/**
 * Canonical mapping from a Resolver function name to its argument tuple and semantically
 * interpreted result type. Add a record type here and `Operation`, `makeOperations`, and
 * `interpretOperationWithRawResult` will force you to handle it.
 */
type OperationMap = {
  name: { args: readonly [Node]; result: InterpretedName | null };
  addr: { args: readonly [Node, bigint]; result: string | null };
  text: { args: readonly [Node, string]; result: string | null };
  contenthash: { args: readonly [Node]; result: Hex | null };
  pubkey: { args: readonly [Node]; result: { x: Hex; y: Hex } | null };
  zonehash: { args: readonly [Node]; result: Hex | null };
  recordVersions: { args: readonly [Node]; result: RecordVersion | null };
  ABI: {
    args: readonly [Node, ContentType];
    result: { contentType: ContentType; data: Hex } | null;
  };
  interfaceImplementer: { args: readonly [Node, InterfaceId]; result: Address | null };
};

type FunctionName = keyof OperationMap;

/**
 * A Resolver call paired with its resolution state. Discriminated on `functionName`.
 *
 * `result === undefined` means unresolved; any other value (including `null`) means resolved.
 * Each variant narrows `result` to the shape produced by the matching interpreter — e.g. for
 * `functionName: "name"`, `result: InterpretedName | null | undefined`.
 */
export type Operation = {
  [FN in FunctionName]: {
    functionName: FN;
    args: OperationMap[FN]["args"];
    result: OperationMap[FN]["result"] | undefined;
  };
}[FunctionName];

/**
 * Type alias retained for documentation at callsites; the array element type is the same
 * full `Operation` union regardless of SELECTION.
 */
export type Operations<_SELECTION extends ResolverRecordsSelection = ResolverRecordsSelection> =
  Operation[];

/**
 * Typed factory for a single unresolved Operation.
 */
function makeOperation<FN extends FunctionName>(
  functionName: FN,
  args: OperationMap[FN]["args"],
): Extract<Operation, { functionName: FN }> {
  return { functionName, args, result: undefined } as Extract<Operation, { functionName: FN }>;
}

/**
 * Builds the set of Operations specified by a ResolverRecordsSelection. Each entry is initially
 * unresolved (`result: undefined`).
 */
export function makeOperations(node: Node, selection: ResolverRecordsSelection): Operation[] {
  return [
    selection.name && makeOperation("name", [node]),
    selection.contenthash && makeOperation("contenthash", [node]),
    selection.pubkey && makeOperation("pubkey", [node]),
    selection.dnszonehash && makeOperation("zonehash", [node]),
    selection.version && makeOperation("recordVersions", [node]),
    selection.abi !== undefined && makeOperation("ABI", [node, selection.abi]),
    ...(selection.addresses ?? []).map((coinType: CoinType) =>
      makeOperation("addr", [node, BigInt(coinType)]),
    ),
    ...(selection.texts ?? []).map((key: string) => makeOperation("text", [node, key])),
    ...(selection.interfaces ?? []).map((id: InterfaceId) =>
      makeOperation("interfaceImplementer", [node, id]),
    ),
  ].filter((op): op is Exclude<typeof op, undefined | null | false> => !!op);
}

/**
 * Whether an Operation has been resolved. `result === undefined` means unresolved; any other
 * value (including `null`) means resolved.
 */
export const isOperationResolved = (op: Operation): boolean => op.result !== undefined;

/**
 * Organizes a set of Operations (resolved or unresolved) for debug logging.
 */
export function tablifyOperations(operations: Operation[]) {
  return operations.map((op) => ({
    Call: `.resolve(${op.functionName}, ${op.args.join(", ")})`,
    Result: op.result,
  }));
}

/**
 * Pretty-prints Operations in dev (console.table) and structured-logs them in production.
 */
export function logOperations(
  operations: Operation[],
  logger: { debug: (obj: unknown) => void },
): void {
  if (process.env.NODE_ENV !== "production") {
    console.table(tablifyOperations(operations));
  } else {
    logger.debug({ operations });
  }
}
