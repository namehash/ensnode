# Runtime image for ENSRainbow
FROM node:24-slim AS runtime

# Install only essential system dependencies for runtime.
# `wget` and `tar` are required by scripts/download-prebuilt-database.sh, which the in-process
# entrypoint spawns to fetch the pre-built database archive.
RUN apt-get update && apt-get install -y wget tar && rm -rf /var/lib/apt/lists/*

# Set up pnpm
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

# Set the working directory
WORKDIR /app

# Copy package files for dependency installation
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/ packages/
COPY patches/ patches/
COPY apps/ensrainbow/package.json apps/ensrainbow/

# Install dependencies
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile

# Copy the application source and scripts
COPY apps/ensrainbow/src/ apps/ensrainbow/src/
COPY apps/ensrainbow/scripts/ apps/ensrainbow/scripts/
COPY apps/ensrainbow/tsconfig.json apps/ensrainbow/
COPY apps/ensrainbow/vitest.config.ts apps/ensrainbow/

# Make scripts executable
RUN chmod +x /app/apps/ensrainbow/scripts/download-prebuilt-database.sh

# Set environment variables
ENV NODE_ENV=production
# PORT is consumed by the entrypoint command, defaulting to 3223 if not set at runtime.
# DB_SCHEMA_VERSION, LABEL_SET_ID, LABEL_SET_VERSION must be provided at runtime to the entrypoint.

# Default port, can be overridden by PORT env var for the entrypoint command
EXPOSE 3223

# The entrypoint binds the HTTP server immediately (so /health and /ready respond while the
# database is still being downloaded) and runs download + validation in the background.
# See src/commands/entrypoint-command.ts for implementation details.
WORKDIR /app/apps/ensrainbow
ENTRYPOINT ["pnpm", "run", "entrypoint"]
