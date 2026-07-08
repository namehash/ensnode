import { stringToBytes } from "viem";

import { interpretedNameToInterpretedLabels } from "./interpreted-names-and-labels";
import { isEncodedLabelHash } from "./labelhash";
import type { InterpretedName } from "./types";

/**
 * The exclusive upper bound (in bytes) on a single resolvable label. ENS DNS-encoding prefixes each
 * label with a single length octet, so a label must encode to at most 255 bytes; a label of 256+
 * bytes cannot be DNS-encoded and therefore cannot be resolved.
 */
const MAX_RESOLVABLE_LABEL_BYTE_LENGTH = 256;

/**
 * A {@link ResolvableName} is an {@link InterpretedName} that can actually be resolved via the ENS
 * protocol — i.e. it can be DNS-encoded and passed to a Resolver. It requires that every label:
 * - is normalized,
 * - is a known literal label (NOT an Encoded LabelHash — an unknown label cannot be DNS-encoded), and
 * - DNS-encodes to fewer than {@link MAX_RESOLVABLE_LABEL_BYTE_LENGTH} bytes.
 *
 * @dev technically names with unnormalized labels are resolvable by the UniversalResolver (which
 * does not check normalization), but to reduce edge cases and avoid footguns, we intentionally
 * include this additional constraint. This also enforces that a ResolvableName within ENSNode is
 * a strict subset of InterpretedName and InterpretedName-based operations (like {@link namehashInterpretedName})
 * function identically on ResolvableNames.
 */
export type ResolvableName = InterpretedName & { __brand: "ResolvableName" };

/**
 * Determines whether `name` is a {@link ResolvableName}.
 */
export function isResolvableName(name: InterpretedName): name is ResolvableName {
  for (const label of interpretedNameToInterpretedLabels(name)) {
    // an Encoded LabelHash has no known literal label, so the name cannot be DNS-encoded
    if (isEncodedLabelHash(label)) return false;

    // a label must DNS-encode within a single length octet (< 256 bytes)
    if (stringToBytes(label).length >= MAX_RESOLVABLE_LABEL_BYTE_LENGTH) return false;
  }

  return true;
}

/**
 * Asserts that `name` is a {@link ResolvableName}, returning it, or throws.
 */
export function asResolvableName(name: InterpretedName): ResolvableName {
  if (isResolvableName(name)) return name;

  throw new Error(`Not a valid ResolvableName: '${name}'`);
}
