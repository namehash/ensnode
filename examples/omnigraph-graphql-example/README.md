# Omnigraph GraphQL Example

A minimal TypeScript script demonstrating how to query the ENS Omnigraph API directly over HTTP — no SDK, just `fetch`.

The Omnigraph is a standard GraphQL API following the Relay spec, so any GraphQL client (or plain `fetch`) works.

Companion to the [ENS Omnigraph GraphQL API integration guide](https://ensnode.io/docs/integrate/integration-options/omnigraph-graphql-api).

## Usage (with NameHash Hosted Instance)

> **Schema version:** This example targets the latest Omnigraph schema (ENSNode 1.14.x). It queries the `blue` hosted deployment, which runs 1.14.x; the default (non-`blue`) hosted instances still serve an older schema. The Omnigraph schema is versioned with ENSNode, so point this example at a deployment whose version matches the queries below.

```sh
# from the ENSNode monorepo root
pnpm install

ENSNODE_URL=https://api.v2-sepolia.blue.ensnode.io pnpm -F omnigraph-graphql-example start
```

## Usage (with Local ENSNode)

First, follow the [ENSNode Contributing Documentation](https://ensnode.io/docs/contributing) to get ENSNode running on your local machine. At the end of this, ENSApi should be available on port `:4334`.

```sh
# from the ENSNode monorepo root
pnpm install

ENSNODE_URL=http://localhost:4334 pnpm -F omnigraph-graphql-example start
```
