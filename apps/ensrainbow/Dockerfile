# Base working stage
FROM node:20-slim AS base
RUN apt-get update && \
    apt-get install -y wget && \
    npm install -g pnpm
WORKDIR /app

###################
## Data Stage — heavily cached remote data
###################

FROM base AS db-data
ADD "https://bucket.ensrainbow.io/ens_names.sql.gz" ./ens_names.sql.gz
ADD "https://bucket.ensrainbow.io/ens_names.sql.gz.sha256sum" ./ens_names.sql.gz.sha256sum
RUN sha256sum -c ens_names.sql.gz.sha256sum

###################
## Ingest Dependencies Stage — minimal deps for ingest script
###################

FROM base AS ingest-deps

# copy pnpm files from the root directory
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# copy just the dependent packages (sync with package.json)
# TODO: this could be even more minimal
COPY packages/ensrainbow-sdk ./packages/ensrainbow-sdk
COPY packages/ensnode-utils ./packages/ensnode-utils

# cwd to ensrainbow
WORKDIR /app/apps/ensrainbow
# copy ensrainbow package.json
COPY apps/ensrainbow/package*.json ./

# need cli
COPY apps/ensrainbow/src/cli.ts ./src/

# TODO: have to copy all commands because cli.ts imports all of them
COPY apps/ensrainbow/src/commands ./src/commands/

# TODO: cli imports lib/server, so have to include that too
COPY apps/ensrainbow/src/lib ./src/lib/

# need all utils
COPY apps/ensrainbow/src/utils ./src/utils/

RUN ls -la src && ls -la src/commands

# install
RUN pnpm install --frozen-lockfile

###################
## Ingest Runtime Stage — produces data dir artifact
###################

FROM ingest-deps AS ingest

WORKDIR /app/apps/ensrainbow
# copy ens_names.sql.gz from db-data
COPY --from=db-data /app/ens_names.sql.gz .

# produce the data dir artifact
RUN pnpm run ingest

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

# copy data dir from ingest
COPY --from=ingest /app/apps/ensrainbow/data ./data

# set environment variables
ENV NODE_ENV=production
ENV PORT=3223
EXPOSE 3223

# serve
CMD ["pnpm", "run", "serve"]
