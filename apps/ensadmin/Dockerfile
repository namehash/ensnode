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

# build ensadmin (static export outputs to /apps/ensadmin/out)
RUN pnpm --filter ensadmin build

# runner - use nginx to serve static files
FROM nginx:alpine AS runner

# Copy the static export files to nginx html directory
COPY --from=builder /app/apps/ensadmin/out /usr/share/nginx/html

# Create nginx configuration for SPA (handle client-side routing)
RUN echo 'server { \n\
    listen 4173; \n\
    server_name localhost; \n\
    root /usr/share/nginx/html; \n\
    index index.html; \n\
    location / { \n\
    try_files $uri $uri/ /index.html; \n\
    } \n\
    }' > /etc/nginx/conf.d/default.conf

EXPOSE 4173

CMD ["nginx", "-g", "daemon off;"]
