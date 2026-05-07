# Task 1777: ENSNode Docs Narrative Overhaul

**Issue**: https://github.com/namehash/ensnode/issues/1777
**Scope**: `docs/ensnode.io/`


---

## Problem Statement

We need to begin a loud, urgent promotion of the new **ENS Omnigraph API** — but right now:

1. **The narrative is outdated.** ENSNode is positioned as a "multichain indexer for ENS" / "built on Ponder". Now ENSNode is **the ENS development platform**.
2. **The ENS Omnigraph API is invisible in the docs.** It's not mentioned anywhere in user-facing pages. There is no quickstart, no cookbook, no schema reference.
3. **Sidebar is complicated.** The sidebar is split across 6 per-app topics (ENSNode, ENSApi, ENSDb, ENSIndexer, ENSRainbow, ENSAdmin). New visitors are forced to "pick an app" before understanding what the platform does. They should be led to **ENS Omnigraph** first (with self-host second).
4. **Resolution on the ENS Omnigraph is on the roadmap.** The legacy ENS Subgraph never offered protocol resolution inside the same GraphQL API. The roadmap adds resolver **values**, reverse resolution, and related identity-style queries directly on ENS Omnigraph so **indexed state and resolution converge in one typed surface**.
5. **REST JSON API is NOT the main point of integration.** It will be moved/folded toward ENS Omnigraph over time so we **do NOT** promote REST at the journey layer. Reference-only. Do **not** remove REST documentation.

---


## What we already have (that the docs don't surface)

- **`enssdk`** (`packages/enssdk`, v1.10.1) — foundational ENS TypeScript toolkit: normalization/name utilities, typed models, **and** the typed client for **ENS Omnigraph** (`createEnsNodeClient(...).extend(omnigraph)` plus the `graphql` tag powered by `gql.tada`). Already imported by some existing docs pages (terminology, ensrainbow, querying-best-practices).
- **`enskit`** (`packages/enskit`, v1.10.1) — React toolkit: `useOmnigraphQuery` backed by `urql` + `@urql/exchange-graphcache`. README is a placeholder; implementation is exercised in tests/examples.
- **`examples/enskit-react-example/`** — working React sample combining both packages.
- **Generated GraphQL artifacts** — `enssdk` runs `gql.tada generate-output` at build time, yielding introspection output and `schema.graphql`. Missing piece for the docs site is **authoring/UI** that turns that into readable reference pages in Starlight (the schema data itself is not absent).

---


## Goals

Deliver a docs experience where **builders find value in two screens**: what ENSNode unlocks (*why*, ENSv2-readiness story) and how to integrate (*how*, ENS Omnigraph + SDKs)—without drowning in indexer internals until they opt in.

1. Reposition ENSNode from "multichain indexer for ENS" to **the ENS development platform** across sidebar metadata and top concepts.
2. Make **ENS Omnigraph** the default integration path on the journey—not the legacy ENS Subgraph surface, not REST.
3. Restructure the **ENSNode** sidebar topic internally into Build / Self-host / Reference (per-app ENSApi … ENSRainbow stay top-level for now; ENSAdmin folds into Reference per implementation plan).
4. Demote but retain: REST OpenAPI/reference, legacy Subgraph-compat endpoint narrative, deeper per-app docs.
5. Frame the legacy **ENS Subgraph-compatible** GraphQL as **historical integration path**, **legacy / ENSv1-era indexing mindset**, strongly steered readers toward ENS Omnigraph. Use **deprecated** language only after product aligns with ENS Labs/external comms—we can ship **legacy + recommended**.
6. ENSv2 readiness story without countdown UX (static phased timeline OK).

---


## Non-Goals

- We are **not** rewriting per-app deep-dive content (ENSIndexer internals, ENSDb schema, etc.) — only relocating it.
- We are **not** deleting the REST API. It stays available in Reference and via OpenAPI; we just stop promoting it.

---


## Integration layers (mental model)

Top to bottom in direction of popularity

1. **`enskit`** — React integrations; ENS Omnigraph + opinionated UX patterns.
2. **`enssdk`** — Any TypeScript/JavaScript codebase; ENS utilities + ENS Omnigraph.
3. **ENS Omnigraph (HTTP `/api/omnigraph`)** — GraphQL usable from **any language** without depending on ENS’s TS ecosystem only.
4. **ENSDb (PostgreSQL)** — Direct database access when you operate your own ENSNode and need custom services or analytics not exposed by the APIs.

---


## The Narrative Shift

- **Primary tagline**
  - Today (site/meta): “The new multichain indexer for ENSv2” + subgraph framing.
  - New (primary candidate): **“The ENS development platform”**
  - Alternate candidate: **“The full‑stack ENS development platform”**

- **Subtitle**
  - Today: "Multichain indexer for ENS with ENS Subgraph backwards compatibility."
  - New: "Build ENSv2-ready apps today. One API for every ENS name across every chain."

- **Mental model**
  - Today: "Pick one of 6 apps to learn about"
  - New: Pick your **integration depth** (`enskit` → `enssdk` → raw ENS Omnigraph → ENSDb with selfhost).

- **First-impression CTAs**
  - Today: ENSAdmin-connect primary + passive docs secondary.
  - New: Prefer **guided docs**: Short quickstart (`enssdk` + ENS Omnigraph), then choose `enskit` (frontend), `enssdk` (backend), raw graphql endpoint or raw `ensdb`

- **Top-of-mind brand words**
  - Today: Ponder, indexer, plugins, Subgraph
  - New: ENS Omnigraph API, ENSv2-ready, multichain, "one query for everything"

- **Apps suite**
  - Today: Surfaced as peers (ENSAdmin / ENSIndexer / ENSRainbow)
  - New: Demoted to "Under the hood / Components"; ENSAdmin re-cast as "the playground"

---


## The Two User Journeys

My assumption is that we have 2 usecases for user to read our documentation

**Journey A — "I want to use ENSNode" (popular)**

- A1. **App developer (greenfield)** — wallet / app integrations: start at Quickstart → ENS Omnigraph overview → SDK tier that fits (`enskit` / `enssdk` / raw GraphQL).
- A2. **App developer (migrator)** — migrated from legacy **ENS Subgraph** usage: Migrate guide + parity/differences + optional `viem`/chain subgraph URL bridging only inside that branch.
- A3. **Custom ENS services on that need more that API** — builders running custom ENS services on top of `ENSDb`. To access `ENSDb` you need your own `ENSNode` stack via **Journey B**

**Journey B — "I want to run my own ENSNode" (still important)**

- B1. **Production self‑host**
- B2. **Local dev / contributor**

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
├── Quickstart (≈60s → first ENS Omnigraph response via `enssdk`, would be great if use could run this JS examply in browser)
├── Why ENSNode? (@lightwalker has a lot of background about that, dont forget to ask him about that)
├── ENSv2 Readiness
├── ENS Omnigraph API
│   ├── Overview & typed mental model vs legacy ENS Subgraph schema. How ENS Omnigraph prepares builders even before ENSv2 release
│   ├── Cookbook with "try it in ENSAdmin playground" (see below)
│   └── Schema reference (should be generated from code)
├── Integrations
│   ├── `enskit` + `enskit-react-example`
│   ├── `enssdk`
│   ├── Raw GraphQL endpoint (`/api/omnigraph`)
│   └── Raw database access with ENSDb (requires self-host)
├── Migrate from legacy ENS Subgraph
│   ├── Why migrate (multichain, ENSv2 story)
│   ├── How to migrate (query-shape mapping + LLM skill)
│
├── Hosted Instances & canonical endpoint table
└── AI / LLM tooling (skills — future docs)
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


### Topic 2: Self-host ENSNode

```
Self-host ENSNode
├── Should you self-host? (hosted first; link alpha / decision guidance)
├── Architecture overview — **ENSIndexer + ENSDb + ENSRainbow + ENSApi inside one “ENSNode” boundary** ; **ENSAdmin outside** as a reference client pointed at `/api/indexing-status` of ENSApi.
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


if something doesnt make sense then remove

```
Reference
├── ENSNode glossary / terminology
├── Roadmap & ENSv2 timeline
├── Component deep-dives
│   ├── ENSApi (architecture, internals, REST endpoints catalog, Protocol Acceleration)
│   ├── ENSIndexer (Ponder, plugins, handlers)
│   ├── ENSDb (schema, our future cool snapshots)
│   ├── ENSRainbow (label healing, label sets)
│   └── ENSAdmin (the playground UI)
├── REST JSON API (Resolution, Registrar Actions, Indexing Status, etc.) — full reference, not promoted
├── Subgraph API (legacy)
│   └── ENSNode-hosted `/subgraph` + `viem`/ensjs subgraph URL patterns. Marked as legacy and we recommend to use ENS Omnigraph
├── Changelog / Releases
└── Contributing
```

---

## Homepage Rewrite

Tracked separately as an optional, decoupled sub-plan: see [homepage.md](./homepage.md).

The homepage rewrite can ship before, alongside, or after the rest of this plan. If we decide not to ship it at all, the rest of this plan still lands a coherent narrative inside the docs sidebar; the homepage just keeps its current "multichain indexer" framing.
