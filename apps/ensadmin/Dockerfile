FROM node:22-slim AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
WORKDIR /app

# deps/build
FROM base AS builder
COPY . .
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile

# Set the environment variable for the server's library of ENSNode URLs
ARG NEXT_PUBLIC_SERVER_CONNECTION_LIBRARY
ENV NEXT_PUBLIC_SERVER_CONNECTION_LIBRARY=${NEXT_PUBLIC_SERVER_CONNECTION_LIBRARY}

# build ensadmin with static export
RUN pnpm --filter ensadmin build

# runner - use nginx to serve static files
FROM nginx:alpine AS runner

# Copy the static export output
COPY --from=builder /app/apps/ensadmin/out /usr/share/nginx/html

# Copy nginx configuration
COPY --from=builder /app/apps/ensadmin/nginx.conf /etc/nginx/conf.d/default.conf

# Remove default nginx config
RUN rm -f /etc/nginx/conf.d/default.conf.default

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
