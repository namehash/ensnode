import { concat, keccak256, namehash as viemNamehash } from "viem";

import type { InterpretedName, LabelHash, Node } from "./types";

/**
 * Typed wrapper around viem's `namehash` that returns a branded {@link Node},
 * requiring an {@link InterpretedName} input and correctly parsing EncodedLabelHashes.
 *
 * @see https://docs.ens.domains/ensip/1
 */
export const namehashInterpretedName = (name: InterpretedName): Node => viemNamehash(name);

/**
 * Implements one step of the namehash algorithm, combining `labelHash` with `node` to produce
 * the `node` of a given subdomain. Note that the order of the arguments is 'reversed' (as compared to
 * the actual concatenation) in order to improve readability (i.e. read as [labelHash].[node]).
 */
export const makeSubdomainNode = (labelHash: LabelHash, node: Node): Node =>
  keccak256(concat([node, labelHash]));
