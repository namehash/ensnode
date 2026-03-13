import type { Address } from "viem";
import { beforeAll, describe, expect, it } from "vitest";

import type { Name } from "@ensnode/ensnode-sdk";

import { gql } from "@/test/integration/ensnode-graphql-api-client";
import {
  AccountDomainsPaginated,
  type PaginatedDomainResult,
} from "@/test/integration/find-domains/domain-pagination-queries";
import { testDomainPagination } from "@/test/integration/find-domains/test-domain-pagination";
import {
  AccountEventsPaginated,
  EventFragment,
  type EventResult,
} from "@/test/integration/find-events/event-pagination-queries";
import { testEventPagination } from "@/test/integration/find-events/test-event-pagination";
import {
  flattenConnection,
  type GraphQLConnection,
  type PaginatedGraphQLConnection,
  request,
} from "@/test/integration/graphql-utils";

// via devnet
const DEVNET_DEPLOYER: Address = "0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266";
const DEFAULT_OWNER: Address = "0x70997970c51812dc3a010c7d01b50e0d17dc79c8";
const NEW_OWNER: Address = "0x90f79bf6eb2c4f870365e785982e1f101e93b906";

describe("Account.domains", () => {
  type AccountDomainsResult = {
    account: { domains: GraphQLConnection<{ name: Name | null }> };
  };

  const AccountDomains = gql`
    query AccountDomains($address: Address!) {
      account(address: $address) {
        domains(order: { by: NAME, dir: ASC }) { edges { node { name } } }
      }
    }
  `;

  it("returns domains owned by the default owner", async () => {
    const result = await request<AccountDomainsResult>(AccountDomains, { address: DEFAULT_OWNER });
    const domains = flattenConnection(result.account.domains);
    const names = domains.map((d) => d.name);

    const expected = [
      "alias.eth",
      "changerole.eth",
      "demo.eth",
      "example.eth",
      "linked.parent.eth",
      "parent.eth",
      "renew.eth",
      "reregister.eth",
      "sub1.sub2.parent.eth",
      "sub2.parent.eth",
      "test.eth",
      "wallet.linked.parent.eth",
    ];

    for (const name of expected) {
      expect(names, `expected '${name}' in default owner's domains`).toContain(name);
    }
  });

  it("returns domains owned by the new owner", async () => {
    const result = await request<AccountDomainsResult>(AccountDomains, { address: NEW_OWNER });
    const domains = flattenConnection(result.account.domains);
    const names = domains.map((d) => d.name);

    expect(names, "expected 'newowner.eth' in new owner's domains").toContain("newowner.eth");
  });
});

describe("Account.domains pagination", () => {
  testDomainPagination(async (variables) => {
    const result = await request<{
      account: { domains: PaginatedGraphQLConnection<PaginatedDomainResult> };
    }>(AccountDomainsPaginated, { address: DEFAULT_OWNER, ...variables });
    return result.account.domains;
  });
});

describe("Account.events", () => {
  type AccountEventsResult = { account: { events: GraphQLConnection<EventResult> } };

  const AccountEvents = gql`
    query AccountEvents($address: Address!) {
      account(address: $address) { events { edges { node { ...EventFragment } } } }
    }
    ${EventFragment}
  `;

  it("returns events for the devnet deployer", async () => {
    const result = await request<AccountEventsResult>(AccountEvents, {
      address: DEVNET_DEPLOYER,
    });
    const events = flattenConnection(result.account.events);

    expect(events.length).toBeGreaterThan(0);

    // all events should have from === deployer address (case-insensitive)
    for (const event of events) {
      expect(event.from.toLowerCase()).toBe(DEVNET_DEPLOYER.toLowerCase());
    }
  });
});

describe("Account.events pagination", () => {
  testEventPagination(async (variables) => {
    const result = await request<{
      account: { events: PaginatedGraphQLConnection<EventResult> };
    }>(AccountEventsPaginated, { address: DEVNET_DEPLOYER, ...variables });
    return result.account.events;
  });
});

describe("Account.events filtering (AccountEventsWhereInput)", () => {
  type AccountEventsResult = { account: { events: GraphQLConnection<EventResult> } };

  const AccountEventsFiltered = gql`
    query AccountEventsFiltered($address: Address!, $where: AccountEventsWhereInput, $first: Int) {
      account(address: $address) { events(where: $where, first: $first) { edges { node { ...EventFragment } } } }
    }
    ${EventFragment}
  `;

  let allEvents: EventResult[];

  beforeAll(async () => {
    const result = await request<AccountEventsResult>(AccountEventsFiltered, {
      address: DEVNET_DEPLOYER,
      first: 1000,
    });
    // events are returned in ascending order, so first/last access yields min/max values
    allEvents = flattenConnection(result.account.events);
    expect(allEvents.length).toBeGreaterThan(0);
  });

  it("filters by selector_in", async () => {
    const targetSelector = allEvents[0].topics[0];

    const result = await request<AccountEventsResult>(AccountEventsFiltered, {
      address: DEVNET_DEPLOYER,
      where: { selector_in: [targetSelector] },
    });
    const events = flattenConnection(result.account.events);

    expect(events.length).toBeGreaterThan(0);
    for (const event of events) {
      expect(event.topics[0]?.toLowerCase()).toBe(targetSelector.toLowerCase());
    }
  });

  it("filters by selector_in with unknown topic returns no results", async () => {
    const result = await request<AccountEventsResult>(AccountEventsFiltered, {
      address: DEVNET_DEPLOYER,
      where: {
        selector_in: ["0x0000000000000000000000000000000000000000000000000000000000000001"],
      },
    });
    const events = flattenConnection(result.account.events);
    expect(events.length).toBe(0);
  });

  it("filters by empty selector_in returns no results", async () => {
    const result = await request<AccountEventsResult>(AccountEventsFiltered, {
      address: DEVNET_DEPLOYER,
      where: { selector_in: [] },
    });
    const events = flattenConnection(result.account.events);
    expect(events.length).toBe(0);
  });

  it("filters by timestamp_gte", async () => {
    const midTimestamp = allEvents[Math.floor(allEvents.length / 2)].timestamp;

    const result = await request<AccountEventsResult>(AccountEventsFiltered, {
      address: DEVNET_DEPLOYER,
      where: { timestamp_gte: midTimestamp },
    });
    const events = flattenConnection(result.account.events);

    expect(events.length).toBeGreaterThan(0);
    expect(events.length).toBeLessThanOrEqual(allEvents.length);
    for (const event of events) {
      expect(BigInt(event.timestamp)).toBeGreaterThanOrEqual(BigInt(midTimestamp));
    }
  });

  it("filters by timestamp_lte", async () => {
    const midTimestamp = allEvents[Math.floor(allEvents.length / 2)].timestamp;

    const result = await request<AccountEventsResult>(AccountEventsFiltered, {
      address: DEVNET_DEPLOYER,
      where: { timestamp_lte: midTimestamp },
    });
    const events = flattenConnection(result.account.events);

    expect(events.length).toBeGreaterThan(0);
    expect(events.length).toBeLessThanOrEqual(allEvents.length);
    for (const event of events) {
      expect(BigInt(event.timestamp)).toBeLessThanOrEqual(BigInt(midTimestamp));
    }
  });

  it("filters by timestamp range", async () => {
    const minTs = allEvents[0].timestamp;
    const maxTs = allEvents[allEvents.length - 1].timestamp;

    const result = await request<AccountEventsResult>(AccountEventsFiltered, {
      address: DEVNET_DEPLOYER,
      where: { timestamp_gte: minTs, timestamp_lte: maxTs },
      first: 1000,
    });
    const events = flattenConnection(result.account.events);
    expect(events.length).toBe(allEvents.length);
  });

  it("combines selector_in and timestamp_gte", async () => {
    // pick a seed event from the second half so its selector is guaranteed to
    // appear at or after midTimestamp, avoiding flaky empty-result failures
    const midIndex = Math.floor(allEvents.length / 2);
    const seedEvent = allEvents[midIndex];
    const targetSelector = seedEvent.topics[0];
    const midTimestamp = seedEvent.timestamp;

    const result = await request<AccountEventsResult>(AccountEventsFiltered, {
      address: DEVNET_DEPLOYER,
      where: { selector_in: [targetSelector], timestamp_gte: midTimestamp },
    });
    const events = flattenConnection(result.account.events);

    expect(events.length).toBeGreaterThan(0);
    expect(events.length).toBeLessThanOrEqual(allEvents.length);
    for (const event of events) {
      expect(event.topics[0]?.toLowerCase()).toBe(targetSelector.toLowerCase());
      expect(BigInt(event.timestamp)).toBeGreaterThanOrEqual(BigInt(midTimestamp));
    }
  });

  it("excludes all events with a future timestamp", async () => {
    const maxTimestamp = BigInt(allEvents[allEvents.length - 1].timestamp);

    const result = await request<AccountEventsResult>(AccountEventsFiltered, {
      address: DEVNET_DEPLOYER,
      where: { timestamp_gte: (maxTimestamp + 1n).toString() },
    });
    const events = flattenConnection(result.account.events);
    expect(events.length).toBe(0);
  });
});
