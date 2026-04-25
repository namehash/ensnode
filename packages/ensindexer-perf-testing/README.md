# @ensnode/ensindexer-perf-testing

Local Prometheus + Grafana bundle for benchmarking ENSIndexer throughput.

## What's in the box

- **Prometheus** on `http://localhost:9090`, scraping `host.docker.internal:42069/metrics` every 5s (6h retention, admin API enabled).
- **Grafana** on `http://localhost:3001` (anonymous admin, no login) with a pre-provisioned Prometheus datasource and a **Ponder / ensindexer** dashboard.

Dashboard panels are tuned for indexer perf work:

- Top handlers by share of wall-clock time (`rate(ponder_indexing_function_duration_sum[1m]) / 1000`)
- Handler p95 duration (top 15)
- Events/sec per event and total
- Total events per handler (bar gauge)
- Synced block + historical blocks/sec per chain
- RPC req/s + p95 duration per chain/method
- Node event-loop lag p99, Postgres queue size, DB store queries/sec

## Usage

From this package's directory:

```bash
pnpm up       # start prometheus + grafana
pnpm down     # stop and remove containers
pnpm logs     # tail container logs
pnpm wipe     # purge prometheus series (useful between benchmark runs)
```

Then start the indexer in another terminal (`pnpm -F ensindexer dev`) and open the dashboard at <http://localhost:3001/d/ensindexer>.

The scrape target is `host.docker.internal:42069` — on macOS that resolves to the host via the `host-gateway` declaration in the compose file. On Linux hosts you may need Docker 20.10+ for the same behavior.
