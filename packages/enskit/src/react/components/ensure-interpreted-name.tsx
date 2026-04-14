import { type InterpretedName, type LiteralName, literalNameToInterpretedName } from "enssdk";
import type { ReactNode } from "react";

type MalformedNameRenderer = (name: string) => ReactNode;
type InterpretedNameRenderer = (name: InterpretedName) => ReactNode;

/**
 * Renders a {@link LiteralName} by ensuring it is an {@link InterpretedName}. This is useful for
 * ensuring that downstream components get the guarantees of an {@link InterpretedName}.
 *
 * @param name - The user-provided {@link LiteralName} to render.
 * @param children - Render prop called with the {@link InterpretedName} when `name` is already interpreted.
 * @param coerced - Render prop called with the coerced {@link InterpretedName} when `name` was not already
 *   interpreted but could be successfully coerced under `options`. Typically used to redirect the user to the
 *   canonical URL.
 * @param malformed - Render prop called with the original literal string when `name` cannot be coerced into an
 *   {@link InterpretedName} under `options`.
 * @param options - Forwarded to {@link literalNameToInterpretedName}. Controls how the interpretation handles edge
 *   cases. When `options.allowENSRootName` is `true`, an empty `name` is accepted and rendered via `children`; when
 *   `false` (default), an empty `name` falls through to `malformed`. When `options.allowEncodedLabelHashes` is
 *   `true`, a Label already formatted as an EncodedLabelHash is preserved verbatim; when `false` (default), such a
 *   Label is treated like any other input and passed through normalization, which will fail and fall through to the
 *   unnormalizable-Label handling. When `options.coerceUnnormalizedLabelsToNormalizedLabels` is `true` (default), an
 *   unnormalized Label is passed through ENSIP-15 normalization (e.g. `"Vitalik"` → `"vitalik"`); when `false`, any
 *   unnormalized Label causes `malformed` to be invoked — no normalization is attempted and
 *   `coerceUnnormalizableLabelsToEncodedLabelHashes` is not consulted. When
 *   `options.coerceUnnormalizableLabelsToEncodedLabelHashes` is `true`, a Label that cannot be normalized is replaced
 *   with the EncodedLabelHash of its literal bytes and `coerced` is invoked; when `false` (default), encountering
 *   such a Label causes `malformed` to be invoked. Only consulted when
 *   `coerceUnnormalizedLabelsToNormalizedLabels` is `true`.
 */
export function EnsureInterpretedName({
  name,
  children,
  coerced,
  malformed,
  options,
}: {
  name: LiteralName;
  children: InterpretedNameRenderer;
  coerced: InterpretedNameRenderer;
  malformed: MalformedNameRenderer;
  options?: Parameters<typeof literalNameToInterpretedName>[1];
}) {
  // attempt to convert the LiteralName to an InterpretedName
  let interpreted: InterpretedName;
  try {
    interpreted = literalNameToInterpretedName(name, options);
  } catch {
    // this name can't conform to InterpretedName: it is malformed or contains unnormalizable Labels
    return malformed(name);
  }

  // from here, the name is either already interpreted or was coerced; check with string equality
  if ((name as string) !== (interpreted as string)) return coerced(interpreted);

  // the name was already interpreted, render the happy path
  return children(interpreted);
}
