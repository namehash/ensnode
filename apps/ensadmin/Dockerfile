# Base working stage
FROM node:18-slim AS builder
RUN apt-get update && \
    npm install -g pnpm 
WORKDIR /app

# Define the environment variables during the build process
ARG VITE_ENSINDEXER_URL
ENV VITE_ENSINDEXER_URL=${VITE_ENSINDEXER_URL}

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
WORKDIR /app/apps/ensadmin
# Prepare production bundle
RUN pnpm build

# Production stage
# use the official Caddy image as the base image
# https://caddyserver.com/docs/install/docker
FROM caddy:2-alpine
COPY --from=builder /app/apps/ensadmin/dist /usr/share/caddy
# Embed Caddy configuration
# - Adds proper cache headers:
#  - Long cache (1 year) for static assets
#  - No cache for index.html to ensure fresh content
# - Includes gzip compression
# - Handles SPA routing by redirecting 404s to index.html
RUN printf ":4173 {\n\
    root * /usr/share/caddy\n\
    try_files {path} /index.html\n\
    file_server\n\
    encode gzip\n\
    header Cache-Control \"public, max-age=31536000\"\n\
    header /index.html Cache-Control \"no-cache\"\n\
}\n" > /etc/caddy/Caddyfile

EXPOSE 4173
