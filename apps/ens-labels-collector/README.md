# ens-labels-collector

Receives ENS Label submissions from external callers, classifies each label against ENSNode's
indexed Label table, and (for now) emits a structured JSON line per submission to stdout.

The app is intentionally minimal; persistent storage, batched on-chain emission, and a
caller-leaderboard are explicitly deferred to follow-up work (see GitHub issue
[#2003](https://github.com/namehash/ensnode/issues/2003)). The submission JSONL shape is the
future row shape so adding a sink later is mechanical.

## Endpoints

- `GET /health` — liveness probe; always returns `{ message: "ok" }`.
- `POST /api/submissions` — accepts `{ labels: string[], callerAddress: Address }` and
  responds with per-label classification (`unknown_in_index` / `healed_in_index` /
  `absent_from_index`).

## How label classification works

For each submitted raw label the collector:

1. Computes `labelhashLiteralLabel(rawLabel)`.
2. If the label is normalizable AND the normalized form differs from the raw label, also
   computes `labelhashLiteralLabel(normalizedLabel)`.
3. Sends every distinct labelhash to ENSNode via the typed `enssdk/omnigraph` client using
   the `labels(by: { hashes })` query.
4. Classifies each submitted label:
   - `unknown_in_index` — at least one of its hashes is present in the index but not yet
     healed (i.e. `interpreted` is the encoded labelhash form). These are the interesting
     submissions for future on-chain emission.
   - `healed_in_index` — at least one of its hashes is present in the index and all
     returned hits are already healed.
   - `absent_from_index` — none of its hashes are present in the index.

## Configuration

| Env var | Required | Description |
|---------|----------|-------------|
| `PORT` | no (default `4444`) | HTTP listen port. |
| `ENSNODE_URL` | yes | Base URL of an ENSNode (ENSApi) instance with Omnigraph at `/api/omnigraph`. |

See `.env.local.example` for a local-development template.

## Development

```bash
pnpm -F ens-labels-collector dev
pnpm -F ens-labels-collector typecheck
pnpm -F ens-labels-collector test
```
