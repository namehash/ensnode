import type { ReferralEvent } from "./referral-event";

/**
 * Sorts referral events into the chronological order in which each registrar action
 * was executed onchain.
 */
export function sortReferralEvents(events: ReferralEvent[]): ReferralEvent[] {
  return [...events].sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
}
