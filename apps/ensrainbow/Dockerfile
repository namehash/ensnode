# ensrainbow-data contains an already ingested DB that will be served by the ENSRainbow app
# Using a prebuilt image for ensrainbow-data (infrequently changes) reduces build time for the ENSRainbow app image
# ensrainbow-data image is only supporting amd64 arch hence define platform at the FROM statement
ARG DATA_IMAGE_PLATFORM=linux/amd64
# DATA_IMAGE_NAME is set to either "ensrainbow-data" (default) or "ensrainbow-v2-data" based on the build context.
# It can be set using the --build-arg flag when building the Docker image.
ARG DATA_IMAGE_NAME="ensrainbow-data"

FROM --platform=${DATA_IMAGE_PLATFORM} ghcr.io/namehash/ensnode/${DATA_IMAGE_NAME} AS ensrainbow-data

FROM --platform=${BUILDPLATFORM} oven/bun:1-slim AS base
ARG PNPM_VERSION=9.12.0
RUN apt-get update && \
    apt-get install -y curl gnupg && \
    mkdir -p /etc/apt/keyrings && \
    curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg && \
    echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_18.x nodistro main" | tee /etc/apt/sources.list.d/nodesource.list && \
    apt-get update && \
    apt-get install -y nodejs && \
    npm install -g pnpm@${PNPM_VERSION}
WORKDIR /app

###################
## Application Deps — standard monorepo pnpm install from base
###################

FROM base AS app-deps
COPY pnpm-workspace.yaml ./
COPY package.json pnpm-lock.yaml ./

# Create a custom .npmrc to skip optional dependencies (including Bun)
RUN echo "optional=false" > .npmrc

# Copy packages and apps directories
COPY packages ./packages
COPY apps ./apps

# Install dependencies without optional dependencies (including Bun)
RUN pnpm install --frozen-lockfile --ignore-scripts

###################
## App Server — runs server w/ data dir
###################

FROM app-deps AS app

# cwd to ensrainbow
WORKDIR /app/apps/ensrainbow

# copy data dir from ensrainbow-data
COPY --from=ensrainbow-data /app/data ./data

# Run a lightweight database validation to ensure the pre-built database is intact and compatible
# This validation checks critical database integrity without performing a full validation,
# which helps reduce container build time while still ensuring the application can start properly
RUN pnpm run validate:lite

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3223
EXPOSE 3223

# serve
CMD ["pnpm", "run", "serve"]
