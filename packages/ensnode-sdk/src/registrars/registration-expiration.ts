export interface RegistrationExpiryInfo {
  expiry: bigint | null;
  gracePeriod: bigint | null;
}

/**
 * Returns whether Registration is expired. If the Registration includes a Grace Period, the
 * Grace Period window is considered expired.
 */
export function isRegistrationExpired(info: RegistrationExpiryInfo, now: bigint): boolean {
  // no expiry, never expired
  if (info.expiry == null) return false;

  // otherwise check against now
  return info.expiry <= now;
}

/**
 * Returns whether Registration is fully expired. If the Registration includes a Grace Period, the
 * Grace Period window is considered NOT fully-expired.
 */
export function isRegistrationFullyExpired(info: RegistrationExpiryInfo, now: bigint): boolean {
  // no expiry, never expired
  if (info.expiry == null) return false;

  // otherwise it is expired if now >= expiry + grace
  return now >= info.expiry + (info.gracePeriod ?? 0n);
}

/**
 * Returns whether Registration is in grace period.
 */
export function isRegistrationInGracePeriod(info: RegistrationExpiryInfo, now: bigint): boolean {
  if (info.expiry == null) return false;
  if (info.gracePeriod == null) return false;

  return info.expiry <= now && info.expiry + info.gracePeriod > now;
}
