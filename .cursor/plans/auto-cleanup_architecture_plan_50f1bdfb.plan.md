---
name: Auto-Cleanup Architecture Plan
overview: A comprehensive design specification for the resolver record normalization feature for ENS, covering the pure in-memory data model (Phase 1), the transform registry, and the API integration (Phase 3).
todos: []
isProject: false
---

# Resolver Record Normalization — Architecture Specification

## Goals (from issue #1061)

1. Clients can request that all resolver records are **validated** (value matches expected format) and **normalized** (value is in a single canonical form regardless of how it was stored).
2. Keys are also normalized: legacy/fallback key variants (e.g. `vnd.twitter`, `twitter`) are resolved and the value is returned under the canonical key (e.g. `com.twitter`).
3. Unknown keys (no normalization logic defined) pass through unchanged.
4. Full normalization metadata is optionally returned so UIs can inspect and explain how each record was processed.
5. Normalized records carry UI-friendly enrichment: `displayKey`, `displayValue`, `url`.

---

## Architecture: Phase separation

The feature is split into three phases that can be developed in parallel:

- **Phase 1** (current focus): Pure in-memory data model and functions in `@ensnode/ensnode-sdk`. No I/O, no resolution logic. This layer is independently testable and reusable.
- **Phase 2**: Resolution API refactors (tracked separately in issue #1471).
- **Phase 3**: Integrate Phase 1 logic into the APIs built in Phase 2.

Phases 1 and 2 proceed in parallel. Phase 3 begins once both are sufficiently mature.

---

## Phase 1: Pure in-memory data model and functions

All code lives in `packages/ensnode-sdk/src/resolution/normalization/`.
Every function is a pure in-memory data operation with no I/O dependencies.

### 1.1 Text record key definitions

Each logical record type has a **normalized key** (the canonical primary key) and an ordered list of **unnormalized key variants** (legacy/alternative names tried as fallbacks):

```typescript
type TextRecordNormalizationDefs = {
  byNormalizedKey: Map<string, TextRecordKeyDef>;
  byUnnormalizedKey: Map<string, TextRecordKeyDef>;
};

type TextRecordKeyDef = {
  /** Canonical key used in API responses and UI labels. e.g. "com.twitter" */
  normalizedKey: string;
  /** Human-friendly label for UIs. e.g. "Twitter" */
  displayKey: string;
  /**
   * Ordered list of unnormalized key variants.
   * The primary key (normalizedKey) itself is NOT in this list.
   * Order determines priority if multiple variants have a value.
   */
  unnormalizedKeys: readonly string[];
  /** Validate raw value. Returns ok + trimmed value, or ok:false with reason. */
  validate: (rawValue: string) => ValidationResult;
  /** Convert a validated value to canonical form. */
  normalize: (validatedValue: string) => NormalizationResult;
  /** Human-friendly value for UIs. e.g. "@alice" from "alice" */
  displayValue: (normalizedValue: string) => string;
  /** Full URL to the related resource, or null if no URL can be derived (e.g. Discord, NFT avatar). */
  url: (normalizedValue: string) => string | null;
};
```

**Key lookup is case-sensitive and exact-match only.** A `rawKey` of `TWITTER` does not match `twitter` or `Twitter`. Every cased variant that a production ENS resolver may use must be listed explicitly in `unnormalizedKeys`. There is no implicit case folding at lookup time.

Invariants (enforced at `TextRecordNormalizationDefs` construction):

- No two `normalizedKey` values are the same.
- No two `unnormalizedKey` values are the same across all definitions.
- No `unnormalizedKey` equals any `normalizedKey`.

### 1.1a Supporting return types

These types are used by the `validate` and `normalize` functions on each `TextRecordKeyDef`:

```typescript
type ValidationResult =
  | { ok: true; value: string }       // trimmed, sanitized value ready for normalization
  | { ok: false; reason: string };    // human-readable reason for rejection

type NormalizationResult =
  | { ok: true; value: string }       // canonical normalized value
  | { ok: false; reason: string };    // human-readable reason normalization failed
```

**Null value handling**: if `rawValue` is `null` (the resolver has no value for that key), `normalizeRecord` returns an `IndividualRecordNormalizationResult` whose `valueResult` has `op: "Unnormalizable"` with `reason: "no value set"`. At the set level, a null-value record is treated identically to any other `Unnormalizable` record: it only participates in Pass 2 (which runs only when no candidate successfully normalizes), and loses to any record whose value op is `AlreadyNormalized` or `Normalized`.

### 1.2 Key normalization types (per key)

```typescript
type KeyNormalizationOp = "AlreadyNormalized" | "Normalized" | "Unrecognized";

type KeyNormalizationResult =
  /** rawKey is the canonical normalizedKey; no change was needed */
  | { op: "AlreadyNormalized"; rawKey: string; normalizedKey: string }
  /** rawKey was a fallback variant; it was mapped to normalizedKey in the response */
  | { op: "Normalized"; rawKey: string; normalizedKey: string }
  /** rawKey has no known definition; passed through as-is */
  | { op: "Unrecognized"; rawKey: string; normalizedKey: null };
```

### 1.3 Value normalization types (per value)

```typescript
type ValueNormalizationOp =
  | "AlreadyNormalized"
  | "Normalized"
  | "Unnormalizable"
  | "Unrecognized";

type ValueNormalizationResult =
  /** Value was already in canonical form; rawValue === normalizedValue */
  | { op: "AlreadyNormalized"; rawValue: string; normalizedValue: string }
  /** Value was successfully transformed; rawValue !== normalizedValue */
  | { op: "Normalized"; rawValue: string; normalizedValue: string }
  /**
   * Key was recognized but value could not be normalized.
   * rawValue is null when the resolver had no value for this key.
   * reason carries the validation/normalization failure message.
   */
  | { op: "Unnormalizable"; rawValue: string | null; normalizedValue: null; reason: string }
  /**
   * Key is unrecognized; value passed through without validation/normalization.
   * rawValue is null when the resolver had no value for this unrecognized key.
   */
  | { op: "Unrecognized"; rawValue: string | null; normalizedValue: null };
```

### 1.4 Layer 1: Individual record normalization

An individual record normalization result pairs key and value ops:

```typescript
type IndividualRecordNormalizationResult = {
  keyResult: KeyNormalizationResult;
  valueResult: ValueNormalizationResult;
};
// Invariant: if keyResult.op === "Unrecognized" then valueResult.op === "Unrecognized".
// A recognized key can never produce a valueResult with op "Unrecognized".
```

**Key function — normalize one record:**

```typescript
function normalizeRecord(
  rawKey: string,
  rawValue: string | null,
  defs: TextRecordNormalizationDefs,
): IndividualRecordNormalizationResult
```

Logic:

- Look up `rawKey` in `defs` (via `byNormalizedKey` or `byUnnormalizedKey`).
- If found: determine `keyResult` (AlreadyNormalized if rawKey === normalizedKey, else Normalized).
  - If `rawValue` is null: `valueResult` is Unnormalizable with reason `"no value set"`.
  - If `rawValue` is a string: run validate + normalize on rawValue.
    - If succeeded: `valueResult` is `AlreadyNormalized` iff `normalizedValue === rawValue` (validate + normalize produced a value identical to the original rawValue); otherwise `valueResult` is `Normalized` (normalizedValue differs from rawValue).
    - If failed: `valueResult` is `Unnormalizable` with the reason from the failing step.
- If not found: `keyResult` is Unrecognized; `valueResult` is Unrecognized.

### 1.5 Layer 2: Set-level normalization

After individually normalizing each record, the set is consolidated so only one normalized key is retained as the "winner" when multiple records map to the same normalized key.

```typescript
type RecordNormalizationOp =
  /** Key recognized, value valid — this record is the winner for its normalized key */
  | "Normalized"
  /** Key unrecognized — both key and value are passed through unchanged */
  | "UnrecognizedKeyAndValue"
  /**
   * Key recognized, value could not be normalized — excluded from clean output.
   * Covers all failure cases for a recognized key: null value, format mismatch,
   * validation failure, etc. Note: a separate "UnrecognizedValue" op is not needed
   * because ValueNormalizationOp "Unrecognized" is by definition only reachable
   * when the key itself is unrecognized (captured by "UnrecognizedKeyAndValue" above).
   */
  | "UnnormalizableValue"
  /** Another record already claimed this normalized key (lower priority variant) */
  | "DuplicateNormalizedKey";

type RecordNormalizationResult =
  | {
      op: "Normalized";
      individual: IndividualRecordNormalizationResult;
      normalizedKey: string;
      normalizedValue: string;
      displayKey: string;
      displayValue: string;
      url: string | null;
    }
  | {
      op: "UnrecognizedKeyAndValue" | "UnnormalizableValue" | "DuplicateNormalizedKey";
      individual: IndividualRecordNormalizationResult;
    };

type NormalizedRecordSet = {
  /**
   * Two distinct kinds of entries are keyed here:
   * - op "Normalized": keyed by normalizedKey (the canonical key for the winner).
   * - op "UnrecognizedKeyAndValue": keyed by rawKey (passed through as-is).
   * No other op values appear in this map.
   */
  normalizedRecords: Record<
    string,
    Extract<RecordNormalizationResult, { op: "Normalized" | "UnrecognizedKeyAndValue" }>
  >;
  /**
   * Records that did not make it into normalizedRecords:
   * UnnormalizableValue and DuplicateNormalizedKey.
   */
  unnormalizedRecords: Extract<
    RecordNormalizationResult,
    { op: "UnnormalizableValue" | "DuplicateNormalizedKey" }
  >[];
};
```

**Priority rule** when multiple records share the same normalized key — two-pass algorithm:

**Pass 1 — normalizable candidates** (value op is `AlreadyNormalized` or `Normalized`):

1. Among these, the record whose `rawKey === normalizedKey` wins first.
2. If none match the normalized key, the first in `unnormalizedKeys` order wins.
3. The winner gets `op: "Normalized"` and is placed in `normalizedRecords`.
4. Pass-1 losers (normalizable but not the winner) get `op: "DuplicateNormalizedKey"` and go into `unnormalizedRecords`.
5. All `Unnormalizable` candidates are excluded from Pass 1. If Pass 1 found a winner, each excluded `Unnormalizable` record gets `op: "UnnormalizableValue"` and goes into `unnormalizedRecords`. Their raw values remain accessible via `individual.valueResult.rawValue` when `normalizationMetadata` is requested.

**Pass 2 — only if Pass 1 found no winner** (all candidates are `Unnormalizable`):

1. Among Unnormalizable candidates, the record whose `rawKey === normalizedKey` wins first.
2. If none match the normalized key, the first in `unnormalizedKeys` order wins.
3. The winner gets `op: "UnnormalizableValue"` and goes into `unnormalizedRecords` (no valid value exists, so `normalizedRecords` has no entry for this normalized key).
4. Pass-2 losers get `op: "DuplicateNormalizedKey"` and go into `unnormalizedRecords`.

This ensures a valid value from any fallback key always beats an invalid or null value on the canonical key. Example: if `com.twitter = ""` (invalid) and `vnd.twitter = "alice"` (valid), Pass 1 selects `vnd.twitter` as winner; `com.twitter` gets `op: "UnnormalizableValue"` in `unnormalizedRecords` with its bad raw value still accessible via `normalizationMetadata`.

**Key function — build the set:**

```typescript
function normalizeRecordSet(
  records: Array<{ rawKey: string; rawValue: string | null }>,
  defs: TextRecordNormalizationDefs,
): NormalizedRecordSet
```

### 1.6 Layer 3: Stripped output

For clients that only want clean values without metadata:

```typescript
function stripNormalizationMetadata(
  set: NormalizedRecordSet,
): Record<string, string | null>
```

Returns only the `normalizedKey → normalizedValue` pairs from the "Normalized" records, plus `rawKey → rawValue` passthrough for "UnrecognizedKeyAndValue" records. Unrecognized keys are always included even when `rawValue` is null — producing `{ [rawKey]: null }` — so the caller receives a complete picture of every key that was present in the input.

### 1.7 Pre-resolution: key expansion

Before resolution, normalized keys are expanded into the full set of candidate keys that the resolver should be queried for:

```typescript
function expandNormalizedKeys(
  normalizedKeys: readonly string[],
  defs: TextRecordNormalizationDefs,
): string[]
```

**Precondition**: no element of `normalizedKeys` may be an unnormalized key variant (i.e. present in `defs.byUnnormalizedKey` but not in `defs.byNormalizedKey`). Passing `vnd.twitter` where `com.twitter` is expected is a caller error and must throw synchronously with a clear message listing the offending keys. Completely unknown keys (absent from both maps) are not an error — they are passed through as-is, supporting arbitrary user-defined keys.

Returns: `[normalizedKey, ...unnormalizedKeys]` for each key found in `defs.byNormalizedKey`, followed by any unrecognized keys as-is. The result is deduplicated by first-occurrence: if the same key appears more than once, its first position is kept and subsequent occurrences are dropped. Ordering is otherwise stable and deterministic, ensuring consistent multicall construction and reproducible traces.

---

## Phase 1: Initial `TextRecordNormalizationDefs`

The initial definitions cover the 9 most common ENS text record key types. All lookups support both normalized keys and unnormalized variants via the two maps on `TextRecordNormalizationDefs`.

**Initial set of recognized keys:**


| Normalized key              | Display key | Unnormalized key variants                |
| --------------------------- | ----------- | ---------------------------------------- |
| `com.twitter` (or `com.x`?) | Twitter / X | `vnd.twitter`, `twitter`, `Twitter`      |
| `com.github`                | GitHub      | `vnd.github`, `github`                   |
| `xyz.farcaster`             | Farcaster   | `com.warpcast`, `Farcaster`, `farcaster` |
| `com.discord`               | Discord     | `discord`                                |
| `org.telegram`              | Telegram    | `telegram`, `com.telegram`, `Telegram`   |
| `com.reddit`                | Reddit      | `reddit`                                 |
| `url`                       | Website     | `URL`, `Website`, `website`              |
| `email`                     | Email       | `Email`                                  |
| `avatar`                    | Avatar      | `Avatar`                                 |


**Open question:** Should the normalized key for Twitter be `com.twitter` or `com.x` (reflecting the platform rebrand)? If `com.x`, what are the unnormalized variants to include?

### `TextRecordNormalizationDefs` construction

A `TextRecordNormalizationDefs` is built once from the array of `TextRecordKeyDef` objects. Its two maps provide O(1) lookup by either key form:

- `byNormalizedKey` — keyed by each `normalizedKey`.
- `byUnnormalizedKey` — keyed by each entry in `unnormalizedKeys`, pointing to the owning def.

At construction time the invariants are validated and any violation throws synchronously (fail fast). No lazy initialization.

### Per-key transform specifications

The following specifies validation, normalization, and UI enrichment for each of the 9 initial keys. "Accepted input formats" lists formats that pass validation. "Canonical form" is the `normalizedValue` stored and returned. Values are first stripped of leading/trailing whitespace before validation.

---

#### Twitter / X (`com.twitter` or `com.x` — see open question)

Unnormalized variants: `vnd.twitter`, `twitter`, `Twitter`

**Accepted input formats**:

- Plain username: `alice`
- Prefixed: `@alice`
- twitter.com URL: `https://twitter.com/alice`, `http://twitter.com/alice`, `twitter.com/alice`
- x.com URL: `https://x.com/alice`, `http://x.com/alice`, `x.com/alice`

**Validation**: extracted username must match `^[a-zA-Z0-9_]{4,15}$`.

**Canonical form**: lowercase username without `@` prefix (e.g. `alice`).

**displayValue**: `@{username}` (e.g. `@alice`).

**url**: `https://x.com/{username}`.

---

#### GitHub (`com.github`)

Unnormalized variants: `vnd.github`, `github`

**Accepted input formats**:

- Plain username: `alice`
- Prefixed: `@alice`
- github.com URL: `https://github.com/alice`, `http://github.com/alice`, `github.com/alice`

**Validation**: extracted username must match `^(?!.*--)[a-zA-Z0-9]([a-zA-Z0-9-]{0,37}[a-zA-Z0-9])?$` (1–39 chars, alphanumeric and hyphens, no leading/trailing hyphen, no consecutive hyphens).

**Canonical form**: lowercase username (e.g. `alice`).

**displayValue**: `@{username}`.

**url**: `https://github.com/{username}`.

---

#### Farcaster (`xyz.farcaster`)

Unnormalized variants: `com.warpcast`, `Farcaster`, `farcaster`

**Accepted input formats**:

- Plain username: `alice`
- Prefixed: `@alice`
- Warpcast URL: `https://warpcast.com/alice`, `http://warpcast.com/alice`, `warpcast.com/alice`

**Validation**: extracted username must match `^[a-z0-9][a-z0-9-]{0,15}$` (Farcaster usernames are lowercase-only, 1–16 chars).

**Canonical form**: lowercase username (e.g. `alice`).

**displayValue**: `@{username}`.

**url**: `https://warpcast.com/{username}`.

---

#### Discord (`com.discord`)

Unnormalized variants: `discord`

Discord supports two username formats: the new format (post-2023, no discriminator) and the legacy format (with `#NNNN` discriminator). Both are accepted and preserved as-is.

**Accepted input formats**:

- New username: `alice` (2–32 chars, lowercase alphanumeric, underscores, periods)
- Legacy username: `alice#1234`

**Validation**:

- New format: must match `^(?!.*\.\.)[a-z0-9_.]{2,32}$` (no consecutive periods).
- Legacy format: must match `^[^\x00-\x1F\x7F]{2,32}#[0-9]{4}$` (printable characters only before the `#` discriminator).

**Canonical form**: the username as provided (lowercased for new format, `username#NNNN` preserved for legacy).

**displayValue**: same as canonical form.

**url**: Discord does not provide a reliable public profile URL by username (profile URLs use numeric user IDs). Returns `null`.

---

#### Telegram (`org.telegram`)

Unnormalized variants: `telegram`, `com.telegram`, `Telegram`

**Accepted input formats**:

- Plain username: `alice`
- Prefixed: `@alice`
- t.me URL: `https://t.me/alice`, `http://t.me/alice`, `t.me/alice`
- telegram.me URL: `https://telegram.me/alice`, `http://telegram.me/alice`, `telegram.me/alice`

**Validation**: extracted username must match `^[a-zA-Z0-9_]{5,32}$`.

**Canonical form**: lowercase username (e.g. `alice`).

**displayValue**: `@{username}`.

**url**: `https://t.me/{username}`.

---

#### Reddit (`com.reddit`)

Unnormalized variants: `reddit`

**Accepted input formats**:

- Plain username: `alice`
- Prefixed: `u/alice`, `/u/alice`
- reddit.com URL: `https://reddit.com/u/alice`, `https://www.reddit.com/u/alice`, `https://reddit.com/user/alice`

**Validation**: extracted username must match `^[a-zA-Z0-9_-]{3,20}$`.

**Canonical form**: username only, case preserved (e.g. `alice`).

**displayValue**: `u/{username}`.

**url**: `https://www.reddit.com/u/{username}`.

---

#### Website URL (`url`)

Unnormalized variants: `URL`, `Website`, `website`

**Accepted input formats**: any string that parses as a valid URL with `http` or `https` scheme.

**Validation**: `new URL(value)` must not throw and `url.protocol` must be `"http:"` or `"https:"`.

**Canonical form**: `new URL(value).href` (the browser-canonical URL string, e.g. trailing slash normalized).

**displayValue**: same as canonical form.

**url**: same as canonical form.

---

#### Email (`email`)

Unnormalized variants: `Email`

**Accepted input formats**: any string matching a standard email format.

**Validation**: must match `^[^\s@]+@[^\s@]+\.[^\s@]+$` (basic structural check; full RFC 5322 compliance is not required).

**Canonical form**: lowercased email address.

**displayValue**: same as canonical form.

**url**: `mailto:{email}`.

---

#### Avatar (`avatar`)

Unnormalized variants: `Avatar`

Avatar values are complex — they can be HTTPS URLs, IPFS URIs, NFT references (EIP-155), or data URIs. Normalization preserves the value as-is after validation.

**Accepted input formats**:

- HTTPS/HTTP URL: `https://example.com/avatar.png`
- IPFS URI: `ipfs://Qm...`, `ipfs://bafy...`
- EIP-155 NFT reference: `eip155:1/erc721:0x.../1`, `eip155:1/erc1155:0x.../1`
- Data URI: `data:image/png;base64,...`

**Validation**: must begin with one of the recognized prefixes (`https://`, `http://`, `ipfs://`, `eip155:`, `data:image/`).

**Canonical form**: value as-is (no transformation applied).

**displayValue**: same as canonical form.

**url**: for `https://`/`http://` — same as value; for `ipfs://` — convert to `https://ipfs.io/ipfs/{cid}`; for `eip155:` and `data:` URIs — `null` (requires off-chain resolution beyond this layer).

## Phase 3: API integration

### Design decisions

#### Key expansion in the RPC path

When `normalize=true`, client-requested keys are expanded to include all unnormalized variants before resolution. This expansion must happen regardless of the resolution path (indexed or RPC).

For the RPC path, ENS resolution already uses a multicall pattern: all record lookups for a given name are batched into a single `eth_call`. Key expansion therefore does **not** require extra round trips — the expanded key list is simply added to the same multicall batch. The overall overhead is one additional text slot per unnormalized variant per expanded key, within the same single RPC call.

### Parameters

Two query parameters on `GET /records/:name`:


| Parameter               | Type    | Default | Description                                                                                                    |
| ----------------------- | ------- | ------- | -------------------------------------------------------------------------------------------------------------- |
| `normalize`             | boolean | `true`  | Normalize keys and values. If true, expand keys pre-resolution and run normalization pipeline post-resolution. |
| `normalizationMetadata` | boolean | `false` | Include the full `NormalizedRecordSet` metadata in the response. Only meaningful when `normalize=true`.        |


### Key expansion behavior

When `normalize=true`:

1. The requested text keys are passed through `expandNormalizedKeys` to produce a full candidate list.
2. **Indexed path**: the index is queried for all candidate keys directly (no extra cost, single query).
3. **RPC path**: all candidate keys are included in the same multicall batch used to resolve all other records. No additional RPC round trips are incurred.
4. The resolved raw records (potentially including fallback key variants) are then passed through the normalization pipeline.

### Response shape

```typescript
interface ResolveRecordsResponse<SELECTION> {
  records: ResolverRecordsResponse<SELECTION>;
  /** Only present when normalize=true AND normalizationMetadata=true */
  normalizationMetadata?: NormalizedRecordSet;
  accelerationRequested: boolean;
  accelerationAttempted: boolean;
  trace?: TracingTrace;
}
```

The `records.texts` field always contains the stripped, clean output when `normalize=true` (normalized keys mapping to normalized values, unrecognized keys passed through).

---

## Open questions

1. **Normalized key for Twitter**: `com.twitter` or `com.x` (reflecting the platform rebrand)? What unnormalized variants should be included?
2. **Parameter name for metadata field**: `normalizationMetadata`, `includeNormalizationMetadata`, or another name?
3. **Unnormalizable behavior**: When a key is recognized but no candidate produces a valid value, should `records.texts` contain `null` for that key, or should the key be omitted from the response entirely?
4. `**displayValue` and `url` placement**: Should these enrichment fields be part of `records.texts` (when `normalize=true`) or only inside `normalizationMetadata`? Including them in the main response is more convenient for UI clients but changes the primary response shape significantly for all callers.
5. **Client requesting an unnormalized key directly**: If a client passes `texts=vnd.twitter` (an unnormalized variant) instead of `texts=com.twitter`, should `expandNormalizedKeys` throw immediately (current spec — fail fast, caller error), or silently map it to the canonical key and expand from there (more forgiving for legacy integrations)? The issue does not address this case.
6. **Placement of `UnrecognizedKeyAndValue` records**: The current spec places them in `normalizedRecords` (keyed by `rawKey`) so that `stripNormalizationMetadata` only needs to iterate one map to produce the full output. The issue's own description says `normalizedRecords` maps *normalized keys* and `unnormalizedRecords` holds "all records that were unnormalized for one reason or another" — which by that framing would put unrecognized records in `unnormalizedRecords`. Decision: should `unnormalizedRecords` mean "records that don't appear in output" (current spec) or "records that weren't normalized" (issue's framing)?
7. **Verify validation rules against each service's official constraints**: The regexes and accepted input formats in this spec were derived from best-effort research and may not match each platform's current actual rules. Before finalising implementation, verify against official documentation or source code for: Twitter/X (username charset, 15-char limit), GitHub (39-char limit, hyphen rules), Farcaster (lowercase-only, length), Discord (new-format charset, period rules, legacy discriminator format), Telegram (5–32 chars, charset), Reddit (3–20 chars, charset), email (RFC compliance level), avatar (supported URI schemes). Flag any discrepancy as a bug in the transform definition.
8. **Canonical key priority when multiple valid values exist**: The issue states "the rawKey equal to the normalizedKey always gets top priority." But if both `com.twitter = "alice"` and `vnd.twitter = "bob"` are valid normalized values, should `com.twitter` win unconditionally (current spec — structural rule, ignores recency), or should priority be purely order-based (treating `normalizedKey` as simply position 0 in a unified key sequence, allowing it to be overridden per definition)? The issue states the rule but does not justify why the canonical key should beat other valid values.

