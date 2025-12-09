import { zeroAddress } from "viem";
import { describe, expect, it } from "vitest";

import { ENSNamespaceIds } from "@ensnode/datasources";

import type { InterpretedName } from "../ens";
import type { AccountId } from "../shared";
import {
  getNameTokenOwnership,
  type NameTokenOwnershipBurned,
  type NameTokenOwnershipFullyOnchain,
  type NameTokenOwnershipNameWrapper,
  NameTokenOwnershipTypes,
  type NameTokenOwnershipUnknown,
} from "./name-token";

describe("Name Token", () => {
  describe("getNameTokenOwnership", () => {
    const accounts = {
      NameWrapperMainnet: {
        chainId: 1,
        address: "0xd4416b13d2b3a9abae7acd5d6c2bbdbe25686401",
      } satisfies AccountId,
      NameWrapperLinea: {
        chainId: 59144,
        address: "0xa53cca02f98d590819141aa85c891e2af713c223",
      } satisfies AccountId,
      Zero: {
        chainId: 1,
        address: zeroAddress,
      } satisfies AccountId,
      AnyMainnet: {
        chainId: 1,
        address: "0x220866b1a2219f40e72f5c628b65d54268ca3a9d",
      } satisfies AccountId,
      AnyLinea: {
        chainId: 59144,
        address: "0x220866b1a2219f40e72f5c628b65d54268ca3a9d",
      },
    } as const;

    const names = {
      TestEth: "test.eth" as InterpretedName,
      TestBaseEth: "test.base.eth" as InterpretedName,
      TestLineaEth: "test.linea.eth" as InterpretedName,
    } as const;

    it("returns 'NameWrapper' ownership type when NameWrapper account owns the name token", () => {
      expect(
        getNameTokenOwnership(ENSNamespaceIds.Mainnet, names.TestEth, accounts.NameWrapperMainnet),
      ).toMatchObject({
        ownershipType: NameTokenOwnershipTypes.NameWrapper,
        owner: accounts.NameWrapperMainnet,
      } satisfies NameTokenOwnershipNameWrapper);

      expect(
        getNameTokenOwnership(
          ENSNamespaceIds.Mainnet,
          names.TestLineaEth,
          accounts.NameWrapperLinea,
        ),
      ).toMatchObject({
        ownershipType: NameTokenOwnershipTypes.NameWrapper,
        owner: accounts.NameWrapperLinea,
      } satisfies NameTokenOwnershipNameWrapper);
    });

    it("returns 'Burned' ownership type when Zero account owns the name token", () => {
      expect(
        getNameTokenOwnership(ENSNamespaceIds.Mainnet, names.TestEth, accounts.Zero),
      ).toMatchObject({
        ownershipType: NameTokenOwnershipTypes.Burned,
        owner: accounts.Zero,
      } satisfies NameTokenOwnershipBurned);
    });

    it("returns 'FullyOwned' ownership type when Any other account owns the name token for a direct subnname of .eth", () => {
      expect(
        getNameTokenOwnership(ENSNamespaceIds.Mainnet, names.TestEth, accounts.AnyMainnet),
      ).toMatchObject({
        ownershipType: NameTokenOwnershipTypes.FullyOnchain,
        owner: accounts.AnyMainnet,
      } satisfies NameTokenOwnershipFullyOnchain);
    });

    it("returns 'Unknown' ownership type when Any other account owns the name token for a name other than direct subnname of .eth", () => {
      expect(
        getNameTokenOwnership(ENSNamespaceIds.Mainnet, names.TestBaseEth, accounts.AnyMainnet),
      ).toMatchObject({
        ownershipType: NameTokenOwnershipTypes.Unknown,
        owner: accounts.AnyMainnet,
      } satisfies NameTokenOwnershipUnknown);

      expect(
        getNameTokenOwnership(ENSNamespaceIds.Mainnet, names.TestLineaEth, accounts.AnyLinea),
      ).toMatchObject({
        ownershipType: NameTokenOwnershipTypes.Unknown,
        owner: accounts.AnyLinea,
      } satisfies NameTokenOwnershipUnknown);
    });
  });
});
