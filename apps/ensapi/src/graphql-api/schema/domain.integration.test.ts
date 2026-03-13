import { beforeAll, describe, expect, it } from "vitest";

import type { InterpretedLabel, Name } from "@ensnode/ensnode-sdk";

import { DEVNET_ETH_LABELS } from "@/test/integration/devnet-names";
import { gql } from "@/test/integration/ensnode-graphql-api-client";
import {
  DomainSubdomainsPaginated,
  type PaginatedDomainResult,
} from "@/test/integration/find-domains/domain-pagination-queries";
import { testDomainPagination } from "@/test/integration/find-domains/test-domain-pagination";
import {
  DomainEventsPaginated,
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

const NAME_WITH_EVENTS = "newowner.eth";

describe("Domain.subdomains", () => {
  type SubdomainsResult = {
    domain: {
      subdomains: GraphQLConnection<{
        name: Name | null;
        label: { interpreted: InterpretedLabel };
      }>;
    };
  };

  const DomainSubdomains = gql`
    query DomainSubdomains($name: Name!) {
      domain(by: { name: $name }) {
        subdomains { edges { node { name label { interpreted } } } }
      }
    }
  `;

  it("returns at least all known subdomains of .eth", async () => {
    const result = await request<SubdomainsResult>(DomainSubdomains, { name: "eth" });
    const subdomains = flattenConnection(result.domain.subdomains);

    const actual = subdomains.map((d) => d.label.interpreted);
    for (const expected of DEVNET_ETH_LABELS) {
      expect(actual, `expected '${expected}' in .eth subdomains`).toContain(expected);
    }
  });
});

describe("Domain.subdomains pagination", () => {
  testDomainPagination(async (variables) => {
    const result = await request<{
      domain: { subdomains: PaginatedGraphQLConnection<PaginatedDomainResult> };
    }>(DomainSubdomainsPaginated, variables);
    return result.domain.subdomains;
  });
});

describe("Domain.events", () => {
  type DomainEventsResult = {
    domain: { events: GraphQLConnection<EventResult> };
  };

  const DomainEvents = gql`
    query DomainEvents($name: Name!) {
      domain(by: { name: $name }) { events { edges { node { ...EventFragment } } } }
    }
    ${EventFragment}
  `;

  it("returns events for a domain with known activity", async () => {
    const result = await request<DomainEventsResult>(DomainEvents, { name: NAME_WITH_EVENTS });
    const events = flattenConnection(result.domain.events);

    expect(events.length).toBeGreaterThan(0);
  });

  it("returns events for multiple domains", async () => {
    const names = [NAME_WITH_EVENTS, "example.eth", "demo.eth"];

    for (const name of names) {
      const result = await request<DomainEventsResult>(DomainEvents, { name });
      const events = flattenConnection(result.domain.events);
      expect(events.length, `expected events for domain '${name}'`).toBeGreaterThan(0);
    }
  });
});

describe("Domain.events pagination", () => {
  testEventPagination(async (variables) => {
    const result = await request<{
      domain: { events: PaginatedGraphQLConnection<EventResult> };
    }>(DomainEventsPaginated, { name: NAME_WITH_EVENTS, ...variables });
    return result.domain.events;
  });
});

describe("Domain.events filtering (EventsWhereInput)", () => {
  type DomainEventsResult = {
    domain: { events: GraphQLConnection<EventResult> };
  };

  const DomainEventsFiltered = gql`
    query DomainEventsFiltered($name: Name!, $where: EventsWhereInput, $first: Int) {
      domain(by: { name: $name }) { events(where: $where, first: $first) { edges { node { ...EventFragment } } } }
    }
    ${EventFragment}
  `;

  let allEvents: EventResult[];

  beforeAll(async () => {
    const result = await request<DomainEventsResult>(DomainEventsFiltered, {
      name: NAME_WITH_EVENTS,
      first: 1000,
    });
    // events are returned in ascending order, so first/last access yields min/max values
    allEvents = flattenConnection(result.domain.events);
    expect(allEvents.length).toBeGreaterThan(0);
  });

  it("filters by selector_in", async () => {
    const targetSelector = allEvents[0].topics[0];

    const result = await request<DomainEventsResult>(DomainEventsFiltered, {
      name: NAME_WITH_EVENTS,
      where: { selector_in: [targetSelector] },
    });
    const events = flattenConnection(result.domain.events);

    expect(events.length).toBeGreaterThan(0);
    for (const event of events) {
      expect(event.topics[0]?.toLowerCase()).toBe(targetSelector.toLowerCase());
    }
  });

  it("filters by selector_in with unknown topic returns no results", async () => {
    const result = await request<DomainEventsResult>(DomainEventsFiltered, {
      name: NAME_WITH_EVENTS,
      where: {
        selector_in: ["0x0000000000000000000000000000000000000000000000000000000000000001"],
      },
    });
    const events = flattenConnection(result.domain.events);
    expect(events.length).toBe(0);
  });

  it("filters by empty selector_in returns no results", async () => {
    const result = await request<DomainEventsResult>(DomainEventsFiltered, {
      name: NAME_WITH_EVENTS,
      where: { selector_in: [] },
    });
    const events = flattenConnection(result.domain.events);
    expect(events.length).toBe(0);
  });

  it("filters by timestamp_gte", async () => {
    const midTimestamp = allEvents[Math.floor(allEvents.length / 2)].timestamp;

    const result = await request<DomainEventsResult>(DomainEventsFiltered, {
      name: NAME_WITH_EVENTS,
      where: { timestamp_gte: midTimestamp },
    });
    const events = flattenConnection(result.domain.events);

    expect(events.length).toBeGreaterThan(0);
    expect(events.length).toBeLessThanOrEqual(allEvents.length);
    for (const event of events) {
      expect(BigInt(event.timestamp)).toBeGreaterThanOrEqual(BigInt(midTimestamp));
    }
  });

  it("filters by timestamp_lte", async () => {
    const midTimestamp = allEvents[Math.floor(allEvents.length / 2)].timestamp;

    const result = await request<DomainEventsResult>(DomainEventsFiltered, {
      name: NAME_WITH_EVENTS,
      where: { timestamp_lte: midTimestamp },
    });
    const events = flattenConnection(result.domain.events);

    expect(events.length).toBeGreaterThan(0);
    expect(events.length).toBeLessThanOrEqual(allEvents.length);
    for (const event of events) {
      expect(BigInt(event.timestamp)).toBeLessThanOrEqual(BigInt(midTimestamp));
    }
  });

  it("filters by timestamp range", async () => {
    const minTs = allEvents[0].timestamp;
    const maxTs = allEvents[allEvents.length - 1].timestamp;

    const result = await request<DomainEventsResult>(DomainEventsFiltered, {
      name: NAME_WITH_EVENTS,
      where: { timestamp_gte: minTs, timestamp_lte: maxTs },
      first: 1000,
    });
    const events = flattenConnection(result.domain.events);
    expect(events.length).toBe(allEvents.length);
  });

  it("filters by from address", async () => {
    const targetFrom = allEvents[0].from;

    const result = await request<DomainEventsResult>(DomainEventsFiltered, {
      name: NAME_WITH_EVENTS,
      where: { from: targetFrom },
    });
    const events = flattenConnection(result.domain.events);

    expect(events.length).toBeGreaterThan(0);
    for (const event of events) {
      expect(event.from.toLowerCase()).toBe(targetFrom.toLowerCase());
    }
  });

  it("combines selector_in and timestamp_gte", async () => {
    // pick a seed event from the second half so its selector is guaranteed to
    // appear at or after midTimestamp, avoiding flaky empty-result failures
    const midIndex = Math.floor(allEvents.length / 2);
    const seedEvent = allEvents[midIndex];
    const targetSelector = seedEvent.topics[0];
    const midTimestamp = seedEvent.timestamp;

    const result = await request<DomainEventsResult>(DomainEventsFiltered, {
      name: NAME_WITH_EVENTS,
      where: { selector_in: [targetSelector], timestamp_gte: midTimestamp },
    });
    const events = flattenConnection(result.domain.events);

    expect(events.length).toBeGreaterThan(0);
    expect(events.length).toBeLessThanOrEqual(allEvents.length);
    for (const event of events) {
      expect(event.topics[0]?.toLowerCase()).toBe(targetSelector.toLowerCase());
      expect(BigInt(event.timestamp)).toBeGreaterThanOrEqual(BigInt(midTimestamp));
    }
  });

  it("excludes all events with a future timestamp", async () => {
    const maxTimestamp = BigInt(allEvents[allEvents.length - 1].timestamp);

    const result = await request<DomainEventsResult>(DomainEventsFiltered, {
      name: NAME_WITH_EVENTS,
      where: { timestamp_gte: (maxTimestamp + 1n).toString() },
    });
    const events = flattenConnection(result.domain.events);
    expect(events.length).toBe(0);
  });
});
