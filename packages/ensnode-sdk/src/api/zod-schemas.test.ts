import { describe, expect, it } from "vitest";

import type { InterpretedName } from "../ens";
import { makeRegistrarActionsResponseSchema } from "../internal";
import { registrarActionsPrerequisites } from "./registrar-actions";
import type {
  SerializedNamedRegistrarAction,
  SerializedRegistrarActionsResponseError,
  SerializedRegistrarActionsResponseOk,
} from "./serialized-types";
import { RegistrarActionsResponseCodes, type RegistrarActionsResponseError } from "./types";

describe("ENSNode API Schema", () => {
  describe("Registrar Actions API", () => {
    const validNamedRegistrarActionNormalizedWithReferral = {
      action: {
        id: "176209761600000000111551110000000009545322000000000000006750000000000000067",
        type: "registration",
        incrementalDuration: 2419200,
        registrant: "0x877dd7fa7a6813361de23552c12d25af4a89cda7",
        registrationLifecycle: {
          subregistry: {
            subregistryId: "eip155:11155111:0x57f1887a8bf19b14fc0df6fd9b2acc9af147ea85",
            node: "0x93cdeb708b7545dc668eb9280176169d1c33cfd8ed6f04690a0bcc88a93fc4ae",
          },
          node: "0x5bcdea30f2d591f5357045b89d3470d4ba4da00fd344a32fe323ab6fa2c0f343",
          expiresAt: 1764516816,
        },
        pricing: {
          baseCost: {
            currency: "ETH",
            amount: "7671232876711824",
          },
          premium: {
            currency: "ETH",
            amount: "0",
          },
          total: {
            currency: "ETH",
            amount: "7671232876711824",
          },
        },
        referral: {
          encodedReferrer: "0x0000000000000000000000007bddd635be34bcf860d5f02ae53b16fcd17e8f6f",
          decodedReferrer: "0x7bddd635be34bcf860d5f02ae53b16fcd17e8f6f",
        },
        block: {
          number: 9545322,
          timestamp: 1762097616,
        },
        transactionHash: "0x8b3316e97a92ea0f676943a206ef1722b90b279c0a769456a89b2afe37f205fa",
        eventIds: [
          "176209761600000000111551110000000009545322000000000000006750000000000000067",
          "176209761600000000111551110000000009545322000000000000006750000000000000071",
        ],
      },
      name: "nh35.eth" as InterpretedName,
    } satisfies SerializedNamedRegistrarAction;

    const validNamedRegistrarActionEncodedLabelHash = {
      action: {
        id: "176234701200000000111551110000000009566045000000000000014150000000000000198",
        type: "registration",
        incrementalDuration: 31536000,
        registrant: "0x5505957ff5927f29eacabbbe8a304968bf2dc064",
        registrationLifecycle: {
          subregistry: {
            subregistryId: "eip155:11155111:0x57f1887a8bf19b14fc0df6fd9b2acc9af147ea85",
            node: "0x93cdeb708b7545dc668eb9280176169d1c33cfd8ed6f04690a0bcc88a93fc4ae",
          },
          node: "0xf1c0e6aa95596e0199f3a6341cdbe055b64ba6041662465e577ed80c4dfac2af",
          expiresAt: 1793883012,
        },
        pricing: {
          baseCost: null,
          premium: null,
          total: null,
        },
        referral: {
          encodedReferrer: null,
          decodedReferrer: null,
        },
        block: {
          number: 9566045,
          timestamp: 1762347012,
        },
        transactionHash: "0xa71cf08102ae1f634b22349dac8dc158fe96ae74008b5e24cfcda8587e056d53",
        eventIds: ["176234701200000000111551110000000009566045000000000000014150000000000000198"],
      },
      name: "[e4310bf4547cb18b16b5348881d24a66d61fa94a013e5636b730b86ee64a3923].eth" as InterpretedName,
    } satisfies SerializedNamedRegistrarAction;

    const validResponseOk = {
      responseCode: RegistrarActionsResponseCodes.Ok,
      registrarActions: [
        validNamedRegistrarActionEncodedLabelHash,
        validNamedRegistrarActionNormalizedWithReferral,
      ],
    } satisfies SerializedRegistrarActionsResponseOk;

    const validResponseError = {
      responseCode: RegistrarActionsResponseCodes.Error,
      error: {
        message: "Registrar Actions API is not available",
        details: `The cached omnichain indexing status of the Connected ENSIndexer must be one of the following ${registrarActionsPrerequisites.supportedIndexingStatusIds.map((statusId) => `"${statusId}"`).join(", ")}.`,
      },
    } satisfies SerializedRegistrarActionsResponseError;

    it("can parse valid ResponseOk object", () => {
      expect(() => makeRegistrarActionsResponseSchema().parse(validResponseOk)).not.toThrowError();
    });

    it("can parse valid ResponseError object", () => {
      const parsed = makeRegistrarActionsResponseSchema().parse(validResponseError);

      expect(parsed).toStrictEqual({
        responseCode: RegistrarActionsResponseCodes.Error,
        error: validResponseError.error,
      } satisfies RegistrarActionsResponseError);
    });
  });
});
