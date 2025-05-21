FROM node:22-slim AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
ENV PONDER_COMMAND=start
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

# NOTE: we use this $PONDER_COMMAND pattern because railway terraform provider can't override CMD
CMD pnpm exec ponder $PONDER_COMMAND
