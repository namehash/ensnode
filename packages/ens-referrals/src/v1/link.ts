import { type Address, getAddress } from "viem";

/**
 * Build a URL to the official ENS manager app
 * where the given {@link Address} is set as the referrer.
 */
export function buildEnsReferralUrl(address: Address): URL {
  const ensAppUrl = new URL("https://app.ens.domains");

  ensAppUrl.searchParams.set("referrer", getAddress(address));

  return ensAppUrl;
}
