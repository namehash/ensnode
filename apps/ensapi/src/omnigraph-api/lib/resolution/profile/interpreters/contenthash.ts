import { type Codec, decode, getCodec } from "@ensdomains/content-hash";

import type { ProfileFieldInterpreter } from "./types";

export const CODEC_TO_CONTENTHASH_PROTOCOL = {
  ipfs: "IPFS",
  ipns: "IPNS",
  swarm: "SWARM",
  arweave: "ARWEAVE",
  onion: "ONION",
  onion3: "ONION3",
  skynet: "SKYNET",
} as const satisfies Record<Codec, string>;

export const CONTENTHASH_PROTOCOL_VALUES = Object.values(
  CODEC_TO_CONTENTHASH_PROTOCOL,
) as ContenthashProtocolValue[];

export type ContenthashProtocolValue =
  (typeof CODEC_TO_CONTENTHASH_PROTOCOL)[keyof typeof CODEC_TO_CONTENTHASH_PROTOCOL];

export type ProfileContenthashModel = {
  protocolType: ContenthashProtocolValue;
  decoded: string;
  uri: string;
  httpUrl: string | null;
};

/**
 * Maps each known protocol type to its canonical URI prefix and optional default HTTP gateway builder.
 * Extend this map when new contenthash protocols are standardized.
 */
const PROTOCOL_CONFIG: Record<
  Codec,
  { uriPrefix: string; httpUrl: ((decoded: string) => string) | null }
> = {
  ipfs: {
    uriPrefix: "ipfs://",
    httpUrl: (decoded) => `https://ipfs.io/ipfs/${decoded}`,
  },
  ipns: {
    uriPrefix: "ipns://",
    httpUrl: (decoded) => `https://ipfs.io/ipns/${decoded}`,
  },
  swarm: {
    uriPrefix: "bzz://",
    httpUrl: (decoded) => `https://gateway.ethswarm.org/bzz/${decoded}`,
  },
  arweave: {
    uriPrefix: "ar://",
    httpUrl: (decoded) => `https://arweave.net/${decoded}`,
  },
  onion: {
    uriPrefix: "onion://",
    httpUrl: null,
  },
  onion3: {
    uriPrefix: "onion3://",
    httpUrl: null,
  },
  skynet: {
    uriPrefix: "sia://",
    httpUrl: null,
  },
};

export const ProfileContenthashInterpreter: ProfileFieldInterpreter<ProfileContenthashModel> = {
  selection: { contenthash: true },
  interpret(result) {
    const raw = result.records.contenthash;
    if (raw == null || raw === "0x") return null;

    try {
      const hex = raw.startsWith("0x") ? raw.slice(2) : raw;
      if (hex.length === 0) return null;

      const codec = getCodec(hex);
      if (!codec) return null;

      const decoded = decode(hex);
      const config = PROTOCOL_CONFIG[codec];
      const prefix = config ? config.uriPrefix : `${codec}://`;
      const uri = `${prefix}${decoded}`;
      const httpUrl = config?.httpUrl?.(decoded) ?? null;

      return {
        protocolType: CODEC_TO_CONTENTHASH_PROTOCOL[codec],
        decoded,
        uri,
        httpUrl,
      };
    } catch {
      return null;
    }
  },
};
