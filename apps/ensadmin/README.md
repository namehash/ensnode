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

You can update the `NEXT_PUBLIC_SERVER_CONNECTION_LIBRARY` environment variable if you wish ENSAdmin to include a given list of comma-separated URLs as the server-defined library of connection options.

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

## Documentation

For detailed documentation and guides, see the [ENSAdmin Documentation](https://ensnode.io/ensadmin).

## License

Licensed under the MIT License, Copyright © 2025-present [NameHash Labs](https://namehashlabs.org).

See [LICENSE](./LICENSE) for more information.
