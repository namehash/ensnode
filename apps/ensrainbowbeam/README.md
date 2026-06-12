# EnsRainbowBeam

Workspace package: `ensrainbowbeam` (`apps/ensrainbowbeam`).

Receives ENS label submissions from external callers, classifies each label against ENSNode's
indexed Label table, and (for now) emits a structured JSON line per submission to stdout.

The app is intentionally minimal; persistent storage, batched on-chain emission, and a
caller-leaderboard are explicitly deferred to follow-up work (see GitHub issue
[#2003](https://github.com/namehash/ensnode/issues/2003)). The submission JSONL shape is the
future row shape so adding a sink later is mechanical.

## Endpoints

- `GET /health` — liveness probe; always returns `{ message: "ok" }`.
- `POST /api/discover` — accepts `{ labels: string[], callerAddress: Address }` and responds
  with per-label classification (`unknown_in_index` / `healed_in_index` / `absent_from_index`).

## How label classification works

For each submitted raw label EnsRainbowBeam:

1. Normalizes the label under ENSIP-15. Labels that cannot be normalized are skipped
   (`skipped_unnormalized`).
2. Computes `labelhashLiteralLabel` on the normalized literal only (never on the raw
   submission when it differs from the normalized form).
3. Sends every distinct normalized LabelHash to ENSNode via the typed `enssdk/omnigraph`
   client using the `labels(by: { labelHashes })` query (batched when a submission exceeds
   the Omnigraph per-request cap).
4. Classifies each processable label against that single hash:
   - `unknown_in_index` — the hash is present in the index but not yet healed (i.e.
     `interpreted` is the encoded labelhash form). These are the interesting submissions for
     future on-chain emission.
   - `healed_in_index` — the hash is present and already healed.
   - `absent_from_index` — the hash is not present in the index.

## Configuration

| Env var       | Required            | Description                                                                  |
| ------------- | ------------------- | ---------------------------------------------------------------------------- |
| `PORT`        | no (default `4444`) | HTTP listen port.                                                            |
| `ENSNODE_URL` | yes                 | Base URL of an ENSNode (ENSApi) instance with Omnigraph at `/api/omnigraph`. |

See `.env.local.example` for a local-development template.

## Development

```bash
npx pnpm@10.13.1 -F ensrainbowbeam dev
npx pnpm@10.13.1 -F ensrainbowbeam typecheck
npx pnpm@10.13.1 -F ensrainbowbeam test
```
