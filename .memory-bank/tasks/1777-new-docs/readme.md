# Task 1777: ENSNode Docs Narrative Overhaul

**Issue**: https://github.com/namehash/ensnode/issues/1777
**Scope**: `docs/ensnode.io/`


---

## Problem Statement

We need to begin a loud, urgent promotion of the new **Omnigraph API** — but right now:

1. **The narrative is outdated.** ENSNode is positioned as a "multichain indexer for ENS" / "built on Ponder". Now ENSNode is **the ENS development platform**.
2. **The Omnigraph API is invisible in the docs.** It's not mentioned anywhere in user-facing pages. There is no quickstart, no cookbook, no schema reference.
3. **Sidebar is complicated** The sidebar is split across 6 per-app topics (ENSNode, ENSApi, ENSDb, ENSIndexer, ENSRainbow, ENSAdmin). New visitors are forced to "pick an app" before understanding what the platform does. They should just be told to use the API.
4. **Resolution is a known gap in Omnigraph.** We will add Resolution feature to omnigraph soon, but we cannot block promotion on that work landing. We must promote Omnigraph **now** and mark Resolution feature as **Coming Soon**.
5. **REST JSON API is main point of integration.** It will be moved/duplicated to Omnigraph so I think we should NOT promote REST in journey-level docs. But do not remove it completely!

---

## What we already have (that the docs don't surface)

- **`enssdk`** (`packages/enssdk`, v1.10.1) — the foundational typed TypeScript client for Omnigraph. Provides `createEnsNodeClient(...).extend(omnigraph)` plus a `graphql` template tag powered by `gql.tada`. Fully type-checked queries, isomorphic, tree-shakable. Good README with a working example. Already imported by some existing docs pages (terminology, ensrainbow, querying-best-practices).
- **`enskit`** (`packages/enskit`, v1.10.1) — React toolkit. `useOmnigraphQuery` hook backed by `urql` + `@urql/exchange-graphcache`. README is a placeholder; the code is real and tested.
- **`examples/enskit-react-example/`** — a working React sample app using both packages.
- **Generated GraphQL introspection** — `enssdk` runs `gql.tada generate-output` at build time, producing introspection JSON + `schema.graphql`. The schema-reference page is a rendering problem, not a "do we have the data" problem.

---

## Goals

1. Reposition ENSNode from "indexer" to "ENS development platform" across the homepage, sidebar metadata, and top-level concept pages.
2. Make the **Omnigraph API** the front-and-center way to interact with ENSNode for ~95% of visitors.
3. Replace the 6 per-app sidebar topics with a 3-topic, **user-journey-shaped** information architecture.
4. Demote, but do not delete: REST JSON API, Subgraph-compat API, per-app deep dives. Move them under a **Reference** topic.
5. Frame the Subgraph-compat endpoint exclusively as a **backwards compatible option**, never as "the API".
6. Communicate ENSv2 readiness urgency without over-the-top marketing tactics like countdowns.


## Non-Goals

- We are **not** rewriting per-app deep-dive content (ENSIndexer internals, ENSDb schema, etc.) — only relocating it.
- We are **not** deleting the REST API. It stays available in Reference and via OpenAPI; we just stop promoting it.

---

## The Narrative Shift

- **Tagline**
  - Today: "The new multichain indexer for ENSv2"
  - New: "The ENS development platform"

- **Subtitle**
  - Today: "Multichain indexer for ENS with ENS Subgraph backwards compatibility."
  - New: "Build ENSv2-ready apps today. One API for every ENS name across every chain."

- **Mental model offered**
  - Today: "Pick one of 6 apps to learn about"
  - New: "You're an app developer. Use this API. (Want to self-host? Click here.)"

- **First-impression CTA**
  - Today: "Connect with ENSAdmin" + "Read the docs"
  - New: "Try the Omnigraph" (opens playground) + "Quickstart" (60-second doc)

- **Top-of-mind brand words**
  - Today: Ponder, indexer, plugins, Subgraph
  - New: Omnigraph API, ENSv2-ready, multichain, "one query for everything"

- **Apps suite**
  - Today: Surfaced as peers (ENSAdmin / ENSIndexer / ENSRainbow)
  - New: Demoted to "Under the hood / Components"; ENSAdmin re-cast as "the playground"

---

## The Two User Journeys

My assumption is that we have 2 usecases for user to read our documentation

**Journey A — "I want to use ENSNode" (popular)**
- A1. **App developer (greenfield)** — "I'm building with ENS. Where do I start?"
- A2. **App developer (migrator)** — "I'm using the ENS Subgraph today. How do I move?"
- A3. **Library / integration author** — "I'm building a wallet / indexer / SDK. I need stable APIs."

**Journey B — "I want to run my own ENSNode" (uncommon but still important)**
- B1. **Production self-hoster** — "I need full control / data residency / custom plugins."
- B2. **Local dev / contributor** — "I want to hack on ENSNode itself."

---

## Proposed Information Architecture

Today there are **6** top-level sidebar topics (ENSNode, ENSApi, ENSDb, ENSIndexer, ENSRainbow, ENSAdmin). Each is an app. That's the wrong axis.

Restructure the **ENSNode** topic internally into 3 user-journey subgroups:

```
1. Build with ENS         ← Journey A (default landing)
2. Self-host ENSNode      ← Journey B
3. Reference              ← terminology, REST API, Subgraph API, ENSAdmin (folded in)
```

### Topic 1: Build with ENS (the new front door)

```
Build with ENS
├── Quickstart (60 seconds -> first Omnigraph response)
├── Why ENSNode? (the platform pitch + ENSv2 urgency)
│
├── Omnigraph API
│   ├── Overview & mental model (entities, connections, vs subgraph)
│   ├── Cookbook (executable examples — see "Cookbook recipes" below)
│   ├── Schema reference (auto-generated, per-entity)
│   └── Playground (external link to `https://admin.ensnode.io/api/omnigraph`)
│
├── Client integrations (recommended path: our first-party SDKs)
│   ├── enssdk — foundational TypeScript client (typed queries via `gql.tada`, isomorphic)
│   ├── enskit — React hooks for Omnigraph (urql + graphcache under the hood). Also `enskit-react-example`
│   ├── ensjs — legacy Subgraph-compat path; Link to "Migrate from ENS Subgraph"
│   └── (advanced) Use Omnigraph without our SDK
│       └── any GraphQL client works — Omnigraph is a standard endpoint at `/api/omnigraph`
│
├── Migrate from ENS Subgraph
│   ├── Why migrate (ENSv2, multichain, performance)
│   ├── How migrate -- mapping Subgraph queries -> Omnigraph queries
│   └── What's not yet supported / "request a feature"
│
├── Hosted instances & endpoints (lifted up from /usage)
│
└── AI / LLM integrations
    └── Cursor / Claude skill packs (omnigraph, omnigraph-migration)
```

#### Cookbook recipes

Need help of @shrugs with that because I dont have full context about what omnigraph can do

1. Look up a name (basic `domain(by: { name })`)
2. Get all names owned by an address
3. Search names by prefix / fuzzy match
4. Get registration history for a name
5. Multichain: names across mainnet / Base / Linea in one query
6. Inspect a resolver's indexed records (current capability — keys + coinTypes, no values)
7. Recently registered names (top of feed)
8. (Coming Soon) Resolve a name's records (text + addresses)
9. (Coming Soon) Reverse resolution
10. Migrate a Subgraph query -> Omnigraph (with side-by-side)

### Topic 2: Self-host ENSNode

```
Self-host ENSNode
├── Should you self-host? (most users should use our hosted version, but if really want -- welcome!)
├── Architecture overview (ENSIndexer + ENSDb + ENSRainbow + ENSApi diagram)
├── Quickstart: `docker compose up`
├── Configuration
│   ├── Namespaces & plugins
│   ├── RPC providers
│   └── Full env var reference
├── Deploy
│   ├── Docker
│   ├── Terraform
│   └── Operations & monitoring (indexing-status, /amirealtime)
└── Local development with `ens-test-env`

```

### Topic 3: Reference

```
Reference
├── ENSNode glossary / terminology
├── Roadmap & ENSv2 timeline
├── Component deep-dives (collapsed by default)
│   ├── ENSApi (architecture, internals, REST endpoints catalog, Protocol Acceleration)
│   ├── ENSIndexer (Ponder, plugins, handlers)
│   ├── ENSDb (schema, our future cool snapshots)
│   ├── ENSRainbow (label healing, label sets)
│   └── ENSAdmin (the playground UI)
├── REST JSON API (Resolution, Registrar Actions, Indexing Status, etc.) — full reference, not promoted
├── Subgraph API (legacy)
├── Changelog / Releases
└── Contributing
```

---

## Homepage Rewrite

Tracked separately as an optional, decoupled sub-plan: see [homepage.md](./homepage.md).

The homepage rewrite can ship before, alongside, or after the rest of this plan. If we decide not to ship it at all, the rest of this plan still lands a coherent narrative inside the docs sidebar; the homepage just keeps its current "multichain indexer" framing.
