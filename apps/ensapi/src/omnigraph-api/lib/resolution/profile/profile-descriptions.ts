const nullWhenUninterpretable = (condition: string) => `Returns null when ${condition}.`;

export const profileAddressFieldDescription = (coinLabel: string) =>
  `The interpreted ${coinLabel} address. ${nullWhenUninterpretable(
    "the raw address record is unset, empty (`0x`), all-zero, not valid hex, or cannot be decoded and encoded for this coin type per ENSIP-9",
  )}`;

export const profileSocialFieldDescription = (platform: string) =>
  `The interpreted ${platform} account. ${nullWhenUninterpretable(
    `the raw record is unset, empty, or cannot be parsed as a ${platform} handle or profile URL`,
  )}`;

export const profileWebsiteFieldDescription =
  "The interpreted website on the profile of an ENS name.";

export const profileImageHttpUrlFieldDescription = (recordLabel: "avatar" | "header") =>
  `HTTP-compatible URL for fetching the ${recordLabel} image in web browsers. Abstraction over the raw ${recordLabel} record (IPFS, CAIP NFT references, etc.). ${nullWhenUninterpretable(
    "the raw value is not a direct http(s) URL and no fallback URL can be derived (including when the ENS Metadata Service is unavailable for this namespace)",
  )} See https://docs.ens.domains/ensip/12.`;

export const profileAddressesContainerDescription =
  "The interpreted addresses on the profile of an ENS name.";

export const profileSocialsContainerDescription =
  "The interpreted social accounts on the profile of an ENS name.";
