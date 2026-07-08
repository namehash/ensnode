# fallback-ensapi

AWS Lambda that proxies Subgraph requests to The Graph when a NameHash-hosted ENSApi is unhealthy. NameHash-infra-specific; logic does NOT generalize to third-party deployments.

## Two distinct fallbacks — do not conflate

- This Lambda = **infra-level** fallback. It only runs once an external health-check/load-balancer has already decided an ENSApi is down and rerouted traffic here. It cannot see indexer realtime status.
- `thegraphFallbackMiddleware` (apps/ensapi) = **in-app** fallback. Runs inside a healthy ENSApi, proxies to The Graph per-request only when the indexer is not realtime, and falls through to internal Subgraph handling if the proxy throws.
- Both share the same `canFallbackToTheGraph` SDK helper (`@ensnode/ensnode-sdk/internal`, source `packages/ensnode-sdk/src/shared/thegraph.ts`) → same fallback rules, same `gateway.thegraph.com` target URLs. Keep them in sync via that helper; don't fork the logic.

## Routing / activation (out of this repo)

- The health monitoring + DNS/load-balancer reroute that sends traffic to this Lambda lives in NameHash's private infra, NOT in `terraform/` here. Don't go looking for it in this repo.
- This app's only job: given a rerouted request, decide if it can satisfy it and proxy or 503.

## Request handling invariants

- Only `/subgraph` is served. `/health` and `/` (welcome page titled "Fallback ENSApi") aside, everything else → 503.
- Target deployment is identified by parsing the `Host` header (`api.<configTemplateId>.…`, see `parse-host-header.ts`), NOT a path/body param. New hosted deployments must match that regex.
- `canFallback` is false (→ 503) for non-Subgraph-compatible (alpha/superset) deployments and namespaces The Graph doesn't host (SepoliaV2, ens-test-env). 503 here is correct behavior, not an error — proxying would corrupt results.

## Auth / secrets

- `/subgraph` requires header `x-origin-secret` == `CLOUDFLARE_SECRET` (despite the "cloudfront/cloudflare" naming). In production the app **throws at boot** if `CLOUDFLARE_SECRET` is unset; in dev the check is a no-op.
- The Graph API key: dev reads `THEGRAPH_API_KEY` from `.env.local`; prod fetches from AWS Secrets Manager by `THEGRAPH_API_KEY_SECRET_ID` (secret stored as a JSON object keyed by `THEGRAPH_API_KEY`). Fetched once at module load — throws if missing.
- `NODE_ENV === "production"` is the dev/prod switch for both secret sourcing and whether the local `@hono/node-server` runs. esbuild hard-defines it to `"production"` at build, tree-shaking the node-server path out of the Lambda bundle.

## Build / deploy

- `pnpm build` → esbuild bundles `src/index.ts` to `dist/index.mjs`, then zips to `dist/lambda.zip` (+ `dist/meta.json` for bundle analysis). `@aws-sdk/*` is marked external (provided by the Lambda runtime).
- CI (`release*.yml` via `.github/actions/build_and_publish_lambda`) uploads `lambda.zip` as a GitHub Actions artifact. Actual Lambda deploy is done out-of-repo from that artifact.
