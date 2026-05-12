import {
  encodeLabelHash,
  type InterpretedLabel,
  interpretedLabelsToInterpretedName,
  type LabelHashPath,
  type Node,
  namehashInterpretedName,
} from "enssdk";

/**
 * Namehash a LabelHashPath.
 *
 * `LabelHashPath` is head-first (root → leaf), but ENS name strings are leaf-first
 * ("vitalik.eth"), so we reverse before encoding each labelHash as `[<hash>]` and joining.
 *
 * TODO: this could more accurately perform the namehash algorithm over the LabelHashes directly
 * but we use this simple approach for now
 */
export function namehashLabelHashPath(labelHashPath: LabelHashPath): Node {
  return namehashInterpretedName(
    interpretedLabelsToInterpretedName(
      labelHashPath.toReversed().map((lh) => encodeLabelHash(lh) as string as InterpretedLabel),
    ),
  );
}
