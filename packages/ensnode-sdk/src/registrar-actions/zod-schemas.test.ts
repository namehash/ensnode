import { type Address, namehash } from "viem";
import { describe, expect, it } from "vitest";
import { prettifyError, type ZodSafeParseResult } from "zod/v4";

import { CurrencyIds } from "../shared";
import type { SerializedRegistrarAction } from "./serialized-types";
import { RegistrarActionTypes } from "./types";
import { makeRegistrarActionSchema } from "./zod-schemas";

const vitalikEthAddress: Address = "0xd8da6bf26964af9d7eed9e03e53415d37aa96045";
const vb2Address: Address = "0x1db3439a222c519ab44bb1144fc28167b4fa6ee6";
const vb3Address: Address = "0x220866b1a2219f40e72f5c628b65d54268ca3a9d";

describe("ENSIndexer: Registrar Actions", () => {
  describe("Zod Schemas", () => {
    const formatParseError = <T>(zodParseError: ZodSafeParseResult<T>) =>
      prettifyError(zodParseError.error!);

    describe("Parsing", () => {
      it("refuses to parse Renewal with premium", () => {
        expect(
          formatParseError(
            makeRegistrarActionSchema().safeParse({
              type: RegistrarActionTypes.Renewal,
              node: namehash("vitalik.eth"),

              baseCost: {
                currency: CurrencyIds.ETH,
                amount: "1",
              },
              premium: {
                currency: CurrencyIds.ETH,
                amount: "1",
              },
              total: {
                currency: CurrencyIds.ETH,
                amount: "2",
              },

              incrementalDuration: 123,

              registrant: vb3Address,
              encodedReferrer: `0x000000000000000000000000${vb2Address.slice(2)}`,
              decodedReferrer: vb2Address,

              timestamp: 1761062418,
              chainId: 1,
              transactionHash: "0x5371489034e7858bfa320cf3887700f997198810a8b8a880fdae98bb4d5ef66f",
              logIndex: 1,
            } satisfies SerializedRegistrarAction),
          ),
        ).toMatch(/Renewal Premium must always be '0'/);
      });

      it("refuses to parse Registrar Action when total is not a sum of baseCost and premium", () => {
        expect(
          formatParseError(
            makeRegistrarActionSchema().safeParse({
              type: RegistrarActionTypes.Registration,
              node: namehash("vitalik.eth"),

              baseCost: {
                currency: CurrencyIds.ETH,
                amount: "3",
              },
              premium: {
                currency: CurrencyIds.ETH,
                amount: "1",
              },
              total: {
                currency: CurrencyIds.ETH,
                amount: "5",
              },

              incrementalDuration: 123,

              registrant: vb3Address,
              encodedReferrer: `0x000000000000000000000000${vb2Address.slice(2)}`,
              decodedReferrer: vb2Address,

              timestamp: 1761062418,
              chainId: 1,
              transactionHash: "0x5371489034e7858bfa320cf3887700f997198810a8b8a880fdae98bb4d5ef66f",
              logIndex: 1,
            } satisfies SerializedRegistrarAction),
          ),
        ).toMatch(/'total' must be equal to the sum of 'baseCost' and 'premium'/);

        expect(
          formatParseError(
            makeRegistrarActionSchema().safeParse({
              type: RegistrarActionTypes.Renewal,
              node: namehash("vitalik.eth"),

              baseCost: {
                currency: CurrencyIds.ETH,
                amount: "3",
              },
              premium: {
                currency: CurrencyIds.ETH,
                amount: "0",
              },
              total: {
                currency: CurrencyIds.ETH,
                amount: "4",
              },

              incrementalDuration: 123,

              registrant: vb3Address,
              encodedReferrer: `0x000000000000000000000000${vb2Address.slice(2)}`,
              decodedReferrer: vb2Address,

              timestamp: 1761062418,
              chainId: 1,
              transactionHash: "0x5371489034e7858bfa320cf3887700f997198810a8b8a880fdae98bb4d5ef66f",
              logIndex: 1,
            } satisfies SerializedRegistrarAction),
          ),
        ).toMatch(/'total' must be equal to the sum of 'baseCost' and 'premium'/);
      });

      it("refuses to parse Registrar Action when decodedReferrer is not based on encodedReferrer", () => {
        const parsed = makeRegistrarActionSchema().safeParse({
          type: RegistrarActionTypes.Registration,
          node: namehash("vitalik.eth"),

          baseCost: {
            currency: CurrencyIds.ETH,
            amount: "3",
          },
          premium: {
            currency: CurrencyIds.ETH,
            amount: "1",
          },
          total: {
            currency: CurrencyIds.ETH,
            amount: "4",
          },

          incrementalDuration: 123,

          registrant: vb3Address,
          encodedReferrer: `0x000000000000000000000000${vb2Address.slice(2)}`,
          decodedReferrer: vitalikEthAddress,

          timestamp: 1761062418,
          chainId: 1,
          transactionHash: "0x5371489034e7858bfa320cf3887700f997198810a8b8a880fdae98bb4d5ef66f",
          logIndex: 1,
        } satisfies SerializedRegistrarAction);

        expect(formatParseError(parsed)).toMatch(
          /'decodedReferrer' must be based on 'encodedReferrer'/,
        );
      });
    });
  });
});
