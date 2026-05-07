import type { InterpretedName } from "enssdk";

import type { SerializedRegistrarActionsResponseOk } from "./serialized-response";

/**
 * Example value for {@link SerializedRegistrarActionsResponseOk}, for use in OpenAPI documentation.
 *
 * - registrationLifecycle.node is namehash("vitalik.eth")
 * - subregistry.node is namehash("eth")
 * - subregistry.subregistryId is the ETH Registrar Controller on Ethereum mainnet
 */
export const registrarActionsResponseOkExample = {
  responseCode: "ok",
  registrarActions: [
    {
      action: {
        type: "registration",
        id: "0x0000000000000000000000000000000000000000000000000000000000000001",
        incrementalDuration: 31536000,
        registrant: "0xd8da6bf26964af9d7eed9e03e53415d37aa96045",
        registrationLifecycle: {
          subregistry: {
            subregistryId: {
              chainId: 1,
              address: "0x253553366da8546fc250f225fe3d25d0c782303b",
            },
            node: "0x93cdeb708b7545dc668eb9280176169d1c33cfd8ed6f04690a0bcc88a93fc4ae",
          },
          node: "0xee6c4522aab0003e8d14cd40a6af439055fd2577951148c14b6cea9a53475835",
          expiresAt: 1893456000,
        },
        pricing: {
          baseCost: { amount: "1000000000000000", currency: "ETH" },
          premium: { amount: "0", currency: "ETH" },
          total: { amount: "1000000000000000", currency: "ETH" },
        },
        referral: { encodedReferrer: null, decodedReferrer: null },
        block: { timestamp: 1700000000, number: 18500000 },
        transactionHash: "0x0000000000000000000000000000000000000000000000000000000000000001",
        eventIds: ["0x0000000000000000000000000000000000000000000000000000000000000001"],
      },
      name: "vitalik.eth" as InterpretedName,
    },
  ],
  pageContext: {
    page: 1,
    recordsPerPage: 25,
    totalRecords: 1,
    totalPages: 1,
    hasNext: false,
    hasPrev: false,
    startIndex: 0,
    endIndex: 0,
  },
  accurateAsOf: 1700000000,
} satisfies SerializedRegistrarActionsResponseOk;
