# Fallback ENSApi

A lightweight AWS Lambda that provides an infrastructure-level fallback for API requests sent to the ENSApi instances hosted by NameHash.

**fallback-ensapi is written for use within the NameHash team's own infrastructure, and may not generalize to other deployments of ENSNode.**

NameHash operates infrastructure-level monitoring of the health of all of their ENSNode deployments. In the event these monitoring systems determine that a NameHash operated ENSNode deployment has become unhealthy, the monitoring system will automatically redirect all API requests sent to the ENSApi instance associated with an unhealthy ENSNode to this Fallback ENSApi until the load balancer determines that the ENSNode instances are healthy again.

This Fallback ENSApi proxies ENS Subgraph GraphQL API requests originally sent to ENSApi to TheGraph's ENS Subgraph using an API key for TheGraph held in AWS Secrets Manager under the secret id defined by the `THEGRAPH_API_KEY_SECRET_ID` environment variable.

When run in production, it also requires configuration of the `CLOUDFLARE_SECRET` environment variable to avoid exposing our `/subgraph` proxy to the public net.

For data consistency, this fallback is exclusively enabled for NameHash's ENSNode deployments that use a [Subgraph Compatible](https://www.ensnode.io/docs/concepts/what-is-the-ens-subgraph/) configuration. More specifically:
- Mainnet: https://api.mainnet.ensnode.io/
- Sepolia: https://api.sepolia.ensnode.io/

The following NameHash ENSNode deployments are _not_ fully [Subgraph Compatible](https://www.ensnode.io/docs/concepts/what-is-the-ens-subgraph/), as they produce a _superset_ of the data indexed by TheGraph. Fallback ENSApi will return an HTTP 503 (Service Unavailable) in response to any Subgraph API requests for these deployments:
- Mainnet: https://api.alpha.ensnode.io/
- Sepolia: https://api.alpha-sepolia.ensnode.io/

Finally, for all other ENSApi requests, Fallback ENSApi will return an HTTP 503 (Service Unavailable), as it is unable to handle them.

## Observability

When you access the root of an ENSApi instance, it will serve a small welcome page. In Fallback ENSApi, the title will be "Fallback ENSApi", to indicate that your request was handled by the Fallback ENSApi.

## Building

Build the Lambda function using esbuild:

```bash
pnpm build
```

This will:
- Transpile TypeScript to ESM using [bin/build.mjs](bin/build.mjs)
- Create `dist/lambda.zip` for deployment
- Generate `dist/meta.json` for bundle analysis

The `lambda.zip` artifact is also available in the GitHub Actions workflow summary after CI builds.

## Environment Variables

Required environment variable in development:

```env
THEGRAPH_API_KEY=your_api_key_here
```

Required environment variable in production, via AWS Secret Manager:

```env
THEGRAPH_API_KEY_SECRET_ID=arn:...
```

## Development

Run the Hono app as a Node server in development with:

```bash
pnpm dev
```

## License

Licensed under the MIT License, Copyright © 2025-present [NameHash Labs](https://namehashlabs.org).

See [LICENSE](./LICENSE) for more information.
