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
    query DomainEventsFiltered($name: Name!, $where: EventsWhereInput) {
      domain(by: { name: $name }) { events(where: $where) { edges { node { ...EventFragment } } } }
    }
    ${EventFragment}
  `;

  let allEvents: EventResult[];

  beforeAll(async () => {
    const result = await request<DomainEventsResult>(DomainEventsFiltered, {
      name: NAME_WITH_EVENTS,
    });
    allEvents = flattenConnection(result.domain.events);
    expect(allEvents.length).toBeGreaterThan(0);
  });

  it("filters by topic0_in", async () => {
    const targetTopic0 = allEvents[0].topics[0];

    const result = await request<DomainEventsResult>(DomainEventsFiltered, {
      name: NAME_WITH_EVENTS,
      where: { topic0_in: [targetTopic0] },
    });
    const events = flattenConnection(result.domain.events);

    expect(events.length).toBeGreaterThan(0);
    for (const event of events) {
      expect(event.topics[0]?.toLowerCase()).toBe(targetTopic0.toLowerCase());
    }
  });

  it("filters by topic0_in with unknown topic returns no results", async () => {
    const result = await request<DomainEventsResult>(DomainEventsFiltered, {
      name: NAME_WITH_EVENTS,
      where: {
        topic0_in: ["0x0000000000000000000000000000000000000000000000000000000000000001"],
      },
    });
    const events = flattenConnection(result.domain.events);
    expect(events.length).toBe(0);
  });

  it("filters by empty topic0_in returns no results", async () => {
    const result = await request<DomainEventsResult>(DomainEventsFiltered, {
      name: NAME_WITH_EVENTS,
      where: { topic0_in: [] },
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

  it("combines topic0_in and timestamp_gte", async () => {
    const targetTopic0 = allEvents[0].topics[0];
    const midTimestamp = allEvents[Math.floor(allEvents.length / 2)].timestamp;

    const result = await request<DomainEventsResult>(DomainEventsFiltered, {
      name: NAME_WITH_EVENTS,
      where: { topic0_in: [targetTopic0], timestamp_gte: midTimestamp },
    });
    const events = flattenConnection(result.domain.events);

    for (const event of events) {
      expect(event.topics[0]?.toLowerCase()).toBe(targetTopic0.toLowerCase());
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
