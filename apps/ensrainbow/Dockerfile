# Use a slim Node.js image as the base
FROM --platform=${TARGETPLATFORM} node:22-slim AS base

# Install system dependencies required for downloading and extracting
RUN apt-get update && apt-get install -y wget tar && rm -rf /var/lib/apt/lists/*

# Set up pnpm
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

# Set the working directory
WORKDIR /app

# Copy all source files to the /app directory
# This includes the main application and any scripts like download-database-artifact.sh
COPY . .

# Install dependencies using pnpm
# This will install dependencies for all packages in the monorepo, including ensrainbow
# Using --prod to only install production dependencies for a smaller image, if applicable,
# or ensure all necessary scripts are available if not using --prod.
# The `download-database-artifact.sh` and `entrypoint.sh` don't have separate pnpm deps,
# but `pnpm run serve` and `pnpm run validate:lite` do.
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile

# Specifically for ensrainbow, ensure any build steps are done if necessary.
# If `pnpm run serve` or `validate:lite` require a build step for ensrainbow itself:
# WORKDIR /app/apps/ensrainbow
# RUN pnpm run build # If there's a build script for ensrainbow itself
# WORKDIR /app # Return to root for subsequent general commands if any

# Copy the entrypoint script and make it executable
# Ensure this path is correct relative to the monorepo root during COPY
COPY ./apps/ensrainbow/entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

# Copy the download script and make it executable (if not already handled by COPY . . and permissions)
# It's assumed to be in /app/apps/ensrainbow/download-database-artifact.sh after `COPY . .`
RUN chmod +x /app/apps/ensrainbow/download-database-artifact.sh

# Set environment variables for the application
ENV NODE_ENV=production
# PORT will be used by entrypoint.sh, defaulting to 3223 if not set at runtime
# SCHEMA_VERSION, NAMESPACE, LABEL_SET must be provided at runtime to the entrypoint

# Default port, can be overridden by PORT env var for the entrypoint/serve command
EXPOSE 3223

# Set the entrypoint to the new script
ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]

