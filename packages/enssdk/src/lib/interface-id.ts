import { isHex, size } from "viem";

import type { InterfaceId } from "./types";

/**
 * Whether `maybeInterfaceId` is a valid ERC-165 {@link InterfaceId} — a 4-byte hex selector.
 */
export function isInterfaceId(maybeInterfaceId: string): maybeInterfaceId is InterfaceId {
  return isHex(maybeInterfaceId) && size(maybeInterfaceId) === 4;
}
