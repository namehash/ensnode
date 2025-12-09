import { describe, expect, it } from "vitest";

import { type AssetId, type AssetIdString, serializeAssetId } from "./assets";
import { makeAssetIdSchema, makeAssetIdStringSchema } from "./zod-schemas";

describe("Tokenscope: Zod Schemas", () => {
  describe("Asset ID", () => {
    const assetId = {
      assetNamespace: "erc721",
      contract: {
        chainId: 1,
        address: "0x57f1887a8bf19b14fc0df6fd9b2acc9af147ea85",
      },
      tokenId: 16040677088507226445292069442137614433350542485565556846821097371413205796612n,
    } satisfies AssetId;

    describe("makeAssetIdStringSchema", () => {
      const assetIdString: AssetIdString =
        "eip155:1/erc721:0x57f1887a8bf19b14fc0df6fd9b2acc9af147ea85/0x2376b3952dc704bc0cbebbdab63e4b510d63a1234f5910f12362f5b34bdcc704";

      it("can parse string representation of Asset ID", () => {
        const schema = makeAssetIdStringSchema();
        const parsed = schema.safeParse(assetIdString);

        expect(parsed).toMatchObject({
          success: true,
          data: assetId,
        });
      });
    });

    describe("makeAssetIdSchema", () => {
      it("can parse serialized representation of Asset ID", () => {
        const serializedAssetId = serializeAssetId(assetId);
        const schema = makeAssetIdSchema();
        const parsed = schema.safeParse(serializedAssetId);

        expect(parsed).toMatchObject({
          success: true,
          data: assetId,
        });
      });

      it("can validate Asset ID", () => {
        const schema = makeAssetIdSchema();
        const parsed = schema.safeParse(assetId);

        expect(parsed).toMatchObject({
          success: true,
          data: assetId,
        });
      });
    });
  });
});
