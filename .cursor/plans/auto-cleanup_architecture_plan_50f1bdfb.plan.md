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

**Null value handling**: if `rawValue` is `null` (the resolver has no value for that key), `normalizeRecord` produces `op: "Unnormalizable"` with `reason: "no value set"`. The key is still recognized; the record participates in the set-level priority contest but always loses to any record with a non-null rawValue.

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
```

**Key function — normalize one record:**

```typescript
function normalizeRecord(
  rawKey: string,
  rawValue: string | null,
  registry: TextRecordNormalizationRegistry,
): IndividualRecordNormalizationResult
```

Logic:

- Look up `rawKey` in registry (by normalizedKey or unnormalizedKey).
- If found: determine `keyResult` (AlreadyNormalized if rawKey === normalizedKey, else Normalized).
  - If `rawValue` is null: `valueResult` is Unnormalizable with reason `"no value set"`.
  - If `rawValue` is a string: run validate + normalize on rawValue.
    - If succeeded: `valueResult` is AlreadyNormalized (when validate + normalize produced the same string) or Normalized (when the string changed).
    - If failed: `valueResult` is Unnormalizable with the reason from the failing step.
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

type RecordNormalizationResult = {
  op: RecordNormalizationOp;
  individual: IndividualRecordNormalizationResult;
  /** Present when op is "Normalized" */
  normalizedKey?: string;
  normalizedValue?: string;
  displayKey?: string;
  displayValue?: string;
  url?: string | null;
};

type NormalizedRecordSet = {
  /**
   * Maps each normalized key to its winning RecordNormalizationResult.
   * Also contains UnrecognizedKeyAndValue records (keyed by their rawKey).
   */
  normalizedRecords: Record<string, RecordNormalizationResult>;
  /**
   * Records that did not make it into normalizedRecords:
   * UnnormalizableValue and DuplicateNormalizedKey.
   */
  unnormalizedRecords: RecordNormalizationResult[];
};
```

**Priority rule** when multiple records share the same normalized key:

1. The record whose `rawKey === normalizedKey` wins unconditionally.
2. Among remaining candidates, priority follows the ordering in `unnormalizedKeys`.
3. Losers get `op: "DuplicateNormalizedKey"` and go into `unnormalizedRecords`.

**Key function — build the set:**

```typescript
function normalizeRecordSet(
  records: Array<{ rawKey: string; rawValue: string | null }>,
  registry: TextRecordNormalizationRegistry,
): NormalizedRecordSet
```

### 1.6 Layer 3: Stripped output

For clients that only want clean values without metadata:

```typescript
function stripNormalizationMetadata(
  set: NormalizedRecordSet,
): Record<string, string | null>
```

Returns only the `normalizedKey → normalizedValue` pairs from the "Normalized" records, plus `rawKey → rawValue` passthrough for "UnrecognizedKeyAndValue" records.

### 1.7 Pre-resolution: key expansion

Before resolution, normalized keys are expanded into the full set of candidate keys that the resolver should be queried for:

```typescript
function expandNormalizedKeys(
  normalizedKeys: readonly string[],
  registry: TextRecordNormalizationRegistry,
): string[]
```

Returns: `[normalizedKey, ...unnormalizedKeys]` for each known key, deduplicated. Unknown keys are kept as-is.

---

## Phase 1: Transform registry

The registry maps normalized keys to `TextRecordKeyDef`. All lookups support both normalized keys and unnormalized variants.

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

### Registry construction

The registry is constructed once at module initialization as a plain object with two internal lookup maps built from the definitions:

- `byNormalizedKey: Map<string, TextRecordKeyDef>` — keyed by `normalizedKey`.
- `byUnnormalizedKey: Map<string, TextRecordKeyDef>` — keyed by each entry in `unnormalizedKeys`, pointing to the owning def.

At construction time the registry validates its own invariants and throws synchronously if any are violated (fail fast). No lazy initialization.

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

**Validation**: extracted username must match `^[a-zA-Z0-9_]{1,15}$`.

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

**Validation**: extracted username must match `^[a-zA-Z0-9]([a-zA-Z0-9-]{0,37}[a-zA-Z0-9])?$` (1–39 chars, alphanumeric and hyphens, no leading/trailing hyphen).

**Canonical form**: lowercase username (e.g. `alice`).

**displayValue**: `@{username}`.

**url**: `https://github.com/{username}`.

---

#### Farcaster (`xyz.farcaster`)

Unnormalized variants: `com.warpcast`, `Farcaster`, `farcaster`

**Accepted input formats**:

- Plain username: `alice`
- Prefixed: `@alice`
- Warpcast URL: `https://warpcast.com/alice`, `http://warpcast.com/alice`

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

- New format: must match `^[a-z0-9_.]{2,32}$`.
- Legacy format: must match `^.{2,32}#[0-9]{4}$`.

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
- telegram.me URL: `https://telegram.me/alice`

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

**Validation**: `new URL(value)` must not throw and `scheme` must be `http:` or `https:`.

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

---

> **Note**: all existing code at `packages/ensnode-sdk/src/resolution/auto-cleanup/` will be deleted before implementation of this specification begins. No migration is required.

---

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

