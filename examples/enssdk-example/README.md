# enssdk Example

A minimal TypeScript script demonstrating how to use `enssdk` to query the ENS Omnigraph API.

Companion to the [enssdk integration guide](https://ensnode.io/docs/integrate/integration-options/enssdk).

## Usage (with NameHash Hosted Instance)

> **Schema version:** This example tracks the latest Omnigraph schema (ENSNode 1.14.x). It connects to the `blue` hosted deployment by default, which runs `1.14.x`; the production hosted instances still serve an older schema (`1.13.x`) that wouldn't satisfy these queries. If you query a hosted instance from your own app, match its ENSNode version with the same `enskit`/`enssdk` version.

```sh
# from the ENSNode monorepo root
pnpm install

ENSNODE_URL=https://api.v2-sepolia.blue.ensnode.io pnpm -F enssdk-example start
````

## Usage (with Local ENSNode)

First, follow the [ENSNode Contributing Documentation](https://ensnode.io/docs/contributing) to get ENSNode running on your local machine. At the end of this, ENSApi should be available on port `:4334`.

```sh
# from the ENSNode monorepo root
pnpm install

ENSNODE_URL=http://localhost:4334 pnpm -F enssdk-example start
```
