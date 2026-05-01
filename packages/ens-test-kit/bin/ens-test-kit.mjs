#!/usr/bin/env node

import("../dist/cli/seed.js")
  .then(({ runSeedCli }) => runSeedCli(process.argv.slice(2)))
  .catch((error) => {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[ens-test-kit] ${message}`);
    process.exit(1);
  });
