FROM mcr.microsoft.com/devcontainers/javascript-node:20

# Install PostgreSQL
RUN apt-get update && \
      apt-get install -y \
        postgresql-client

# Install global tools
RUN npm install -g pnpm
RUN npm install -g bun

USER node
WORKDIR /workspaces/ensnode
