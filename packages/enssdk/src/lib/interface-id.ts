import { isHex, size } from "viem";

import type { InterfaceId } from "./types";

/**
 * Whether `maybeInterfaceId` is a valid ERC-165 {@link InterfaceId} — a 4-byte hex selector.
 */
export function isInterfaceId(maybeInterfaceId: unknown): maybeInterfaceId is InterfaceId {
  return (
    typeof maybeInterfaceId === "string" && isHex(maybeInterfaceId) && size(maybeInterfaceId) === 4
  );
}
