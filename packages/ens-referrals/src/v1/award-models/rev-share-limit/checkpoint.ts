/**
 * Zeros out the 1-digit `eventType` field in a Ponder checkpoint string.
 *
 * A Ponder checkpoint string ends with 17 digits:
 * - 1 digit for `eventType` (internal Ponder concept, irrelevant to event ordering)
 * - 16 digits for `eventIndex`
 *
 * Zeroing `eventType` allows safe bigint comparison across events from different
 * internal Ponder event types while preserving all ordering-relevant information.
 */
export function resetEncodedEventType(encodedCheckpoint: string): string {
  const encodedEventIndexLength = 16;
  const encodedEventTypeLength = 1;
  const encodedEventTypePosition =
    encodedCheckpoint.length - encodedEventIndexLength - encodedEventTypeLength;

  return (
    encodedCheckpoint.slice(0, encodedEventTypePosition) +
    "0" +
    encodedCheckpoint.slice(encodedEventTypePosition + encodedEventTypeLength)
  );
}

/**
 * Compares two Ponder checkpoint IDs for ordering purposes.
 *
 * Zeroes out the `eventType` digit before comparing as bigints, since `eventType`
 * is an internal Ponder concept not relevant to chronological event ordering.
 */
export function compareEventIds(idA: string, idB: string): number {
  const a = BigInt(resetEncodedEventType(idA));
  const b = BigInt(resetEncodedEventType(idB));
  return a < b ? -1 : a > b ? 1 : 0;
}
