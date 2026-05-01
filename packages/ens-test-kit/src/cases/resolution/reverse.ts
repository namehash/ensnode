import { accounts } from "@ensnode/datasources/devnet";

import type { ResolutionsApi } from "../../interfaces/resolutions";
import { reverseName } from "../../seeder";
import type { TestCase } from "../types";

const ownerReverseFixture = reverseName({
  id: "resolution-reverse-owner-test-eth",
  address: accounts.owner.address,
  chainId: 1,
  name: "test.eth",
});

export const reverseResolutionCases: TestCase<ResolutionsApi>[] = [
  {
    id: "resolution.reverse.single-owner-chain-1",
    description: "resolves owner primary name on chain 1",
    fixtures: [ownerReverseFixture],
    call: (api) => api.resolvePrimaryName(accounts.owner.address, 1),
    expected: ownerReverseFixture.name,
  },
  {
    id: "resolution.reverse.single-user-null",
    description: "returns null for user without a primary name",
    fixtures: [],
    call: (api) => api.resolvePrimaryName(accounts.user.address, 1),
    expected: null,
  },
  {
    id: "resolution.reverse.multi-owner-chain-1",
    description: "resolves owner primary names map for explicit chain set",
    fixtures: [ownerReverseFixture],
    call: (api) => api.resolvePrimaryNames(accounts.owner.address, [1]),
    expected: { 1: ownerReverseFixture.name },
  },
  {
    id: "resolution.reverse.multi-owner-all",
    description: "resolves owner primary names map for default chain selection",
    fixtures: [ownerReverseFixture],
    call: (api) => api.resolvePrimaryNames(accounts.owner.address),
    expected: { 1: ownerReverseFixture.name },
  },
];
