import { getConfig } from "@/config";

import { serve } from "@hono/node-server";

import app from "@/app";

const config = getConfig();

const server = serve(
  {
    fetch: app.fetch,
    port: config.port,
  },
  (info) => {
    console.log(`ens-labels-collector listening on port ${info.port}`);
  },
);

const closeServer = () =>
  new Promise<void>((resolve, reject) =>
    server.close((err) => {
      if (err) reject(err);
      else resolve();
    }),
  );

const gracefulShutdown = async () => {
  try {
    await closeServer();
    process.exit(0);
  } catch (error) {
    console.error("[ens-labels-collector] shutdown error", error);
    process.exit(1);
  }
};

process.on("SIGINT", gracefulShutdown);
process.on("SIGTERM", gracefulShutdown);

process.on("uncaughtException", async (error) => {
  console.error("[ens-labels-collector] uncaughtException", error);
  await gracefulShutdown();
});
