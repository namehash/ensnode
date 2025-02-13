# Base working stage
FROM node:20-slim
RUN apt-get update && \
    npm install -g pnpm 
WORKDIR /app

# Define the environment variables during the build process
ARG VITE_ENSNODE_URL
ENV VITE_ENSNODE_URL=${VITE_ENSNODE_URL}

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

EXPOSE 4173
CMD ["pnpm", "preview"]
