import {
  arbitrum,
  arbitrumSepolia,
  base,
  baseSepolia,
  linea,
  lineaSepolia,
  mainnet,
  optimism,
  optimismSepolia,
  scroll,
  scrollSepolia,
} from "viem/chains";
import { describe, expect, it } from "vitest";

import { DEFAULT_EVM_CHAIN_ID, evmChainIdToCoinType } from "./coin-type";
import { parseReverseName } from "./parse-reverse-name";
import { reverseName } from "./reverse-name";

const EXAMPLE_ADDRESS = "0x51050ec063d393217b436747617ad1c2285aeeee";
const CHAIN_IDS = [
  DEFAULT_EVM_CHAIN_ID,
  arbitrum.id,
  arbitrumSepolia.id,
  base.id,
  baseSepolia.id,
  linea.id,
  lineaSepolia.id,
  mainnet.id,
  optimism.id,
  optimismSepolia.id,
  scroll.id,
  scrollSepolia.id,
];

const positiveCases: Array<[string, Exclude<ReturnType<typeof parseReverseName>, undefined>]> = [
  [
    "51050ec063d393217b436747617ad1c2285aeeee.default.reverse",
    {
      address: "0x51050ec063d393217b436747617ad1c2285aeeee",
      coinType: evmChainIdToCoinType(DEFAULT_EVM_CHAIN_ID),
    },
  ],
  [
    "51050ec063d393217b436747617ad1c2285aeeee.addr.reverse",
    {
      address: "0x51050ec063d393217b436747617ad1c2285aeeee",
      coinType: evmChainIdToCoinType(mainnet.id),
    },
  ],
  [
    "51050ec063d393217b436747617ad1c2285aeeee.8000000a.reverse",
    {
      address: "0x51050ec063d393217b436747617ad1c2285aeeee",
      coinType: evmChainIdToCoinType(optimism.id),
    },
  ],
  [
    "51050ec063d393217b436747617ad1c2285aeeee.80002105.reverse",
    {
      address: "0x51050ec063d393217b436747617ad1c2285aeeee",
      coinType: evmChainIdToCoinType(base.id),
    },
  ],
  [
    "51050ec063d393217b436747617ad1c2285aeeee.8000a4b1.reverse",
    {
      address: "0x51050ec063d393217b436747617ad1c2285aeeee",
      coinType: evmChainIdToCoinType(arbitrum.id),
    },
  ],
  [
    "51050ec063d393217b436747617ad1c2285aeeee.8000e708.reverse",
    {
      address: "0x51050ec063d393217b436747617ad1c2285aeeee",
      coinType: evmChainIdToCoinType(linea.id),
    },
  ],
  [
    "51050ec063d393217b436747617ad1c2285aeeee.80082750.reverse",
    {
      address: "0x51050ec063d393217b436747617ad1c2285aeeee",
      coinType: evmChainIdToCoinType(scroll.id),
    },
  ],
  [
    "51050ec063d393217b436747617ad1c2285aeeee.8000e705.reverse",
    {
      address: "0x51050ec063d393217b436747617ad1c2285aeeee",
      coinType: evmChainIdToCoinType(lineaSepolia.id),
    },
  ],
  [
    "51050ec063d393217b436747617ad1c2285aeeee.80014a34.reverse",
    {
      address: "0x51050ec063d393217b436747617ad1c2285aeeee",
      coinType: evmChainIdToCoinType(baseSepolia.id),
    },
  ],
  [
    "51050ec063d393217b436747617ad1c2285aeeee.8008274f.reverse",
    {
      address: "0x51050ec063d393217b436747617ad1c2285aeeee",
      coinType: evmChainIdToCoinType(scrollSepolia.id),
    },
  ],

  [
    "51050ec063d393217b436747617ad1c2285aeeee.80066eee.reverse",
    {
      address: "0x51050ec063d393217b436747617ad1c2285aeeee",
      coinType: evmChainIdToCoinType(arbitrumSepolia.id),
    },
  ],
  [
    "51050ec063d393217b436747617ad1c2285aeeee.80aa37dc.reverse",
    {
      address: "0x51050ec063d393217b436747617ad1c2285aeeee",
      coinType: evmChainIdToCoinType(optimismSepolia.id),
    },
  ],
];

const negativeCases: string[] = [
  "nope",
  "example.eth",
  "definitely.not.eth",
  "X51050ec063d393217b436747617ad1c2285aeeee.80082750.reverse",
  "1234.80082750.reverse",
];

describe("parseReverseName", () => {
  positiveCases.forEach(([input, expected]) => {
    it(`parses "${input}"`, () => {
      expect(parseReverseName(input)).toEqual(expected);
    });
  });

  negativeCases.forEach((input) => {
    it(`does not parse "${input}"`, () => {
      expect(parseReverseName(input)).toBeNull();
    });
  });

  it("parses constructed names", () => {
    CHAIN_IDS.forEach((chainId) => {
      const coinType = evmChainIdToCoinType(chainId);
      expect(parseReverseName(reverseName(EXAMPLE_ADDRESS, coinType))).toEqual({
        address: EXAMPLE_ADDRESS,
        coinType,
      });
    });
  });
});
