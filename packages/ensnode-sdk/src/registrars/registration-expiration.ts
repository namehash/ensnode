export interface RegistrationExpiryInfo {
  expiry: bigint | null;
  gracePeriod: bigint | null;
}

/**
 * Returns whether Registration is expired. If the Registration includes a Grace Period, the
 * Grace Period window is considered expired.
 */
export function isRegistrationExpired(registration: RegistrationExpiryInfo, now: bigint): boolean {
  // no expiry, never expired
  if (registration.expiry == null) return false;

  // otherwise check against now
  return registration.expiry <= now;
}

/**
 * Returns whether Registration is fully expired. If the Registration includes a Grace Period, the
 * Grace Period window is considered NOT fully-expired.
 */
export function isRegistrationFullyExpired(
  registration: RegistrationExpiryInfo,
  now: bigint,
): boolean {
  // no expiry, never expired
  if (registration.expiry == null) return false;

  // otherwise it is expired if now >= expiry + grace
  return now >= registration.expiry + (registration.gracePeriod ?? 0n);
}

/**
 * Returns whether Registration is in grace period.
 */
export function isRegistrationInGracePeriod(
  registration: RegistrationExpiryInfo,
  now: bigint,
): boolean {
  if (registration.expiry == null) return false;
  if (registration.gracePeriod == null) return false;

  //
  return registration.expiry <= now && registration.expiry + registration.gracePeriod > now;
}
