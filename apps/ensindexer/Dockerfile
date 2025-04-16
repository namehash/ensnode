FROM node:22-slim AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
WORKDIR /app

# deps
FROM base AS deps
COPY . .
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile

# runner
FROM deps AS runner
WORKDIR /app/apps/ensindexer
ENV NODE_ENV=production
EXPOSE 42069
CMD ["pnpm", "exec", "ponder", "start"]
