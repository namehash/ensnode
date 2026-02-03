FROM node:24-slim AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*
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

CMD ["pnpm", "start"]
