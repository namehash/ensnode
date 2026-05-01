FROM node:24-slim AS build
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
WORKDIR /workspace

COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY patches ./patches
COPY packages/ens-test-kit ./packages/ens-test-kit
COPY packages/datasources ./packages/datasources
COPY packages/enssdk ./packages/enssdk
COPY packages/shared-configs ./packages/shared-configs

RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile
RUN pnpm -F @ensnode/ens-test-kit build

FROM ghcr.io/ensdomains/contracts-v2:main-9f26a8f AS runtime

RUN apt-get update \
  && apt-get install -y --no-install-recommends ca-certificates curl nodejs \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app/contracts

COPY --from=build /workspace/node_modules /workspace/node_modules
COPY --from=build /workspace/packages/ens-test-kit /workspace/packages/ens-test-kit
COPY --from=build /workspace/packages/datasources /workspace/packages/datasources
COPY --from=build /workspace/packages/enssdk /workspace/packages/enssdk
COPY packages/ens-test-kit/devnet/entrypoint.sh /usr/local/bin/ens-test-kit-entrypoint.sh

RUN chmod +x /usr/local/bin/ens-test-kit-entrypoint.sh

ENV ANVIL_IP_ADDR=0.0.0.0
ENV DEVNET_RPC_URL=http://localhost:8545
ENV SEED_SENTINEL_PATH=/tmp/ens-test-kit-seeded

ENTRYPOINT ["/usr/local/bin/ens-test-kit-entrypoint.sh"]
