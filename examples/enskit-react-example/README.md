# enskit React Example

A minimal React app demonstrating how to use `enskit` and `enssdk` to query the ENS Omnigraph API.

The app connects to a local ENSNode instance and includes demos for browsing domains, registry cache usage, and paginated queries.

This app is hosted at [https://enskit-react-example.ensnode.io/](https://enskit-react-example.ensnode.io/) and pulls data from the NameHash-hosted Sepolia V2 Namespace.

## Usage (with NameHash Hosted Instance)

> **Schema version:** This example tracks the latest Omnigraph schema (ENSNode 1.14.x). It connects to the `blue` hosted deployment by default, which runs `1.14.x`; the production hosted instances still serve an older schema (`1.13.x`) that wouldn't satisfy these queries. If you query a hosted instance from your own app, match its ENSNode version with the same `enskit`/`enssdk` version.

```sh
# from the ENSNode monorepo root
pnpm install

# set the VITE_ENSNODE_URL to a NameHash Hosted Instance and run this example in dev mode
VITE_ENSNODE_URL=https://api.v2-sepolia.blue.ensnode.io pnpm -F enskit-react-example dev
```

## Usage (with Local ENSNode)

First, follow the [ENSNode Contributing Documentation](https://ensnode.io/docs/contributing) to get ENSNode running on your local machine. At the end of this, ENSApi should be available on port `:4334`.

```sh
# from the ENSNode monorepo root
pnpm install

# run this example in dev mode, defaults to connecting to an ENSApi at http://localhost:4334
pnpm -F enskit-react-example dev
```
