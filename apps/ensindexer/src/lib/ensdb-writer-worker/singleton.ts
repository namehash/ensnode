import { ensDbClient } from "@/lib/ensdb-client/singleton";
import { ensIndexerClient } from "@/lib/ensindexer-client/singleton";
import { indexingStatusBuilder } from "@/lib/indexing-status-builder/singleton";

import { EnsDbWriterWorker } from "./ensdb-writer-worker";

export const ensDbWriterWorker = new EnsDbWriterWorker(
  ensDbClient,
  ensIndexerClient,
  indexingStatusBuilder,
);
