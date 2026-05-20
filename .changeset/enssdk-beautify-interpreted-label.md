---
"enssdk": minor
---

Add `beautifyInterpretedLabel`, which beautifies a single `InterpretedLabel` per [ENSIP-15](https://docs.ens.domains/ensip/15), preserving Encoded LabelHashes verbatim, and returns the new `BeautifiedLabel` branded type. `beautifyInterpretedName` is now defined in terms of `beautifyInterpretedLabel`.
