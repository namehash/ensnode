FROM node:20-slim 
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
COPY . /app
WORKDIR /app

RUN pnpm install --prod --frozen-lockfile

EXPOSE 8000
CMD [ "pnpm", "start" ]