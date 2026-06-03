# Names, labels, and hashing

Definitions follow the [ENSNode Terminology Reference](https://ensnode.io/docs/reference/terminology). Use **enssdk** for all of the operations on this page — don't hand-roll normalization, hashing, or label parsing; the SDK encodes the rules and branded types that keep them correct.

## Name and label

- A **name** is a human-readable string of dot-separated **labels** read right-to-left, e.g. `vitalik.eth` has labels `vitalik` and `eth`. A name may or may not be normalized.
- A **label** is one segment. Labels are arbitrary Unicode strings.

## Normalization (ENSIP-15)

**Normalization** canonicalizes a name before it is hashed, compared, or trusted, per [ENSIP-15](https://docs.ens.domains/ensip/15) as implemented by `@adraffy/ens-normalize`. It is **not** `toLowerCase()` — it folds case, handles emoji/ZWJ correctly, and rejects confusable/homoglyph constructions (e.g. a Cyrillic `а` posing as Latin `a`).

- A **Normalized Label/Name** is the canonical form. Only a normalized name produces a _valid_ node.
- The normalization algorithm evolves with Unicode releases, so a label can become normalizable in a newer version. When two systems compare names/labels, they must use the **same** normalization version or guarantees break.
- Compare names for equality **only after normalizing both**.

In `enssdk`: check with `isNormalizedName` / `isNormalizedLabel`; turn raw input into a branded **Interpreted Name/Label** with `asInterpretedName` / `asInterpretedLabel` (an Interpreted value is a normalized literal, or an Encoded LabelHash when the literal is unknown/unnormalized). The `InterpretedName` / `InterpretedLabel` types are what the hashing and ENS Omnigraph query helpers accept, so coercing at the input boundary makes the rest of an integration correct by construction.

## namehash and labelhash

ENS stores hashes, not strings.

- **labelhash** — `keccak256` of a single label. `labelhash("vitalik")` = `0xaf2caa1c…7c7103cc`.
- **namehash** ([ENSIP-1](https://docs.ens.domains/ensip/1)) — recursively hashes a name into a 32-byte **node**, the on-chain identifier: `namehash(label.parent) = keccak256(namehash(parent) ++ labelhash(label))`, with `namehash("") = 0x00…00` (the root). `namehash("vitalik.eth")` = `0xee6c4522…53475835`.

The node is **not** a stable reference to a label string: passing an unnormalized name to namehash yields an _invalid_ node.

In `enssdk`: `namehashInterpretedName(name)` and `labelhashInterpretedLabel(label)` hash an Interpreted value (use `labelhashLiteralLabel` for a raw literal). Always hash an Interpreted/normalized value, not raw user input.

## Known vs unknown labels, Encoded LabelHash

Because only hashes are registered, the human-readable label behind a node is sometimes **unknown** — you have its labelhash but not its text. (Healing services like ENSRainbow and contract events can recover many of these.)

- An **Unknown Label** is displayed as an **Encoded LabelHash**: the hex labelhash wrapped in square brackets, `[731f7025…0663b22]`.
- A name containing an Encoded LabelHash can be traversed in the nametree but is **not resolvable** (forward resolution needs literal labels) — see [resolution.md](resolution.md).

In `enssdk`: `encodeLabelHash` produces the `[…]` form, `isEncodedLabelHash` detects it, and `parseLabelHashOrEncodedLabelHash` accepts either a bare labelhash or the encoded form — handy when a label may or may not be known.

ENSNode further distinguishes _Literal_ / _Interpreted_ / _Beautified_ forms of labels and names for indexing and display; see the [terminology reference](https://ensnode.io/docs/reference/terminology) if you need that precision.
