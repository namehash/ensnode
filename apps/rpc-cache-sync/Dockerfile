FROM oven/bun:1.2.4-debian AS base

# Install PostgreSQL client tools
RUN apt-get update && \
    apt-get install -y curl ca-certificates gnupg && \
    curl https://www.postgresql.org/media/keys/ACCC4CF8.asc | gpg --dearmor | tee /etc/apt/trusted.gpg.d/apt.postgresql.org.gpg >/dev/null && \
    echo "deb http://apt.postgresql.org/pub/repos/apt/ bullseye-pgdg main" > /etc/apt/sources.list.d/pgdg.list && \
    apt-get update && \
    apt-get install -y postgresql-client-17

# Create app directory
WORKDIR /app

# Install dependencies
COPY package.json bun.lock ./
RUN bun install

# Copy application sources
COPY . .

# Build the application
RUN bun run build

# Production stage
FROM oven/bun:1.2.4-debian AS production

# Install PostgreSQL client
RUN apt-get update && \
    apt-get install -y curl ca-certificates gnupg && \
    curl https://www.postgresql.org/media/keys/ACCC4CF8.asc | gpg --dearmor | tee /etc/apt/trusted.gpg.d/apt.postgresql.org.gpg >/dev/null && \
    echo "deb http://apt.postgresql.org/pub/repos/apt/ bullseye-pgdg main" > /etc/apt/sources.list.d/pgdg.list && \
    apt-get update && \
    apt-get install -y postgresql-client-17

WORKDIR /app

# Copy built application from base stage
COPY --from=base /app/node_modules /app/node_modules
COPY --from=base /app/dist /app/dist
COPY --from=base /app/public /app/public

# Expose web interface port
EXPOSE 3000

# Start the application
CMD ["bun", "run", "dist/server.js"]
