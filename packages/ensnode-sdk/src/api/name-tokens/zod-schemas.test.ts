import { describe, expect, it } from "vitest";

import type { InterpretedName } from "../../ens";
import { AssetNamespaces, NameTokenOwnershipTypes, NFTMintStatuses } from "../../tokenscope";
import { NameTokensResponseCodes, type NameTokensResponseOk } from "./response";
import type { SerializedNameTokensResponseOk } from "./serialized-response";
import { makeNameTokensResponseSchema } from "./zod-schemas";

const responseOk = {
  responseCode: NameTokensResponseCodes.Ok,
  registeredNameTokens: {
    domainId: "0xe02070fb6710555cd44b79b55959e9a89f47b4029d44bde5a4f7b5fe13fe4688",
    name: "texasprivacy.eth" as InterpretedName,
    tokens: [
      {
        token: {
          assetNamespace: AssetNamespaces.ERC721,
          contract: {
            chainId: 1,
            address: "0x57f1887a8bf19b14fc0df6fd9b2acc9af147ea85",
          },
          tokenId: "0x1b91e32525972cbaf6b7a634637c74e90891a5f85c1a3fc313357ae3eedb5976",
        },
        ownership: {
          ownershipType: NameTokenOwnershipTypes.NameWrapper,
          owner: {
            chainId: 1,
            address: "0xd4416b13d2b3a9abae7acd5d6c2bbdbe25686401",
          },
        },
        mintStatus: NFTMintStatuses.Minted,
      },
      {
        token: {
          assetNamespace: AssetNamespaces.ERC1155,
          contract: {
            chainId: 1,
            address: "0xd4416b13d2b3a9abae7acd5d6c2bbdbe25686401",
          },
          tokenId: "0xe02070fb6710555cd44b79b55959e9a89f47b4029d44bde5a4f7b5fe13fe4688",
        },
        ownership: {
          ownershipType: NameTokenOwnershipTypes.FullyOnchain,
          owner: {
            chainId: 1,
            address: "0x27c9b34eb43523447d3e1bcf26f009d814522687",
          },
        },
        mintStatus: NFTMintStatuses.Minted,
      },
    ],
    expiresAt: 1796524355,
    accurateAsOf: 1765283111,
  },
} satisfies SerializedNameTokensResponseOk;

describe("Name Tokens: Zod Schemas", () => {
  it("can parse response OK correctly", () => {
    const schema = makeNameTokensResponseSchema();
    const parsed = schema.safeParse(responseOk);

    expect(parsed.data).toMatchObject({
      registeredNameTokens: {
        accurateAsOf: 1765283111,
        domainId: "0xe02070fb6710555cd44b79b55959e9a89f47b4029d44bde5a4f7b5fe13fe4688",
        expiresAt: 1796524355,
        name: "texasprivacy.eth" as InterpretedName,
        tokens: [
          {
            token: {
              assetNamespace: AssetNamespaces.ERC721,
              contract: {
                address: "0x57f1887a8bf19b14fc0df6fd9b2acc9af147ea85",
                chainId: 1,
              },
              tokenId:
                12470207434038550824062604719548556970036655675295206305793558098635514403190n,
            },
            mintStatus: NFTMintStatuses.Minted,
            ownership: {
              owner: {
                address: "0xd4416b13d2b3a9abae7acd5d6c2bbdbe25686401",
                chainId: 1,
              },
              ownershipType: NameTokenOwnershipTypes.NameWrapper,
            },
          },
          {
            token: {
              assetNamespace: AssetNamespaces.ERC1155,
              contract: {
                address: "0xd4416b13d2b3a9abae7acd5d6c2bbdbe25686401",
                chainId: 1,
              },
              tokenId:
                101375396962115918524649309264486806180699510120467337525325914814336775112328n,
            },
            mintStatus: NFTMintStatuses.Minted,
            ownership: {
              owner: {
                address: "0x27c9b34eb43523447d3e1bcf26f009d814522687",
                chainId: 1,
              },
              ownershipType: NameTokenOwnershipTypes.FullyOnchain,
            },
          },
        ],
      },
      responseCode: "ok",
    } satisfies NameTokensResponseOk);
  });
});
