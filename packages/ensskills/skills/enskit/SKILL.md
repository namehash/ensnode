---
name: enskit
description: Build ENS React UIs with enskit — set up the OmnigraphProvider, run typed ENS Omnigraph queries with useOmnigraphQuery (gql.tada documents, loading/error states, union/connection handling), get a normalized urql cache for free, paginate Relay connections, and render beautified names. Use when wiring ENS data into a React app.
---

# enskit

`enskit` is the React toolkit for reading the **ENS Omnigraph** in a React app. It is a thin, typed layer over [`urql`](https://nearform.com/open-source/urql/) + [`gql.tada`](https://gql-tada.0no.co/): a provider that points at an ENSNode instance, a `useOmnigraphQuery` hook, and a preconfigured normalized cache (`@urql/exchange-graphcache`) tuned for the Omnigraph schema — relay pagination, cross-lookup cache hits, and native `bigint` scalars, all wired up for you.

You author Omnigraph queries exactly as the **`omnigraph`** skill describes; `enskit` is how you _run_ them inside React components.

```bash
npm install enskit enssdk
```

## Dependencies

Load these sibling skills first:

- **`base`** — shared ENS working conventions (prefer the Omnigraph for reads, `Node` terminology, output hygiene).
- **`ens-protocol`** — the protocol the data models (names, normalization, resolution, records, ENSv1/ENSv2).
- **`omnigraph`** — the query model and data shapes; **author your queries there**, then run them with the hooks here.
- **`enssdk`** — enskit is built on `enssdk`. You construct the client and use name/address primitives (normalization, beautification) from `enssdk`.

> **Version pinning matters.** enskit speaks the Omnigraph schema of a _specific_ ENSNode version, baked in via gql.tada introspection. Match your `enskit` and `enssdk` versions to the ENSNode instance you query (e.g. the NameHash-hosted instances). A mismatch surfaces as schema/type errors or unexpected nulls. See [ensnode.io/docs/hosted-instances](https://ensnode.io/docs/hosted-instances).

## Entry points

Two subpath exports:

- `enskit/react/omnigraph` — `OmnigraphProvider`, `useOmnigraphQuery`, the `graphql` tagged-template (gql.tada), and the type helpers `FragmentOf` / `ResultOf` / `VariablesOf` + `readFragment`.
- `enskit/react` — UI helpers, currently `EnsureInterpretedName`.

## Provider setup

Build an `EnsNodeClient` with `enssdk`, extend it with the `omnigraph` module, and hand it to `OmnigraphProvider`. The provider derives a `urql` client from the ENSNode `url` and POSTs operations to that instance's `/api/omnigraph` endpoint.

```tsx
import { OmnigraphProvider } from "enskit/react/omnigraph";
import { createEnsNodeClient } from "enssdk/core";
import { omnigraph } from "enssdk/omnigraph";

// Pick the ENSNode instance / namespace by URL. Use a NameHash-hosted instance
// (https://ensnode.io/docs/hosted-instances) or your own.
const client = createEnsNodeClient({
  url: "https://api.v2-sepolia.ensnode.io",
}).extend(omnigraph);

export function App() {
  return (
    <OmnigraphProvider client={client}>
      <YourRoutes />
    </OmnigraphProvider>
  );
}
```

The ENSNode `url` _is_ the namespace selector: different hosted instances serve different ENS Namespaces (mainnet, sepolia, sepolia-v2, …). There is no separate `namespace` prop — point the client at the instance for the namespace you want.

`OmnigraphProvider` is a client component (`"use client"`). In Next.js App Router, render it in a `"use client"` boundary. enskit ships no Server Components / RSC data fetcher and no built-in Suspense integration — `useOmnigraphQuery` is a standard client hook driving loading/error state explicitly (below).

## Typed queries with gql.tada

Author queries with the `graphql` template from `enskit/react/omnigraph`. It is a project-bound `gql.tada` instance pre-loaded with the Omnigraph schema, so selections, variables, and results are **fully typed** — no codegen step at call sites, and the `BigInt` scalar comes back as a native `bigint`.

```tsx
import { graphql, useOmnigraphQuery } from "enskit/react/omnigraph";

const DomainQuery = graphql(`
  query DomainByName($name: InterpretedName!) {
    domain(by: { name: $name }) {
      __typename
      id
      canonical {
        name {
          beautified
        }
      }
      owner {
        address
      }
    }
  }
`);
```

To get end-to-end types in your editor, enable the gql.tada TS plugin in `tsconfig.json`, pointing `schema` at the `enssdk`-vendored Omnigraph SDL:

```jsonc
"plugins": [
  {
    "name": "gql.tada/ts-plugin",
    "schema": "node_modules/enssdk/src/omnigraph/generated/schema.graphql",
    "tadaOutputLocation": "./src/generated/graphql-env.d.ts",
  },
],
```

**Fragments** keep selections colocated and reusable. Pass dependent fragments as the second `graphql(...)` argument, then unwrap masked data at the render site with `readFragment`:

```tsx
import { type FragmentOf, graphql, readFragment } from "enskit/react/omnigraph";

const DomainFragment = graphql(`
  fragment DomainFragment on Domain {
    __typename
    id
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

const ListQuery = graphql(
  `
    query Subdomains($name: InterpretedName!, $first: Int!, $after: String) {
      domain(by: { name: $name }) {
        subdomains(first: $first, after: $after) {
          edges {
            node {
              ...DomainFragment
            }
          }
          pageInfo {
            hasNextPage
            endCursor
          }
        }
      }
    }
  `,
  [DomainFragment],
);

function Row({ data }: { data: FragmentOf<typeof DomainFragment> }) {
  const domain = readFragment(DomainFragment, data);
  return <span>{domain.canonical?.name.beautified ?? <em>non-canonical</em>}</span>;
}
```

`VariablesOf<typeof Query>` and `ResultOf<typeof Query>` give you the typed variable/result shapes when you need to name them.

## useOmnigraphQuery

The single read hook. It is a typed pass-through to urql's `useQuery`, so it returns a tuple `[result, reexecute]`.

```tsx
const [result, reexecute] = useOmnigraphQuery({
  query: DomainQuery,
  variables: { name }, // typed from the document
  pause: !name, // skip the request until inputs are ready
  context: undefined, // optional urql OperationContext (see caching)
});

const { data, fetching, error } = result;

if (!data && fetching) return <p>Loading…</p>;
if (error) return <p>Error: {error.message}</p>;
if (!data?.domain) return <p>Not found.</p>;
```

Notes:

- `data` can be present _while_ `fetching` is true (e.g. refetching a new page). Gate the spinner on `!data && fetching`, not `fetching` alone, to avoid flashing the whole view on pagination.
- `error` is a `CombinedError` — read `error.message`, or `error.graphQLErrors` / `error.networkError` for detail.
- `pause: true` holds the query; flip it false once required variables exist.
- The Omnigraph returns **503** when an instance can't serve a request faithfully (indexer behind realtime, or a required plugin absent — see the `omnigraph` skill). That arrives as `error.networkError`; treat it as "temporarily unavailable / retry," not a malformed query.

### Unions and connections in components

The Omnigraph schema leans on **interfaces/unions** (`Domain` → `ENSv1Domain` / `ENSv2Domain` / `UnindexedDomain`; `Registration` → `BaseRegistrarRegistration` / `NameWrapperRegistration` / …). Select `__typename` and inline fragments (`... on ENSv2Domain { … }`) in the query, then branch on `__typename` in JSX:

```tsx
{
  domain.__typename === "ENSv2Domain" ? "Reserved" : (domain.owner?.address ?? "0x0");
}
```

**Connections** follow the Relay spec: read `edges[].node`, `pageInfo.hasNextPage`, `pageInfo.endCursor`, and `totalCount`. There is no offset pagination — paginate by cursor (below).

## Caching

`OmnigraphProvider` installs a `@urql/exchange-graphcache` **normalized** cache configured against the Omnigraph schema. You get useful behavior with zero config:

- **Entity normalization & dedup.** `Domain`, `Account`, `Registry`, `Resolver`, `Permissions`, etc. are keyed by `id` (Accounts also by `address`, `AccountId` by its stringified form). Embedded/value types (resolution containers, profile/record shapes, `CanonicalName`, …) are intentionally non-keyable and cached inline under their parent.
- **Cross-lookup cache hits.** Fetch an entity one way and a different lookup for the _same_ entity resolves from cache without a network round-trip — e.g. `Query.root` then `registry(by: { id })` and `registry(by: { contract })` all hit the cached Registry. The same applies to `domain(by: { id })` after the Domain was loaded elsewhere (it resolves across the ENSv1/ENSv2/Unindexed variants).
- **Native `bigint` scalars.** Fields typed `BigInt` in the schema are returned as JS `bigint` (the cache stores the string and rehydrates it), matching the `graphql` template's scalar mapping.

Inspect cache outcome per operation via `result.operation?.context.meta?.cacheOutcome` (`"hit"` | `"partial"` | `"miss"`).

Control freshness with urql's `requestPolicy` on the `context`:

```tsx
import { useMemo } from "react";

const [result, reexecute] = useOmnigraphQuery({
  query: RootRegistryQuery,
  // MUST be memoized — a new context object each render causes an infinite re-render loop.
  context: useMemo(() => ({ requestPolicy: "network-only" }), []),
});

// imperatively refetch (e.g. a "Refresh" button)
reexecute({ requestPolicy: "network-only" });
```

`cache-and-network` (serve cache, revalidate in background) and `network-only` (skip the cache read) are the usual choices. There is no custom invalidation API exposed by enskit; rely on normalized updates + `requestPolicy`/`reexecute`. enskit does not configure mutation/`updates`/optimistic handlers — it is a read layer.

## Pagination (Relay connections)

The cache derives `relayPagination()` resolvers for **every** connection field in the schema, so successive pages of the same connection are **merged in the cache automatically** — you don't concatenate `edges` yourself. The component pattern: hold the `after` cursor in state, advance it from `pageInfo.endCursor`, and let the cache accumulate. Infinite-scroll is the same pattern with the button replaced by an intersection observer.

```tsx
const PAGE_SIZE = 20;

function Subdomains({ name }: { name: InterpretedName }) {
  const [after, setAfter] = useState<string | null>(null);

  const [result] = useOmnigraphQuery({
    query: ListQuery,
    variables: { name, first: PAGE_SIZE, after },
  });

  const { data, fetching, error } = result;
  if (!data && fetching) return <p>Loading…</p>;
  if (error) return <p>Error: {error.message}</p>;

  const conn = data?.domain?.subdomains;
  return (
    <>
      <ul>
        {conn?.edges.map((edge) => {
          const { id } = readFragment(DomainFragment, edge.node);
          return (
            <li key={id}>
              <Row data={edge.node} />
            </li>
          );
        })}
      </ul>
      {conn?.pageInfo.hasNextPage && (
        <button type="button" disabled={fetching} onClick={() => setAfter(conn.pageInfo.endCursor)}>
          {fetching ? "Loading…" : "Next page"}
        </button>
      )}
    </>
  );
}
```

For typeahead/search over `Query.domains`, the same hook works: debounce input, drive it through `variables.where.name` (e.g. `{ starts_with: query }`), reset `after` to `null` when the query string changes, and `pause` while the input is empty.

## Displaying names

Per the `base` / `ens-protocol` conventions: never `toLowerCase()` or hand-format a name. Two helpers:

- **Render beautified.** Select `canonical { name { beautified } }` and show that string — it's the display-ready form. (`interpreted` is the normalized/ENSIP-15 form for keys, links, and comparison.) Fall back to a "non-canonical domain" label when `canonical` is null. Link Domains by their **stable `id`** (`DomainId`), not their name — a name is not a stable identifier across ENSv1/ENSv2.
- **Coerce user input safely with `EnsureInterpretedName`.** When a name comes from the URL or a text field, wrap rendering in this component to convert a `LiteralName` into an `InterpretedName` (the branded type the Omnigraph variables expect) before querying — with render props for the three outcomes:

```tsx
import { EnsureInterpretedName } from "enskit/react";
import { asLiteralName } from "enssdk";

<EnsureInterpretedName
  name={asLiteralName(rawNameFromUrl)}
  options={{
    allowEncodedLabelHashes: true,
    coerceUnnormalizableLabelsToEncodedLabelHashes: true,
  }}
  // already a valid InterpretedName → render normally
  children={(name) => <DomainPage name={name} />}
  // input was coerced to canonical form → redirect to the canonical URL
  coerced={(name) => <Navigate to={`/domain/name/${name}`} replace />}
  // input can't be interpreted (unnormalizable) → show an error
  malformed={(name) => <p>Invalid name: {name}</p>}
/>;
```

`options` are forwarded to `enssdk`'s `literalNameToInterpretedName` (controls ENS-root handling, encoded-labelhash passthrough, and normalization/coercion of unnormalizable labels). Normalize addresses from user input with `enssdk`'s `isNormalizedAddress` / `toNormalizedAddress` before using them as `Address!` variables.

## Putting it together

A typical page: `OmnigraphProvider` at the root → `EnsureInterpretedName` (or address normalization) at the route boundary → a `graphql`-authored query run with `useOmnigraphQuery` → branch on `__typename`, render `beautified` names, link by `id`, and paginate connections by cursor. Author every query against the **`omnigraph`** skill's schema reference; this skill only changes _where_ those queries run.

## Related skills

- **omnigraph** — author the queries (schema, examples, resolution, pagination semantics).
- **enssdk** — the client (`createEnsNodeClient`/`omnigraph`) and the name/address primitives enskit builds on.
- **migrate-to-omnigraph** — if you're porting an app off the legacy ENS Subgraph.
