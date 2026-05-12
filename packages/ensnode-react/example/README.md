# ensnode-react Example

A minimal React app demonstrating how to use `@ensnode/ensnode-react` to resolve
an address' Mainnet Primary Name (via `usePrimaryName`).

By default it connects to the NameHash-hosted alpha ENSNode at
`https://api.alpha.ensnode.io`.

## Usage

```bash
pnpm install
pnpm -F @ensnode/ensnode-react-example dev
```

To point at a different ENSNode, set `VITE_ENSNODE_URL`:

```bash
VITE_ENSNODE_URL=http://localhost:4334 pnpm -F @ensnode/ensnode-react-example dev
```
