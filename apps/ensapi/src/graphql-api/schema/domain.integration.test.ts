import { describe, expect, it } from "vitest";

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
        subdomains {
          edges {
            node {
              name
              label {
                interpreted
              }
            }
          }
        }
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
    domain: {
      events: GraphQLConnection<EventResult>;
    };
  };

  const DomainEvents = gql`
    query DomainEvents($name: Name!) {
      domain(by: { name: $name }) {
        events {
          edges {
            node {
              ...EventFragment
            }
          }
        }
      }
    }

    ${EventFragment}
  `;

  it("returns events for a domain with known activity", async () => {
    const result = await request<DomainEventsResult>(DomainEvents, { name: "test.eth" });
    const events = flattenConnection(result.domain.events);

    expect(events.length).toBeGreaterThan(0);

    for (const event of events) {
      expect(event.id).toBeTruthy();
      expect(event.chainId).toBeTypeOf("number");
      expect(event.blockNumber).toBeTruthy();
      expect(event.blockHash).toMatch(/^0x/);
      expect(event.timestamp).toBeTruthy();
      expect(event.transactionHash).toMatch(/^0x/);
      expect(event.transactionIndex).toBeTypeOf("number");
      expect(event.from).toMatch(/^0x/);
      expect(event.address).toMatch(/^0x/);
      expect(event.logIndex).toBeTypeOf("number");
      expect(event.topics).toBeInstanceOf(Array);
      expect(event.topics.length).toBeGreaterThan(0);
      expect(event.data).toMatch(/^0x/);
    }
  });

  it("returns events for multiple domains", async () => {
    const names = ["test.eth", "example.eth", "demo.eth"];

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
    }>(DomainEventsPaginated, { name: "test.eth", ...variables });
    return result.domain.events;
  });
});
