# Use a slim Node.js image as the base
FROM --platform=${TARGETPLATFORM} node:22-slim AS base

# Install system dependencies required for downloading and extracting .ensrainbow files
RUN apt-get update && apt-get install -y wget tar && rm -rf /var/lib/apt/lists/*

# Set up pnpm
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

# Set the working directory
WORKDIR /app

# Copy all source files to the /app directory
# This includes the main application and any scripts like download-prebuilt-database.sh
COPY . .

# Install dependencies using pnpm
# This will install dependencies for all packages in the monorepo, including ensrainbow
# Using --prod to only install production dependencies for a smaller image, if applicable,
# or ensure all necessary scripts are available if not using --prod.
# The `download-prebuilt-database.sh` and `entrypoint.sh` don't have separate pnpm deps,
# but `pnpm run serve` and `pnpm run validate:lite` do.
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile

# Copy the entrypoint script and make it executable
# Ensure this path is correct relative to the monorepo root during COPY
COPY ./apps/ensrainbow/scripts/entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

# Copy the download script and make it executable (if not already handled by COPY . . and permissions)
# It's assumed to be in /app/apps/ensrainbow/scripts/download-prebuilt-database.sh after `COPY . .`
RUN chmod +x /app/apps/ensrainbow/scripts/download-prebuilt-database.sh

# Set environment variables for the application
ENV NODE_ENV=production
# PORT will be used by entrypoint.sh, defaulting to 3223 if not set at runtime
# SCHEMA_VERSION, LABEL_SET_ID, LABEL_SET_VERSION must be provided at runtime to the entrypoint

# Default port, can be overridden by PORT env var for the entrypoint/serve command
EXPOSE 3223

# Set the entrypoint to the new script
ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]

