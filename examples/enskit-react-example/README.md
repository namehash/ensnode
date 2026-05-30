# enskit React Example

A minimal React app demonstrating how to use `enskit` and `enssdk` to query the ENS Omnigraph API.

The app connects to a local ENSNode instance and includes demos for browsing domains, registry cache usage, and paginated queries.

This app is hosted at [https://enskit-react-example.ensnode.io/](https://enskit-react-example.ensnode.io/) and pulls data from the NameHash-hosted Sepolia V2 Namespace.

## Usage (with NameHash Hosted Instance)

> **Schema version:** This example tracks the NameHash-hosted instances' version (`1.15.x`). If you query a different ENSNode version, you must match its ENSNode version with the same `enskit`/`enssdk` version.

```sh
# from the ENSNode monorepo root
pnpm install

pnpm -F enskit-react-example dev
```

## Usage (with Local ENSNode)

First, follow the [ENSNode Contributing Documentation](https://ensnode.io/docs/contributing) to get ENSNode running on your local machine. At the end of this, ENSApi should be available on port `:4334`.

```sh
# from the ENSNode monorepo root
pnpm install

VITE_ENSNODE_URL=http://localhost:4334 pnpm -F enskit-react-example dev
```
