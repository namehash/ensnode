import { namehash as viemNamehash } from "viem";

import type { Name, Node } from "./types";

/**
 * Typed wrapper around viem's `namehash` that returns a branded {@link Node}.
 *
 * @see https://docs.ens.domains/ensip/1
 */
export const namehash = (name: Name): Node => viemNamehash(name);
