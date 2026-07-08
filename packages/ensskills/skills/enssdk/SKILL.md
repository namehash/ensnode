---
name: enssdk
description: Integrate ENS into JavaScript/TypeScript apps with enssdk — a fully-typed ENS Omnigraph client (typed GraphQL via gql.tada) plus the easy-to-get-wrong primitives (namehash/labelhash, ENSIP-15 normalization, name interpretation/beautification, branded Name/Label/Address types). Use when writing TS/JS that reads ENS data or manipulates ENS names.
---

# enssdk

`enssdk` is the foundational ENS developer library for JavaScript/TypeScript: a typed client over the **ENS Omnigraph** (one GraphQL API unifying ENSv1 + ENSv2 across every chain) plus the name/hash/address primitives that are notoriously easy to get wrong. It is isomorphic (browser, Node, edge), tree-shakable, and exposes composable modules via subpath exports.

**Reach for `enssdk` when** you are writing TS/JS that needs to read ENS state or handle ENS names — instead of hitting registry/resolver contracts, the legacy ENS Subgraph, or hand-rolling `namehash`/normalization yourself.

## Dependencies

This skill depends on the following sibling skills — load them first:

- **`base`** — the shared working conventions every ENS skill assumes.
- **`ens-protocol`** — the protocol the SDK's helpers and types reflect (names, hashing, normalization, resolution, records).
- **`omnigraph`** — the query model and data shapes. **This is where queries get AUTHORED** (schema reference, field semantics, vetted example queries). This skill shows how to _run_ those queries from TypeScript; it does not re-document the schema. Author against `omnigraph`, run with `enssdk`.

## Install

```bash
npm install enssdk
```

`gql.tada`, `graphql`, and `viem` are **peer dependencies** — install them too if you want typed queries / the viem-backed hashing helpers:

```bash
npm install gql.tada graphql viem
```

> **Version compatibility:** a NameHash-hosted ENSNode instance runs a specific ENSNode version, and the Omnigraph data model can change between versions. Pin `enssdk` to the version matching the instance you query (see [ensnode.io/docs/hosted-instances](https://ensnode.io/docs/hosted-instances)). Mismatched versions can produce schema/type drift.

## Client setup

Create a client pointed at an ENSNode instance, then `.extend()` it with the modules you need. The client is a small composable object — only the modules you attach ship in your bundle.

```typescript
import { createEnsNodeClient } from "enssdk/core";
import { omnigraph } from "enssdk/omnigraph";

// Point at any ENSNode instance. NameHash hosts several:
//   mainnet  → https://api.alpha.ensnode.io
//   sepolia  → https://api.alpha-sepolia.ensnode.io
//   v2 (Sepolia) → https://api.v2-sepolia.ensnode.io
// or your own (e.g. http://localhost:4334). See https://ensnode.io/docs/hosted-instances
const client = createEnsNodeClient({
  url: process.env.ENSNODE_URL ?? "https://api.alpha.ensnode.io",
}).extend(omnigraph);
```

`createEnsNodeClient` config:

- `url` (required) — the ENSNode instance base URL. Queries POST to `<url>/api/omnigraph`.
- `fetch` (optional) — a custom `fetch` implementation for runtimes that need one.

## Typed queries with gql.tada

`enssdk/omnigraph` exports a `graphql` tag pre-bound to the Omnigraph schema. Documents you write with it are fully typed — variables, response shape, unions, and connections — with **zero codegen step for the query types themselves** (gql.tada infers them at the type level). You only need a one-time editor/tsc setup so gql.tada knows the schema.

### One-time gql.tada setup

The schema ships inside the package. Add the gql.tada TypeScript plugin to your `tsconfig.json`, pointing `schema` at the vendored file:

```jsonc
{
  "compilerOptions": {
    "plugins": [
      {
        "name": "gql.tada/ts-plugin",
        // the Omnigraph schema is bundled with enssdk
        "schema": "node_modules/enssdk/src/omnigraph/generated/schema.graphql",
        // gql.tada writes inferred type metadata here; commit it
        "tadaOutputLocation": "./src/generated/graphql-env.d.ts",
      },
    ],
  },
}
```

Then generate the typings the plugin uses (re-run when you bump `enssdk`):

```bash
npx gql.tada generate-output
```

This produces `graphql-env.d.ts`. With it in place, `graphql(...)` documents typecheck against the live schema and your editor autocompletes fields.

> If you are not using TypeScript / a build that runs `tsc`, you can skip the plugin entirely and still execute queries — you just lose the static typing on the documents.

### Authoring & executing

```typescript
import { createEnsNodeClient } from "enssdk/core";
import { asInterpretedName } from "enssdk";
import { graphql, omnigraph } from "enssdk/omnigraph";

const client = createEnsNodeClient({ url: "https://api.alpha.ensnode.io" }).extend(omnigraph);

// `$name: InterpretedName!` is a custom scalar; enssdk maps it to the branded InterpretedName type,
// so the variable below must be a real InterpretedName — see "Primitives".
const DomainByName = graphql(`
  query DomainByName($name: InterpretedName!) {
    domain(by: { name: $name }) {
      __typename
      canonical {
        name {
          beautified
        }
      }
      owner {
        address
      }
      resolve {
        records {
          addresses(coinTypes: [60]) {
            address
          }
        }
      }
    }
  }
`);

const result = await client.omnigraph.query({
  query: DomainByName,
  variables: { name: asInterpretedName("vitalik.eth") },
});
```

The query result is `{ data?, errors? }` — see "Error handling & gotchas" below. `data` is typed exactly to your selection set.

### Variables & the response shape

- Pass `variables` typed to the document. If a document has no variables, `variables` is optional.
- `signal?: AbortSignal` is accepted on `query(...)` for cancellation.
- Custom scalars map to enssdk's branded types: `InterpretedName`, `Address` (→ `NormalizedAddress`), `Node`, `CoinType`, `BigInt` (serialized as `` `${bigint}` `` strings — deserialize yourself if you need real bigints), `JSON`, etc. So a `$name: InterpretedName!` variable will not accept a raw `string` — build it with `asInterpretedName`/`normalizeName`.

### Fragments & narrowing

Reuse selections with fragments, and narrow `data` safely with the gql.tada helpers `FragmentOf` / `readFragment` (re-exported from `enssdk/omnigraph`). `ResultOf` and `VariablesOf` are also re-exported for deriving types from a document.

```typescript
import { type FragmentOf, graphql, readFragment } from "enssdk/omnigraph";

const DomainFragment = graphql(`
  fragment DomainFragment on Domain {
    __typename
    canonical {
      name {
        beautified
      }
    }
    owner {
      address
    }
  }
`);

// compose: pass fragment dependencies as the second arg
const Query = graphql(
  `
    query HelloWorld($name: InterpretedName!) {
      domain(by: { name: $name }) {
        ...DomainFragment
        subdomains(first: 20) {
          totalCount
          edges {
            node {
              ...DomainFragment
            }
          }
        }
      }
    }
  `,
  [DomainFragment],
);

// `readFragment` unmasks fragment data for type-safe access
function formatDomain(data: FragmentOf<typeof DomainFragment>): string {
  const domain = readFragment(DomainFragment, data);
  const name = domain.canonical?.name.beautified ?? "<unnamed>";
  return `${name} (${domain.__typename})`;
}
```

For **unions** (e.g. `Registration`, `Domain` subtypes like `ENSv1Domain`/`ENSv2Domain`) select `__typename` and use inline fragments (`... on BaseRegistrarRegistration { … }`); gql.tada types each branch accordingly. For **connections**, walk `edges { node }`, read `pageInfo { hasNextPage endCursor }` / `totalCount`, and paginate with `first` + `after: <endCursor>` (cursor-based; no offset). The `omnigraph` skill has the full schema and copy-pasteable example queries — author there.

## Primitives

These have sharp edges; **use the SDK helpers, never hand-roll them** (never `toLowerCase()` a name, never `keccak256` a name yourself). Imported from the package root: `import { … } from "enssdk"`. The library uses **branded types** (`InterpretedName`, `LiteralName`, `InterpretedLabel`, `Beautified*`, `NormalizedAddress`, `Node`, `LabelHash`, …) so misuse is caught at compile time — the brand prevents passing, say, a `BeautifiedName` where an `InterpretedName` is required.

### Normalization (ENSIP-15)

```typescript
import { normalizeName, isNormalizedName, normalizeLabel } from "enssdk";

normalizeName("Vitalik.eth"); // → "vitalik.eth" (InterpretedName); throws if unnormalizable
isNormalizedName("Vitalik.eth"); // → false (non-throwing check)
normalizeLabel("vitalik"); // → InterpretedLabel; throws on '', on '.', or if unnormalizable
```

### namehash / labelhash

```typescript
import {
  namehashInterpretedName,
  labelhashInterpretedLabel,
  asInterpretedName,
  asInterpretedLabel,
} from "enssdk";

const node = namehashInterpretedName(asInterpretedName("vitalik.eth")); // → Node (the on-chain id)
const labelHash = labelhashInterpretedLabel(asInterpretedLabel("vitalik")); // → LabelHash
```

- `namehashInterpretedName(InterpretedName): Node` — requires an already-interpreted name (call `asInterpretedName`/`normalizeName` first). Per the `base` skill, call the _result_ a **Node**, not a "namehash".
- `labelhashInterpretedLabel(InterpretedLabel): LabelHash` — special-cases Encoded LabelHashes (`[hash]`). Use `labelhashLiteralLabel(LiteralLabel)` to hash a label's literal bytes with no encoded-labelhash detection.
- Encoded LabelHashes: `encodeLabelHash`, `decodeEncodedLabelHash`, `isEncodedLabelHash`, `isLabelHash`.
- `makeSubdomainNode(labelHash, node): Node` — one namehash step (child of a parent node).

### Interpretation: literal ↔ interpreted

The Omnigraph and on-chain data deal in **InterpretedName/InterpretedLabel** (a normalized name, or one whose unnormalizable labels are represented as Encoded LabelHashes). Use the interpretation helpers to convert user/literal input:

```typescript
import { asInterpretedName, literalNameToInterpretedName, asLiteralName } from "enssdk";

asInterpretedName("vitalik.eth"); // validate+cast; throws if not already interpreted

// coerce arbitrary user input → InterpretedName (normalizes labels by default)
literalNameToInterpretedName(asLiteralName("Vitalik.eth")); // → "vitalik.eth"
```

`literalNameToInterpretedName(name, options?)` controls edge cases via `allowENSRootName`, `allowEncodedLabelHashes`, `coerceUnnormalizedLabelsToNormalizedLabels` (default `true`), `coerceUnnormalizableLabelsToEncodedLabelHashes` (default `false`). Related: `asInterpretedLabel`, `literalLabelToInterpretedLabel`, `interpretedNameToInterpretedLabels`, `isInterpretedName`/`isInterpretedLabel`.

### Beautification (display only)

```typescript
import { beautifyInterpretedName } from "enssdk";

beautifyInterpretedName(asInterpretedName("♾♾♾♾.eth")); // → "♾️♾️♾️♾️.eth" (BeautifiedName)
```

A `BeautifiedName`/`BeautifiedLabel` is for **presentation only**. It is intentionally _not_ an `InterpretedName` (the brand blocks it) — never use a beautified value as a lookup key, query variable, or navigation target. Keep the source `InterpretedName` for those. (`beautifyInterpretedLabel` does the same for a single label.)

### Addresses

```typescript
import { toNormalizedAddress, isNormalizedAddress, asNormalizedAddress } from "enssdk";

toNormalizedAddress("0xd8dA…6045"); // → lowercase NormalizedAddress; throws if not an EVM address
isNormalizedAddress(x); // non-throwing guard
asNormalizedAddress(x); // assert already-normalized; throws otherwise
```

The Omnigraph's `Address` scalar maps to `NormalizedAddress` (lowercase). Normalize before using an address as a query variable.

### Coin types & constants

`ETH_COIN_TYPE` (60), `evmChainIdToCoinType` / `coinTypeToEvmChainId` (ENSIP-9/11), and constants like `ENS_ROOT_NAME`, `ENS_ROOT_NODE`, `ETH_NODE` are exported from the root for record selection and traversal.

## Error handling & gotchas

- **GraphQL errors vs. transport errors are different paths.**
  - A successful HTTP response returns `{ data?, errors? }`. **`query(...)` does not throw on GraphQL errors** — check `result.errors` yourself, and guard nullable fields (`result.data?.domain`):

    ```typescript
    const result = await client.omnigraph.query({ query, variables });
    if (result.errors) throw new Error(JSON.stringify(result.errors));
    if (!result.data?.domain) throw new Error("not found");
    ```

  - A non-2xx HTTP response **throws** an `Error` (`Omnigraph query failed: <status> …`). Notably an ENSNode instance returns **503** when it cannot serve a request faithfully (indexer not caught up to realtime, status unavailable, or the instance lacks the required plugins) — treat 503 as "temporarily unavailable / unsupported by this instance," retry or switch instances; it is not a malformed query.

- **Primitive helpers throw on invalid input** (fail-fast): `normalizeName`, `asInterpretedName`, `toNormalizedAddress`, `decodeEncodedLabelHash`, etc. Use the `is*` guards (`isNormalizedName`, `isInterpretedName`, `isNormalizedAddress`, `isEncodedLabelHash`) when you need a non-throwing branch.
- **Branded types are load-bearing.** A `string` will not satisfy an `InterpretedName`/`Address` variable — convert at the boundary (`asInterpretedName`, `toNormalizedAddress`). A `BeautifiedName` will not satisfy an `InterpretedName` either; that is deliberate.
- **`BigInt` scalars arrive as strings** (`` `${bigint}` ``). Parse them if you need arithmetic.
- **Re-run `gql.tada generate-output`** after upgrading `enssdk` or changing the schema reference, or document types will drift from the server.

## Reporting

Per the `base` skill: report the **result**, not the procedure. Surface only facts that change the user's understanding — an input was unnormalizable, a name resolves unexpectedly, an instance returned 503. Don't narrate normalizing, hashing, or field selection.
