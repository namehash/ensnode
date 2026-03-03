// This file is the entry point for the ENSDb Writer Worker.
// It must be placed inside the `api` directory of the Ponder app to avoid
// the following build issue:
// Error: Invalid dependency graph. Config, schema, and indexing function files
// cannot import objects from the API function file "src/api/index.ts".

import { startEnsDbWriterWorker } from "@/lib/ensdb-writer-worker/singleton";

startEnsDbWriterWorker();
