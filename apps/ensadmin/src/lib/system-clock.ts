import { createSyncedClock } from "@/lib/synced-clock";

/**
 * Synced System Clock
 *
 * There is just one instance of it in ENSAdmin.
 */
export const systemClock = createSyncedClock();
