# Base working stage
FROM node:18-slim
RUN apt-get update && \
    npm install -g pnpm \
    npm install -g ponder
WORKDIR /app

# Copy pnpm workspace configuration files from the root directory
COPY pnpm-workspace.yaml ./
# Copy the root package.json and lockfile
COPY package.json pnpm-lock.yaml ./
# Copy all pnpm workspace modules
COPY packages ./packages
COPY apps/ensnode ./ensnode
# Install dependencies for the entire monorepo
RUN pnpm install --frozen-lockfile
# Change to the specific app directory
WORKDIR /app/ensnode

EXPOSE 42069
CMD [ "pnpm", "start" ]
