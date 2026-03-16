import { localPonderClient } from "@/lib/local-ponder-client";

import { IndexingStatusBuilder } from "./indexing-status-builder";

export const indexingStatusBuilder = new IndexingStatusBuilder(localPonderClient);
