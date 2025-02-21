# ensrainbow-data contains an already ingested DB that will be served by the ENSRainbow app
# Using a prebuilt image for ensrainbow-data (infrequently changes) reduces build time for the ENSRainbow app image
FROM ghcr.io/namehash/ensnode/ensrainbow-data AS ensrainbow-data

FROM node:18-slim AS base
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

# copy data dir from ensrainbow-data
COPY --from=ensrainbow-data /app/apps/ensrainbow/data ./data

# validate the database
RUN pnpm run validate:lite

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3223
EXPOSE 3223

# serve
CMD ["pnpm", "run", "serve"]
