---
"enssdk": minor
---

Add `beautifyInterpretedName(name: InterpretedName): BeautifiedName` for converting an InterpretedName into a UI-presentable Name, plus a new `BeautifiedName` nominally-typed alias. Each label is either preserved verbatim (Encoded LabelHashes) or passed through `ens_beautify` (normalized labels), so e.g. `"♾♾♾♾.eth"` renders as `"♾️♾️♾️♾️.eth"`. The branded `BeautifiedName` return type prevents the result from being passed to APIs that expect an `InterpretedName` — continue to use the source InterpretedName for navigation targets and lookups.
