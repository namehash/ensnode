#!/usr/bin/env node

import { runMain } from "citty";

import { main } from "./main";

// Exit cleanly when output is piped into a command that closes the pipe early (e.g. `| head`).
process.stdout.on("error", (error: NodeJS.ErrnoException) => {
  if (error.code === "EPIPE") process.exit(0);
  throw error;
});

runMain(main);
