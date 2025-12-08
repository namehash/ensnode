import { HighResolutionSyncedClock, SyncedClock } from "@/lib/synced-clock";

/**
 * Synced System Clock
 *
 * There is just one instance of it in ENSAdmin.
 */
export const systemClock: SyncedClock = new HighResolutionSyncedClock();
