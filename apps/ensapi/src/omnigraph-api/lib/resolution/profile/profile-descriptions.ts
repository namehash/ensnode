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
  "Interpreted website metadata. Returns null when the raw url record is unset, empty, or cannot be parsed as a valid http(s) URL.";

export const profileImageHttpUrlFieldDescription = (recordLabel: "avatar" | "header") =>
  `HTTP-compatible URL for fetching the ${recordLabel} image in web browsers. Abstraction over the raw ${recordLabel} record (IPFS, CAIP NFT references, etc.). ${nullWhenUninterpretable(
    "the raw value is not a direct http(s) URL and no fallback URL can be derived (including when the ENS Metadata Service is unavailable for this namespace)",
  )} See https://docs.ens.domains/ensip/12.`;

export const profileAddressesContainerDescription =
  "Interpreted multicoin address records on a Name profile. Each field returns null independently when its raw record cannot be interpreted.";

export const profileSocialsContainerDescription =
  "Interpreted social accounts on a Name profile. Each field returns null independently when its raw record cannot be interpreted.";
