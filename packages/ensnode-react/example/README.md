# `ensnode-react` Example

> [!IMPORTANT] > **For React integrations with ENSNode, use [`enskit`](../../enskit), not `ensnode-react`.**
> See the [`enskit` React example](../../../examples/enskit-react-example).
>
> This app is internaldocumentation for refining `ensnode-react` before its functionality
> is folded into `enskit`.

## What it demonstrates

A bulletproof reference for managing a frontend's connection to an ENSNode instance.
Resolving a Mainnet Primary Name via `usePrimaryName` is just the payoff. The
interesting part is everything that gates it:

1. **Connection negotiation.** Wait for a healthy `useIndexingStatus` response before
   mounting feature UI.
2. **Disambiguated error handling.** Connection failures are classified as `network`
   (fetch / DNS / CORS), `application` (bad response, or `responseCode === "error"`),
   or `unsupported-namespace`. See
   [`classify-connection-error.ts`](./src/lib/classify-connection-error.ts) and
   [`RequireActiveConnection.tsx`](./src/components/RequireActiveConnection.tsx).
3. **Explicit namespace verification.** The app hardcodes an expected ENS namespace
   (defaulting to `mainnet`, overridable via `VITE_ENS_NAMESPACE`) and refuses
   connection if the ENSNode is indexing something else.
4. **Live indexing-status projection.** An
   [`IndexingStatusBadge`](./src/components/IndexingStatusBadge.tsx) shows how far
   behind realtime the connected ENSNode is, modeled on ENSAdmin's `ProjectionInfo`.

`PrimaryNameView` is intentionally thin; the connection scaffolding is the part worth copying.

## Configuration

| Env var              | Default                        | Purpose                                                                |
| -------------------- | ------------------------------ | ---------------------------------------------------------------------- |
| `VITE_ENSNODE_URL`   | `https://api.alpha.ensnode.io` | URL of the ENSNode instance to connect to.                             |
| `VITE_ENS_NAMESPACE` | `mainnet`                      | Expected ENS namespace. Connection is refused if the server disagrees. |

## Usage

```bash
pnpm install
pnpm -F @ensnode/ensnode-react-example dev
```

Point at a different ENSNode and/or namespace:

```bash
VITE_ENSNODE_URL=http://localhost:4334 VITE_ENS_NAMESPACE=sepolia pnpm -F @ensnode/ensnode-react-example dev
```
