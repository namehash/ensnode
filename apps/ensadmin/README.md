# ENSAdmin

This is a website dedicated to browsing ENSNode metrics and tracking its performance.

## Quick start

### Install dependencies

```bash
pnpm install
```

### Set configuration

```bash
cp .env.local.example .env.local
```

You can update `VITE_ENSNODE_URL` environment variable if you wish ENSAdmin to start with a custom ENSNode URL.

### Run development server

```bash
pnpm dev
```

### Preview production website

```bash
pnpm build && pnpm preview
```
