FROM node:22-slim AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
WORKDIR /app

# deps/build
FROM base AS builder
COPY . .
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile

ENV NEXT_TELEMETRY_DISABLED=1

# build ensadmin with static export
RUN pnpm --filter ensadmin build

# runner - use nginx to serve static files
FROM nginx:alpine AS runner

# Copy the static export output
COPY --from=builder /app/apps/ensadmin/dist /usr/share/nginx/html

# Replace default nginx configuration with our own
RUN rm -f /etc/nginx/conf.d/default.conf.default
COPY --from=builder /app/apps/ensadmin/nginx.conf /etc/nginx/conf.d/default.conf

# Include custom docker-entrypoint.sh for generating runtime-config
COPY --from=builder /app/apps/ensadmin/docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

EXPOSE 4173
ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]
