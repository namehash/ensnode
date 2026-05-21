# Omnigraph GraphQL Example

A minimal TypeScript script demonstrating how to query the ENS Omnigraph API directly over HTTP — no SDK, just `fetch`.

The Omnigraph is a standard GraphQL API following the Relay spec, so any GraphQL client (or plain `fetch`) works.

Companion to the [ENS Omnigraph GraphQL API integration guide](https://ensnode.io/docs/integrate/integration-options/omnigraph-graphql-api).

## Usage (with NameHash Hosted Instance)

> **Version compatibility:** Our hosted ENSNode instances currently run ENSNode v1.13. If you are querying them from your own app, you **must** use `enssdk@1.13.1` (and `enskit@1.13.1` when using React). The latest published versions (`1.14.0+`) contain breaking changes in the Omnigraph API data model not yet deployed to our hosted infrastructure. This notice will be removed once the hosted instances are upgraded.

```sh
# from the ENSNode monorepo root
pnpm install

ENSNODE_URL=https://api.alpha.ensnode.io pnpm -F omnigraph-graphql-example start
```

## Usage (with Local ENSNode)

First, follow the [ENSNode Contributing Documentation](https://ensnode.io/docs/contributing) to get ENSNode running on your local machine. At the end of this, ENSApi should be available on port `:4334`.

```sh
# from the ENSNode monorepo root
pnpm install

ENSNODE_URL=http://localhost:4334 pnpm -F omnigraph-graphql-example start
```
