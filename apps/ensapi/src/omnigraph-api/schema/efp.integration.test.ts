import { describe, expect, it } from "vitest";

import {
  accounts,
  efpFollowActorAddress,
  efpSeedActorAddress,
  efpSeedRoleUser,
  efpSeedTargets,
} from "@ensnode/integration-test-env/devnet";

import {
  flattenConnection,
  type GraphQLConnection,
  request,
} from "@/test/integration/graphql-utils";
import { gql } from "@/test/integration/omnigraph-api-client";

/**
 * EFP integration assertions against the devnet stack: the `efp` plugin indexing the EFP contracts
 * deployed onto the ens-test-env chain (id 31337), seeded by the EFP devnet image's `demoGraph`
 * scenario (alice / bob / carol each mint a primary list and follow the other two).
 *
 * The EFP devnet's named accounts are derived from the same Anvil mnemonic as the ENS devnet, so
 * EFP "alice" / "bob" / "carol" (indices 1-3) are the ENS devnet's `owner` / `user` / `user2`.
 * `Account` is address-keyed, so `account(by:)` and `EfpListRecord.account` resolve for any address
 * regardless of whether it has any indexed ENS presence.
 *
 * This file also acts as the silent-failure guard for the wiring: if the hardcoded EFP devnet
 * addresses in `@ensnode/datasources` are wrong, the indexer comes up healthy but indexes no EFP
 * data and these assertions fail loudly rather than passing vacuously.
 */
const alice = accounts.owner.address; // Anvil idx 1 == EFP "alice"
const bob = accounts.user.address; // Anvil idx 2 == EFP "bob"
const carol = accounts.user2.address; // Anvil idx 3 == EFP "carol"
const deployer = accounts.deployer.address; // Anvil idx 0; mints no list in demoGraph

const eq = (a: string, b: string) => a.toLowerCase() === b.toLowerCase();

describe("Account.efp.primaryList (demoGraph)", () => {
  type PrimaryListResult = {
    account: {
      efp: {
        primaryList: {
          tokenId: string;
          user: string | null;
          records: GraphQLConnection<{ recordData: string }>;
        } | null;
      } | null;
    } | null;
  };

  const EfpPrimaryList = gql`
    query EfpPrimaryList($address: Address!) {
      account(by: { address: $address }) {
        efp {
          primaryList {
            tokenId
            user
            records {
              edges { node { recordData } }
            }
          }
        }
      }
    }
  `;

  it("resolves alice's validated primary list, following bob and carol", async () => {
    const result = await request<PrimaryListResult>(EfpPrimaryList, { address: alice });

    const list = result.account?.efp?.primaryList;
    expect(list, "alice should have an indexed, validated primary list").not.toBeNull();
    // Two-step Primary List validation: the named list's `user` role must match the queried account.
    expect(list?.user && eq(list.user, alice)).toBe(true);
    expect(list?.tokenId).toMatch(/^\d+$/);

    // demoGraph has alice follow the other two peers.
    const followed = flattenConnection(list!.records).map((r) => r.recordData);
    expect(followed.some((a) => eq(a, bob))).toBe(true);
    expect(followed.some((a) => eq(a, carol))).toBe(true);
  });

  it("returns null for an account with no primary-list metadata", async () => {
    // The deployer opens minting but never mints a list, so it has no primary-list metadata.
    const result = await request<PrimaryListResult>(EfpPrimaryList, { address: deployer });
    expect(result.account?.efp?.primaryList).toBeNull();
  });
});

describe("Account.efp (demoGraph)", () => {
  type AccountEfpResult = {
    account: {
      efp: {
        primaryList: { tokenId: string } | null;
        lists: GraphQLConnection<{ tokenId: string; user: string | null }>;
      };
    } | null;
  };

  const AccountEfp = gql`
    query AccountEfp($address: Address!) {
      account(by: { address: $address }) {
        efp {
          primaryList { tokenId }
          lists { edges { node { tokenId user } } }
        }
      }
    }
  `;

  it("exposes an account's validated primary list and the lists it is the user of", async () => {
    // `account(by: address)` is address-keyed, so it resolves for any address.
    const result = await request<AccountEfpResult>(AccountEfp, { address: alice });
    expect(result.account, "account(by:) should resolve for any address").not.toBeNull();

    expect(result.account?.efp.primaryList?.tokenId).toMatch(/^\d+$/);

    const lists = flattenConnection(result.account!.efp.lists);
    expect(lists.length, "alice should be the user of at least one list").toBeGreaterThanOrEqual(1);
    expect(lists.every((l) => l.user && eq(l.user, alice))).toBe(true);
  });
});

describe("Account.efp deep walk (demoGraph)", () => {
  type DeepWalkResult = {
    account: {
      efp: {
        primaryList: {
          tokenId: string;
          records: GraphQLConnection<{
            recordData: string;
            account: { id: string; efp: { primaryList: { tokenId: string } | null } };
          }>;
        } | null;
      };
    } | null;
  };

  const EfpDeepWalk = gql`
    query EfpDeepWalk($address: Address!) {
      account(by: { address: $address }) {
        efp {
          primaryList {
            tokenId
            records {
              edges {
                node {
                  recordData
                  account { id efp { primaryList { tokenId } } }
                }
              }
            }
          }
        }
      }
    }
  `;

  it("walks account -> primaryList.records -> node.account.efp.primaryList", async () => {
    // alice follows bob and carol; all three are indexed accounts.
    const result = await request<DeepWalkResult>(EfpDeepWalk, { address: alice });
    const primaryList = result.account?.efp.primaryList;
    expect(primaryList?.tokenId).toMatch(/^\d+$/);

    const records = flattenConnection(primaryList!.records);
    // A record's `account` always resolves — an Account exists for any address — so every followed
    // peer links to an Account regardless of whether it has any indexed ENS presence.
    expect(records.every((r) => r.account !== null)).toBe(true);

    // The deep walk resolves end to end: alice's list follows bob, and bob's own validated primary
    // list is reachable through the followed record's account (its token id cross-checked by the
    // two-step validation, not against a fixture-order-dependent magic constant).
    const toBob = records.find((r) => eq(r.recordData, bob));
    expect(toBob?.account && eq(toBob.account.id, bob)).toBe(true);
    expect(toBob?.account?.efp.primaryList?.tokenId).toMatch(/^\d+$/);
  });
});

describe("Account.efp.following (validated)", () => {
  type FollowingResult = {
    account: { efp: { following: GraphQLConnection<{ id: string }> } | null } | null;
  };

  const Following = gql`
    query Following($address: Address!) {
      account(by: { address: $address }) {
        efp {
          following {
            edges { node { id } }
          }
        }
      }
    }
  `;

  const followingOf = async (address: string) =>
    flattenConnection(
      (await request<FollowingResult>(Following, { address })).account!.efp!.following,
    ).map((node) => node.id);

  it("returns the accounts alice follows (bob and carol) from her validated primary list", async () => {
    const followed = await followingOf(alice);
    expect(followed.some((a) => eq(a, bob))).toBe(true);
    expect(followed.some((a) => eq(a, carol))).toBe(true);
    // alice follows exactly her two peers, and never herself.
    expect(followed.some((a) => eq(a, alice))).toBe(false);
    expect(followed).toHaveLength(2);
  });

  it("excludes `block`-tagged follows", async () => {
    const followed = await followingOf(efpFollowActorAddress);
    expect(followed.some((a) => eq(a, efpSeedTargets.followPlain))).toBe(true);
    expect(followed.some((a) => eq(a, efpSeedTargets.followBlocked))).toBe(false);
    expect(followed).toHaveLength(1);
  });

  it("is empty for an account with no validated primary list", async () => {
    // The seed actor's primary-list metadata points at a list whose `user` is not itself.
    const followed = await followingOf(efpSeedActorAddress);
    expect(followed).toHaveLength(0);
  });
});

describe("Account.efp.followers (validated)", () => {
  type FollowersResult = {
    account: { efp: { followers: GraphQLConnection<{ id: string }> } | null } | null;
  };

  const Followers = gql`
    query Followers($address: Address!) {
      account(by: { address: $address }) {
        efp {
          followers {
            edges { node { id } }
          }
        }
      }
    }
  `;

  const followersOf = async (address: string) =>
    flattenConnection(
      (await request<FollowersResult>(Followers, { address })).account!.efp!.followers,
    ).map((node) => node.id);

  it("returns the accounts that follow alice (bob and carol)", async () => {
    const followers = await followersOf(alice);
    expect(followers.some((a) => eq(a, bob))).toBe(true);
    expect(followers.some((a) => eq(a, carol))).toBe(true);
    expect(followers).toHaveLength(2);
  });

  it("includes a follower via its validated primary list", async () => {
    const followers = await followersOf(efpSeedTargets.followPlain);
    expect(followers.some((a) => eq(a, efpFollowActorAddress))).toBe(true);
  });

  it("excludes a follower whose follow is `block`-tagged", async () => {
    const followers = await followersOf(efpSeedTargets.followBlocked);
    expect(followers.some((a) => eq(a, efpFollowActorAddress))).toBe(false);
    expect(followers).toHaveLength(0);
  });

  it("excludes a record held only by a list that is not its user's validated primary list", async () => {
    // `cascade` is held only by the seed actor's list, whose `user` was cleared, so the follow does
    // not live in any validated primary list — there are no validated followers.
    const followers = await followersOf(efpSeedTargets.cascade);
    expect(followers).toHaveLength(0);
  });
});

describe("EFP handler edge cases (seeded)", () => {
  type SeededRecordsResult = {
    efp: {
      listRecords: GraphQLConnection<{
        recordData: string;
        tags: string[];
        account: { id: string };
        list: { user: string | null } | null;
      }>;
    };
  };

  const EfpSeededRecords = gql`
    query EfpSeededRecords($target: Address!) {
      efp {
        listRecords(where: { recordData: $target }) {
          edges { node { recordData tags account { id } list { user } } }
        }
      }
    }
  `;

  const recordsFor = async (target: string) =>
    flattenConnection(
      (await request<SeededRecordsResult>(EfpSeededRecords, { target })).efp.listRecords,
    );

  it("de-duplicates a repeated ADD_TAG and clears the user role on a malformed value", async () => {
    const records = await recordsFor(efpSeedTargets.dedup);
    expect(records).toHaveLength(1);
    // The tag was added twice; the embedded-tags set must hold it once.
    expect(records[0].tags).toEqual(["block"]);
    // `account` always resolves (an Account exists for any address), even for this synthetic target
    // with no indexed ENS presence; it resolves to the record's `recordData` address.
    expect(eq(records[0].account.id, efpSeedTargets.dedup)).toBe(true);
    // The owning list's `user` was set to a malformed (non-20-byte) value, clearing it to null.
    expect(records[0].list?.user).toBeNull();
  });

  it("cascades tags on REMOVE_RECORD and starts fresh on re-ADD", async () => {
    const records = await recordsFor(efpSeedTargets.cascade);
    // Re-added after a REMOVE that dropped the record and its tags.
    expect(records).toHaveLength(1);
    expect(records[0].tags).toEqual([]);
  });

  it("deletes a record via a junk-suffixed REMOVE_RECORD (canonical 22-byte keying)", async () => {
    const records = await recordsFor(efpSeedTargets.junk);
    expect(records).toHaveLength(0);
  });

  it("rejects a primary list when metadata is present but the list's user does not match", async () => {
    // The seed actor has `primary-list` metadata (set by easyMintTo), but the referenced list's
    // `user` is never the actor, so the two-step validation must reject it (return null) rather than
    // resolve the list. This exercises the mismatch branch distinctly from the unset-metadata case.
    type MetaResult = { account: { efp: { metadata: { value: string } | null } | null } | null };
    type PrimaryListResult = {
      account: { efp: { primaryList: { tokenId: string } | null } | null } | null;
    };

    const meta = await request<MetaResult>(
      gql`
        query EfpActorMetadata($address: Address!) {
          account(by: { address: $address }) {
            efp { metadata(key: "primary-list") { value } }
          }
        }
      `,
      { address: efpSeedActorAddress },
    );
    expect(
      meta.account?.efp?.metadata,
      "the seed actor should have primary-list metadata",
    ).not.toBeNull();

    const result = await request<PrimaryListResult>(
      gql`
        query EfpActorPrimaryList($address: Address!) {
          account(by: { address: $address }) {
            efp { primaryList { tokenId } }
          }
        }
      `,
      { address: efpSeedActorAddress },
    );
    expect(result.account?.efp?.primaryList, "validation must reject a user mismatch").toBeNull();
  });

  it("recovers a list's user role after a storage-location re-point (durable metadata)", async () => {
    const records = await recordsFor(efpSeedTargets.durable);
    expect(records).toHaveLength(1);
    // The list moved away from its slot (clearing the role) and back; the role must be re-derived
    // from the durable per-slot metadata rather than staying null.
    expect(records[0].list?.user && eq(records[0].list.user, efpSeedRoleUser)).toBe(true);
  });
});

describe("efp.lists pagination (seeded > 9 lists)", () => {
  type ListsResult = {
    efp: {
      lists: {
        edges: { node: { tokenId: string } }[];
        pageInfo: { endCursor: string | null; hasNextPage: boolean };
      };
    };
  };

  const EfpLists = gql`
    query EfpLists($first: Int!, $after: String) {
      efp {
        lists(first: $first, after: $after) {
          edges { node { tokenId } }
          pageInfo { endCursor hasNextPage }
        }
      }
    }
  `;

  it("orders lists numerically by tokenId across cursor pages (not lexicographically)", async () => {
    // Page in small pages so both the ORDER BY and the cursor `where` are exercised. The seeder
    // mints > 9 lists, so a double-digit tokenId exists — the case where lexicographic ("10" < "2")
    // and numeric ordering diverge.
    const collected: number[] = [];
    let after: string | null = null;
    for (let page = 0; page < 20; page++) {
      const result: ListsResult = await request<ListsResult>(EfpLists, { first: 4, after });
      collected.push(...result.efp.lists.edges.map((e) => Number(e.node.tokenId)));
      if (!result.efp.lists.pageInfo.hasNextPage) break;
      after = result.efp.lists.pageInfo.endCursor;
    }

    expect(Math.max(...collected)).toBeGreaterThanOrEqual(10);
    // Numerically ascending, with no rows skipped or repeated across page boundaries.
    expect(collected).toEqual([...new Set(collected)].sort((a, b) => a - b));
  });
});
