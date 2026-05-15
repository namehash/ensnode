import { asInterpretedName } from "enssdk";
import { describe, expect, it } from "vitest";

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
import { gql } from "@/test/integration/omnigraph-api-client";

// TODO: once the devnet has deterministic resolver addresses, we can resolver(by: { contract })
// but until then we'll access by a domain's assigned resolver
const DEVNET_NAME_WITH_OWNED_RESOLVER = asInterpretedName("example.eth");

describe("Resolver.events", () => {
  type ResolverEventsResult = {
    domain: {
      assignedResolver: {
        events: GraphQLConnection<EventResult>;
      };
    };
  };

  const ResolverEvents = gql`
    query ResolverEvents($name: InterpretedName!) {
      domain(by: { name: $name }) {
        assignedResolver {
          events {
            edges {
              node {
                ...EventFragment
              }
            }
          }
        }
      }
    }

    ${EventFragment}
  `;

  it("returns events for a known resolver", async () => {
    const result = await request<ResolverEventsResult>(ResolverEvents, {
      name: DEVNET_NAME_WITH_OWNED_RESOLVER,
    });

    const events = flattenConnection(result.domain.assignedResolver.events);

    expect(events.length).toBeGreaterThan(0);
  });
});

describe("Resolver.events pagination", () => {
  testEventPagination(async (variables) => {
    const result = await request<{
      domain: { assignedResolver: { events: PaginatedGraphQLConnection<EventResult> } };
    }>(ResolverEventsPaginated, { name: DEVNET_NAME_WITH_OWNED_RESOLVER, ...variables });
    return result.domain.assignedResolver.events;
  });
});
