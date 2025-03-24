FROM node:18-slim AS base

FROM base AS builder

ARG NEXT_PUBLIC_DEFAULT_ENSNODE_URL
ARG PNPM_VERSION=9.12.0

RUN apt-get update && \
    apt-get install -y \
        curl \
        gnupg \
        python3 \
        make \
        g++ && \
    npm install -g pnpm@${PNPM_VERSION}

WORKDIR /app

# Install dependencies based on the preferred package manager
# Copy pnpm workspace configuration files from the root directory
COPY pnpm-workspace.yaml ./
# Copy the root package.json and lockfile
COPY package.json pnpm-lock.yaml ./
# Copy the app package.json
COPY apps/ensadmin/package.json ./apps/ensadmin/package.json
# Copy all pnpm workspace modules
COPY packages ./packages
# Install dependencies for the entire monorepo
RUN pnpm install --frozen-lockfile

# Set the environment variable for next.config.ts
# This will be used to determine if the build output should be standalone
ENV NEXT_BUILD_OUTPUT_STANDALONE=true

# Set the environment variable for the default ENSNode URL
ENV NEXT_PUBLIC_DEFAULT_ENSNODE_URL=${NEXT_PUBLIC_DEFAULT_ENSNODE_URL}

# Copy the app source code
COPY apps/ensadmin ./apps/ensadmin
# Build the app
RUN pnpm --filter @ensnode/ensadmin build

# # 3. Production image, copy all the files and run next
FROM base AS runner

WORKDIR /app

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
