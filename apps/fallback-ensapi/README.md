# Fallback ENSApi

A lightweight AWS Lambda function that handles ENSApi request that cannot be otherwise handled (due to catastrophic system failure):
- proxies Subgraph GraphQL API requests to The Graph's ENS Subgraph
- 503s everything else

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

Required environment variable:

```env
THEGRAPH_API_KEY=your_api_key_here
```

## Development

Run the Hono app as a Node server in development with

```bash
pnpm dev
```

## License

Licensed under the MIT License, Copyright © 2025-present [NameHash Labs](https://namehashlabs.org).

See [LICENSE](./LICENSE) for more information.
