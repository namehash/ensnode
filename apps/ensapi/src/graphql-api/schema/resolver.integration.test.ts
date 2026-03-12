import { describe, expect, it } from "vitest";

import { ensTestEnvChain } from "@ensnode/datasources";
import type { AccountId } from "@ensnode/ensnode-sdk";

import { gql } from "@/test/integration/ensnode-graphql-api-client";
import {
  EventFragment,
  type EventResult,
  ResolverEventsPaginated,
} from "@/test/integration/find-events/event-pagination-queries";
import { testEventPagination } from "@/test/integration/find-events/test-event-pagination";
import {
  flattenConnection,
  type GraphQLConnection,
  type PaginatedGraphQLConnection,
  request,
} from "@/test/integration/graphql-utils";

const SOME_OWNED_RESOLVER: AccountId = {
  chainId: ensTestEnvChain.id,
  address: "0x125ee1aef73e9ef9bc167ed86a0dc4c139ce5e35",
};

describe("Resolver.events", () => {
  type ResolverEventsResult = {
    resolver: {
      events: GraphQLConnection<EventResult>;
    };
  };

  const ResolverEvents = gql`
    query ResolverEvents($contract: AccountIdInput!) {
      resolver(by: { contract: $contract }) {
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

  it("returns events for a known resolver", async () => {
    const result = await request<ResolverEventsResult>(ResolverEvents, {
      contract: SOME_OWNED_RESOLVER,
    });
    const events = flattenConnection(result.resolver.events);

    expect(events.length).toBeGreaterThan(0);
  });
});

describe("Resolver.events pagination", () => {
  testEventPagination(async (variables) => {
    const result = await request<{
      resolver: { events: PaginatedGraphQLConnection<EventResult> };
    }>(ResolverEventsPaginated, { contract: SOME_OWNED_RESOLVER, ...variables });
    return result.resolver.events;
  });
});

describe.todo("Resolver.events filtering (EventsWhereInput)");
