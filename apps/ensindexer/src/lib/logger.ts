import type { PonderAppLogger } from "@ensnode/ponder-sdk";

import { localPonderContext } from "@/lib/local-ponder-context";

/**
 * Logger for the ENSIndexer app
 *
 * Represents the {@link PonderAppLogger} provided by
 * the Ponder runtime to the ENSIndexer app.
 */
export const logger = localPonderContext.logger;
