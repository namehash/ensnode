import {
  encodeLabelHash,
  type InterpretedLabel,
  interpretedLabelsToInterpretedName,
  type LabelHash,
  type Node,
  namehashInterpretedName,
} from "enssdk";

/**
 * Namehash a leaf-first labelHash path (i.e. `Domain.canonicalLabelHashPath`) by encoding each
 * labelHash as an EncodedLabelHash, joining into an InterpretedName, then namehashing.
 *
 * Used to derive `Domain.canonicalNode` from `Domain.canonicalLabelHashPath`. Robust to label
 * heals — the namehash is over labelHashes, not interpreted labels.
 */
export function namehashLabelHashPath(labelHashPath: LabelHash[]): Node {
  return namehashInterpretedName(
    interpretedLabelsToInterpretedName(
      labelHashPath.map((lh) => encodeLabelHash(lh) as unknown as InterpretedLabel),
    ),
  );
}
