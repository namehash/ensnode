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
 * TODO: this could more accurately perform the namehash algorithm over the LabelHashes directly
 * but we use this simple approach for now
 */
export function namehashLabelHashPath(labelHashPath: LabelHashPath): Node {
  return namehashInterpretedName(
    interpretedLabelsToInterpretedName(
      labelHashPath.reverse().map((lh) => encodeLabelHash(lh) as string as InterpretedLabel),
    ),
  );
}
