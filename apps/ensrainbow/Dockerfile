# ensrainbow-data contains already populated DB that will be served by the application
# Using a prebuilt image reduces build time for infrequently changing data
FROM ghcr.io/namehash/ensnode/ensrainbow-data AS base

RUN apt-get update && \
    npm install -g pnpm
WORKDIR /app

# Runtime dependencies stage
FROM base AS ensrainbow.runtime_deps
# Copy pnpm workspace configuration files from the root directory
COPY pnpm-workspace.yaml ./
# Copy the root package.json and lockfile
COPY package.json pnpm-lock.yaml ./
# Copy all pnpm workspace modules
COPY packages ./packages
COPY apps ./apps
# Install dependencies for the entire monorepo
RUN pnpm install --frozen-lockfile
# Change to the specific app directory
WORKDIR /app/apps/ensrainbow
# Transpile TypeScript files into JavaScript
RUN pnpm build

# Application runtime stage
FROM base AS ensrainbow.runtime
# Copy top-level dependencies
COPY --from=ensrainbow.runtime_deps /app/node_modules node_modules
# Change to the specific app directory
WORKDIR /app/apps/ensrainbow
# Copy built files and dependencies
COPY --from=ensrainbow.runtime_deps /app/apps/ensrainbow/package*.json .
COPY --from=ensrainbow.runtime_deps /app/apps/ensrainbow/node_modules node_modules
COPY --from=ensrainbow.runtime_deps /app/apps/ensrainbow/dist dist

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3001
EXPOSE 3001
# Start the application
CMD ["node", "dist/cli.js", "serve"]
