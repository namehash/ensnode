FROM node:24-slim AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
WORKDIR /app

FROM base AS deps
COPY . .
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile

FROM deps AS runner
WORKDIR /app/apps/ens-labels-collector
ENV NODE_ENV=production
EXPOSE 4444

CMD ["pnpm", "start"]
