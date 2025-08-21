# Runtime image for ENSRainbow
FROM --platform=${TARGETPLATFORM} node:22-slim AS runtime

# Install only essential system dependencies for runtime
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
RUN chmod +x /app/apps/ensrainbow/scripts/entrypoint.sh
RUN chmod +x /app/apps/ensrainbow/scripts/download-prebuilt-database.sh

# Set environment variables
ENV NODE_ENV=production
# PORT will be used by entrypoint.sh, defaulting to 3223 if not set at runtime
# DB_SCHEMA_VERSION, LABEL_SET_ID, LABEL_SET_VERSION must be provided at runtime to the entrypoint

# Default port, can be overridden by PORT env var for the entrypoint/serve command
EXPOSE 3223

# Set the entrypoint
ENTRYPOINT ["/app/apps/ensrainbow/scripts/entrypoint.sh"]
