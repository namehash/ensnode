# Base working stage
FROM node:18-slim
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

# Copy pnpm workspace configuration files from the root directory
COPY pnpm-workspace.yaml ./
# Copy the root package.json and lockfile
COPY package.json pnpm-lock.yaml ./
# Copy all pnpm workspace modules
COPY apps ./apps
COPY packages ./packages
# Install dependencies for the entire monorepo
RUN pnpm install --frozen-lockfile
# Change to the specific app directory
WORKDIR /app/apps/ensindexer

EXPOSE 42069
CMD ["pnpm", "exec", "ponder", "start"]
