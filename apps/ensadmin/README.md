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

Available environment variables:

- `NEXT_PUBLIC_SERVER_CONNECTION_LIBRARY` - Comma-separated list of ENSNode URLs offered as connection options (defaults to NameHash's hosted instances)
- `ENSADMIN_PUBLIC_URL` - The public URL where ENSAdmin is hosted (optional, auto-detected for Vercel)

### Run development server

Starts the application in development mode with Hot Module Reloading (HMR), error reporting, and more:

```bash
pnpm dev
```

The development server runs on http://localhost:4173

### Preview production build locally

Creates an optimized static export and serves it locally:

```bash
pnpm build
pnpm start
```

The production server runs on http://localhost:4173

## Docker Deployment

ENSAdmin is deployed as a static site using nginx. The application is built with Next.js static export and served via nginx on port 4173.

### Build Docker image

```bash
docker build -f apps/ensadmin/Dockerfile -t ensadmin .
```

### Run Docker container

```bash
docker run -p 4173:4173 ensadmin
```

The application will be available at http://localhost:4173

### Nginx configuration

The Docker image includes a custom nginx configuration (`nginx.conf`) that:

- Serves the static export from `/usr/share/nginx/html`
- Handles any URL redirects
- Includes security headers

## Documentation

For detailed documentation and guides, see the [ENSAdmin Documentation](https://ensnode.io/ensadmin).

## License

Licensed under the MIT License, Copyright © 2025-present [NameHash Labs](https://namehashlabs.org).

See [LICENSE](./LICENSE) for more information.
