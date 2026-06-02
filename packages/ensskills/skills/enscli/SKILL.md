---
name: enscli
description: Drive the enscli command-line tool to read ENS data — run Omnigraph GraphQL queries, explore the schema offline, compute namehash/labelhash, heal labels via ENSRainbow, and check ENSNode indexing status. Use this when executing ENS lookups from a shell (the omnigraph skill authors queries; this skill runs them).
---

# enscli

`enscli` is the terminal entry point to ENS. It wraps [`enssdk`](https://www.npmjs.com/package/enssdk) and the ENS Omnigraph so you can run GraphQL queries, explore the schema, compute hashes, and heal labels against any ENSNode instance — no install step beyond `npx`, no script to write first.

It is built to be driven by an agent: predictable flags, machine-readable output, offline schema introspection, and loud structured errors. v0 is **read-only** (no mutations).

This skill is about _running_ queries and the other CLI commands.

## Dependencies

This skill depends on the following sibling skills — load them first:

- **`base`** — the shared working conventions every ENS skill assumes.
- **`ens-protocol`** — the conceptual model (names, hashing, normalization, resolution, records) behind every command here.
- **`omnigraph`** — **required before running ANY `ensnode omnigraph` query, no exceptions.** It carries the schema reference and vetted example queries, and shows how to traverse relationships in a single query. Don't author field selections from memory — field semantics are easy to get wrong.

## Output contract

Rely on this when parsing results:

- **JSON when piped, pretty in a TTY.** When stdout is not a terminal (the agent case) every command prints JSON; interactively you get a friendlier rendering. Force either with `--output json` / `--output pretty` (alias `-o`).
- **Structured errors.** Failures print `{ "error": { "message": "…" } }` to stderr and exit non-zero. Always check the exit code.
- **Input hardening.** Names, labels, and hashes containing control characters or `?` / `#` / `%` are rejected before any network call, so a hallucinated identifier fails locally and loudly rather than silently mis-resolving.

## Selecting an ENSNode instance

`ensnode` commands talk to an ENSNode instance. The URL is resolved with precedence **`--ensnode-url` flag → `ENSNODE_URL` env → `.env` → namespace default**. `--namespace` (alias `-n`, or the `NAMESPACE` env var) picks a NameHash-hosted instance:

| Namespace      | Hosted default                         |
| -------------- | -------------------------------------- |
| `mainnet`      | `https://api.alpha.ensnode.io`         |
| `sepolia`      | `https://api.alpha-sepolia.ensnode.io` |
| `sepolia-v2`   | `https://api.v2-sepolia.ensnode.io`    |
| `ens-test-env` | _(none — pass `--ensnode-url`)_        |

`ens-test-env` has no hosted default, so it fails fast asking for `--ensnode-url`. ENSRainbow commands resolve their URL the same way via `--ensrainbow-url` / `ENSRAINBOW_URL`, defaulting to the hosted ENSRainbow.

## Commands

```
enscli
  ensnode
    omnigraph <query>            run a raw GraphQL query (--variables '<json>')
    omnigraph schema [Type[.field]]  explore the bundled schema offline (--search <kw>)
    indexing-status              fetch an ENSNode instance's indexing status
  ensrainbow
    heal <labelhash>             heal a labelHash to its original label
    count                        count healable labels known to ENSRainbow
  datasources
    identify <address>           identify a well-known ENS contract by address (offline)
  namehash <name>                compute the Node of a Name
  labelhash <label>              compute the LabelHash of a single Label
```

### `ensnode omnigraph <query>`

The query string is the exact GraphQL payload — zero translation. Pass variables as a JSON object string. GraphQL is natively field-masked: select only the fields you need to keep responses (and your context) small.

> **With the `omnigraph` skill loaded (see dependencies above), still confirm every field you didn't copy verbatim from a vetted example** — check it offline with `enscli ensnode omnigraph schema <Type[.field]>`. A previous query succeeding does **not** license guessing the next one — the trap is to copy one canned example, get an answer, then hand-author the follow-up from memory. The two things most often wrong when guessed: **required input args** (a field rejects the call because it needs a `where`/`by` argument) and **non-leaf fields** (an object field needs a sub-selection, not a bare name).

<!-- AUTOGEN:omnigraph start -->

```bash
# Inline query (default namespace: mainnet)
npx enscli ensnode omnigraph '{ domain(by: { name: "vitalik.eth" }) { owner { address } } }'

# With variables
npx enscli ensnode omnigraph 'query D($n: InterpretedName!) {
  domain(by: { name: $n }) {
    canonical { name { interpreted } }
    resolve { records { addresses(coinTypes: [60]) { address } } }
  }
}' --variables '{"n":"vitalik.eth"}'
```

<!-- AUTOGEN:omnigraph end -->

Target a specific namespace or instance with the same query — `--namespace sepolia` (a hosted default) or `--ensnode-url http://localhost:4334` (any instance):

```bash
npx enscli ensnode omnigraph '{ ... }' --namespace sepolia
npx enscli ensnode omnigraph '{ ... }' --ensnode-url http://localhost:4334
```

Resolution lives in the graph — select `Domain.resolve` (records) and `Account.resolve` (primary names) inline rather than as separate calls. See the **omnigraph** skill for the full schema and query patterns.

### `ensnode omnigraph schema [Type[.field]]`

The schema ships with the CLI; explore it offline before writing a query rather than guessing field names.

<!-- AUTOGEN:omnigraph-schema start -->

```bash
# root query fields + the major types
npx enscli ensnode omnigraph schema

# a type's fields, with descriptions
npx enscli ensnode omnigraph schema Domain

# a single field
npx enscli ensnode omnigraph schema Domain.canonical

# find types/fields by keyword
npx enscli ensnode omnigraph schema --search primary
```

<!-- AUTOGEN:omnigraph-schema end -->

### `ensnode indexing-status`

<!-- AUTOGEN:indexing-status start -->

```bash
# Default namespace (mainnet)
npx enscli ensnode indexing-status

# A specific namespace
npx enscli ensnode indexing-status --namespace sepolia-v2
```

<!-- AUTOGEN:indexing-status end -->

### `ensrainbow heal <labelhash>` / `ensrainbow count`

Recover the original label behind a labelHash (accepts a `0x…` hash or an encoded `[hash]`), or count how many labels ENSRainbow can heal.

<!-- AUTOGEN:ensrainbow start -->

```bash
# Heal a labelHash to its original label
npx enscli ensrainbow heal 0xaf2caa1c2ca1d027f1ac823b529d0a67cd144264b2789fa2ea4d63a67c7103cc

# Count the labels ENSRainbow can heal
npx enscli ensrainbow count
```

<!-- AUTOGEN:ensrainbow end -->

### `datasources identify <address>`

Identify a well-known ENS contract by address — given `0xabc…`, report which datasource contract it is across the namespace's chains. Fully offline (the catalog ships with the CLI). Accepts a bare address, a chain-scoped `chainId:address`, or full CAIP-10 `eip155:chainId:address`; `--namespace` (default `mainnet`) selects which namespace to search.

Output is `{ query, matches }`. **A miss is not an error: `matches` is `[]` and the exit code is `0`** — branch on `matches.length`, don't rely on the exit code. Each match carries `namespace`, `datasource`, `contract`, `chainId`, `chain`, `address`, and the CAIP-10 `accountId`. Contracts indexed only by event (no fixed address) can't be identified and are never returned.

<!-- AUTOGEN:datasources start -->

```bash
# Identify a well-known contract by address (default namespace: mainnet, offline)
npx enscli datasources identify 0x00000000000c2e074ec69a0dfb2997ba6c7d2e1e

# Scope to a chain with chainId:address (eip155:1:0x… also accepted)
npx enscli datasources identify 1:0x57f1887a8bf19b14fc0df6fd9b2acc9af147ea85

# Search a different namespace
npx enscli datasources identify 0x94f523b8261b815b87effcf4d18e6abef18d6e4b --namespace sepolia
```

<!-- AUTOGEN:datasources end -->

### `namehash <name>` / `labelhash <label>`

Compute ENS hashes locally (no network). Inputs are normalized and validated via `enssdk` — never `toLowerCase()` a name yourself.

<!-- AUTOGEN:hash start -->

```bash
# Compute the Node of a Name (offline)
npx enscli namehash vitalik.eth

# Compute the LabelHash of a Label (offline)
npx enscli labelhash vitalik
```

<!-- AUTOGEN:hash end -->

## Related skills

See **dependencies** above for `ens-protocol` and `omnigraph`. Also related:

- **enssdk** — the TypeScript SDK `enscli` wraps, for in-app integration instead of the shell.
