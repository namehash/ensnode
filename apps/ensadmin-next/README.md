# ENSAdmin

ENSAdmin provides a convenient dashboard for navigating the state of ENS as indexed by a connected ENSNode instance.

## Quick start

### Install dependencies

```bash
pnpm install
```

### Set configuration

```bash
cp .env.local.example .env.local
```

You can update `PREFERRED_ENSNODE_URL` environment variable if you wish ENSAdmin to include a given URL as an initial connection option.

#### RPC URLs for ENS Name Resolution

ENSAdmin uses [wagmi](https://wagmi.sh/) to resolve primary ENS names for Ethereum addresses. You need to provide RPC URLs for each chain where ENS is deployed:

- `RPC_URL_1` - Ethereum Mainnet (Chain ID: 1)
- `RPC_URL_11155111` - Sepolia Testnet (Chain ID: 11155111)
- `RPC_URL_17000` - Holesky Testnet (Chain ID: 17000)

You can obtain these URLs from providers like [Alchemy](https://www.alchemy.com/) or [Infura](https://www.infura.io/).

### Run development server

Following [Next.js docs](https://nextjs.org/docs/pages/api-reference/cli/next#next-dev-options):
> Starts the application in development mode with Hot Module Reloading (HMR), error reporting, and more.

```bash
pnpm dev
```

### Preview production website

Following [Next.js docs](https://nextjs.org/docs/pages/api-reference/cli/next#next-build-options):

> Creates an optimized production build of your application.

```bash
pnpm build
```

> Starts the application in production mode.

```bash
pnpm start
```
