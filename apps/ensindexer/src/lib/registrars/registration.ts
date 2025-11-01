import type { Node, UnixTimestamp } from "@ensnode/ensnode-sdk";

export interface Registration {
  node: Node;

  parentNode: Node;

  expiresAt: UnixTimestamp;
}

export function buildRegistration({
  node,
  parentNode,
  expiresAt,
}: {
  node: Node;
  parentNode: Node;
  expiresAt: bigint;
}): Registration {
  return {
    node,
    parentNode,
    expiresAt: Number(expiresAt),
  };
}
