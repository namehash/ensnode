import { ENCODED_REFERRER_BYTE_LENGTH } from "@namehash/ens-referrals";
import { type Address, namehash, pad, parseEther, zeroAddress } from "viem";
import { describe, expect, it } from "vitest";

import { CurrencyIds } from "../shared";
import { deserializeRegistrarAction } from "./deserialize";
import { serializeRegistrarAction } from "./serialize";
import type { SerializedRegistrarAction } from "./serialized-types";
import { type RegistrarAction, RegistrarActionTypes, RegistrarEventNames } from "./types";

const vb2Address: Address = "0x1db3439a222c519ab44bb1144fc28167b4fa6ee6";
const vb3Address: Address = "0x220866b1a2219f40e72f5c628b65d54268ca3a9d";

describe("Registrar Actions", () => {
  it("can serialize and deserialize registrar action object", () => {
    const serialized = {
      id: "0123",

      type: RegistrarActionTypes.Registration,
      node: namehash("vitalik.eth"),

      baseCost: {
        currency: CurrencyIds.ETH,
        amount: parseEther("1").toString(),
      },
      premium: {
        currency: CurrencyIds.ETH,
        amount: parseEther("0.7").toString(),
      },
      total: {
        currency: CurrencyIds.ETH,
        amount: parseEther("1.7").toString(),
      },

      incrementalDuration: 123,

      registrant: vb3Address,
      encodedReferrer: pad(vb2Address, { size: ENCODED_REFERRER_BYTE_LENGTH, dir: "left" }),
      decodedReferrer: vb2Address,

      event: {
        id: "0123",
        name: RegistrarEventNames.NameRegistered,
        chainId: 1,
        block: {
          number: 123,
          timestamp: 1761062418,
        },
        contractAddress: zeroAddress,
        transactionHash: "0x5371489034e7858bfa320cf3887700f997198810a8b8a880fdae98bb4d5ef66f",
        logIndex: 1,
      },
    } satisfies SerializedRegistrarAction;

    const deserialized = deserializeRegistrarAction(serialized);

    expect(deserialized).toStrictEqual({
      id: "0123",

      type: RegistrarActionTypes.Registration,

      node: namehash("vitalik.eth"),

      baseCost: {
        currency: CurrencyIds.ETH,
        amount: parseEther("1"),
      },
      premium: {
        currency: CurrencyIds.ETH,
        amount: parseEther("0.7"),
      },
      total: {
        currency: CurrencyIds.ETH,
        amount: parseEther("1.7"),
      },

      incrementalDuration: 123,

      registrant: vb3Address,
      encodedReferrer: pad(vb2Address, { size: ENCODED_REFERRER_BYTE_LENGTH, dir: "left" }),
      decodedReferrer: vb2Address,

      event: {
        id: "0123",
        name: RegistrarEventNames.NameRegistered,
        chainId: 1,
        block: {
          number: 123,
          timestamp: 1761062418,
        },
        contractAddress: zeroAddress,
        transactionHash: "0x5371489034e7858bfa320cf3887700f997198810a8b8a880fdae98bb4d5ef66f",
        logIndex: 1,
      },
    } satisfies RegistrarAction);

    expect(serializeRegistrarAction(deserialized)).toStrictEqual(serialized);
  });
});
