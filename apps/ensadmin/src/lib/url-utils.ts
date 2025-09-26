import { type UrlString } from "@ensnode/ensnode-sdk";

export const normalizeUrl = (url: UrlString): UrlString => {
  try {
    return new URL(url).toString();
  } catch {
    // If URL parsing fails, try prefixing with https://
    return new URL(`https://${url}`).toString();
  }
};

export const isValidUrl = (url: UrlString): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};
