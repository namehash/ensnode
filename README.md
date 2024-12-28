# ens-multichain indexer

> powered by ponder

estimated backfill time @ 50rps = 24-36 hours on M1 Macbook (~10x speedup)

### goals

> an optimized, multichain ens indexer that the community loves and integrates

- ease of deployment for indiviudals to run their own infra
- faster, more efficient, easier to use and deploy implementation
- v1 — **high confidence in subgraph equivalency**
  - 1:1 equivalency of results for queries via ensjs
    - 100% ensjs, ens-app-v3 test suites passing
    - should 'just work', following [this documentation](https://github.com/ensdomains/ensjs/blob/main/docs/basics/custom-subgraph-uris.md)
  - ensjs equivalency confirmed via [ens-indexer-transition-tools](https://github.com/namehash/ens-indexer-transition-tools)
- v2 — **optimized multichain indexer w/ unified namespace**
  - true multichain indexing (mainnet, base, linea, etc)
  - flattened, unified, multichain namespace
  - support key ens-app-v3 and wallet ENS funtions via optimized resolvers & PRs
  - high quality human-readable (healed) list of names by owner, necessary for many UX
  - (possible) continued backwards compatibility with subgraph
  - support indexing subset of data, i.e. only domains under parent node

### known bugs

- [ ] there's an account `0x` in the database, which is definitely a bug
  - add a check at callsite to throw the event that causes this
- [ ] root domain is not `is_migrated`, definitely should be after new registry is created

### todo

- [ ] confirm all the schema relations are configured correctly
- [ ] integrate rainbow tables for label healing
  - load the tabel dump into pglite & query synchronously to match existing behavior
  - https://github.com/graphprotocol/ens-rainbow
- [ ] subgraph graphql implementation within ponder
  - [ ] implement subgraph-style pagination api
  - [ ] support the well-known queries in `GRAPHQL.md`
  - [ ] support collection queries as well, to power `snapshot-eq`
- [ ] CI/CD with indexing?
  - more recent endlbock for gut checks
- [ ] there's an account `0x` in the database, which is definitely a bug — perhaps all addresses should go through `viem/getAddress` before being handled (presumably ponder did this inthe background...)
- [ ] better understand reverse resolution & how that pertains to L2 primary names and impacts the future schema, etc
- [ ] run the relevant tests from ensjs against our indexer to increase confidence
  - probably requires a fork of ensjs, update the publicClient instantiation, and scope tests to that dir

### notes

- eth registry is ERC721, has many controllers (), no knowledge of pricing — delegated to registrar controllers
- eth old registry & new registry migration due to security issue, new then fallback to old, therefore ignore all old evens on domains that have been seen by new registry

### ENSIP Ideas

- unable to automatically identify subname registries via onchain event, CCIP standard dosn't include any info about data source, so we'll need to encode manually for now
- ENSIP - shared interface for subdomain registrars
- ENSIP — standard for how a resolver on L1 can (optionally) emit an event specifying contract on an L2 that it proxies records from
  - optional, in the popular case of L2-managed subnames
  - removes centralized dependency on the CCIP Gateway
  - flaky test experience with .cb.id name gateway
  - also helps indexer discovery
