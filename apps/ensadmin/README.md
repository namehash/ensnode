# ENSAdmin

ENSAdmin provides a convenient dashboard for navigating the state of ENS as indexed by a connected ENSIndexer instance.

## Quick start

### Install dependencies

```bash
pnpm install
```

### Set configuration

```bash
cp .env.local.example .env.local
```

You can update `VITE_ENSINDEXER_URL` environment variable if you wish ENSAdmin to start with a custom ENSIndexer URL.

### Run development server

Following [Vite docs](https://vite.dev/guide/cli.html#dev-server):
> Start Vite dev server in the current directory.

```bash
pnpm dev
```

### Preview production website

Following [Vite docs](https://vite.dev/guide/cli.html#vite-preview):

> Locally preview the production build. Do not use this as a production server as it's not designed for it.

```bash
pnpm build && pnpm preview
```
