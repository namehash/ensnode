# enssdk Example

A minimal TypeScript script demonstrating how to use `enssdk` to query the ENS Omnigraph API.

Companion to the [enssdk integration guide](https://ensnode.io/docs/integrate/integration-options/enssdk).

## Usage (with NameHash Hosted Instance)

> **Schema version:** This example tracks the NameHash-hosted instances' version (`1.15.x`). If you query a different ENSNode version, you must match its ENSNode version with the same `enskit`/`enssdk` version.

```sh
# from the ENSNode monorepo root
pnpm install

pnpm -F enssdk-example start
```

## Usage (with Local ENSNode)

First, follow the [ENSNode Contributing Documentation](https://ensnode.io/docs/contributing) to get ENSNode running on your local machine. At the end of this, ENSApi should be available on port `:4334`.

```sh
# from the ENSNode monorepo root
pnpm install

ENSNODE_URL=http://localhost:4334 pnpm -F enssdk-example start
```

## License

Licensed under the MIT License, Copyright © 2025-present [NameHash Labs](https://namehashlabs.org).

See [LICENSE](./LICENSE) for more information.
