FROM node:22-slim AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
WORKDIR /app

# deps/build
FROM base AS builder
COPY . .
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile

# Set the environment variable for the default ENSNode URLs
ARG NEXT_PUBLIC_DEFAULT_ENSNODE_URLS
ENV NEXT_PUBLIC_DEFAULT_ENSNODE_URLS=${NEXT_PUBLIC_DEFAULT_ENSNODE_URLS}

# Set the environment variable for next.config.ts
# This will be used to determine if the build output should be standalone
ENV NEXT_BUILD_OUTPUT_STANDALONE=true

# build ensadmin
RUN pnpm --filter ensadmin build

# runner
FROM base AS runner

# Set the environment variable for the default ENSNode URLs
ARG NEXT_PUBLIC_DEFAULT_ENSNODE_URLS
ENV NEXT_PUBLIC_DEFAULT_ENSNODE_URLS=${NEXT_PUBLIC_DEFAULT_ENSNODE_URLS}
ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/apps/ensadmin/public ./apps/ensadmin/public
COPY --from=builder --chown=nextjs:nodejs /app/apps/ensadmin/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/ensadmin/.next/static ./apps/ensadmin/.next/static

USER nextjs

EXPOSE 4173
ENV PORT=4173
ENV HOSTNAME=0.0.0.0

CMD ["node", "apps/ensadmin/server.js"]
