# ensrainbow-data contains already populated DB that will be served by the application
# Using a prebuilt image reduces build time for infrequently changing data
FROM ghcr.io/namehash/ensnode/ensrainbow-data AS base

RUN apt-get update && \
    npm install -g pnpm
WORKDIR /app

###################
## Application Deps — standard monorepo pnpm install from base
###################

FROM base AS app-deps
COPY pnpm-workspace.yaml ./
COPY package.json pnpm-lock.yaml ./
COPY packages ./packages
COPY apps ./apps
RUN pnpm install --frozen-lockfile

###################
## App Server — runs server w/ data dir
###################

FROM app-deps AS app

# cwd to ensrainbow
WORKDIR /app/apps/ensrainbow
# Copy built files and dependencies
COPY --from=app-deps /app/apps/ensrainbow/package*.json .
COPY --from=app-deps /app/apps/ensrainbow/node_modules node_modules
COPY --from=app-deps /app/apps/ensrainbow/dist dist

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3223
EXPOSE 3223

# serve
CMD ["pnpm", "run", "serve"]
