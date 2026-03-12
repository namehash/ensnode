import { describe, expect, it } from "vitest";

import { DatasourceNames } from "@ensnode/datasources";
import { getDatasourceContract } from "@ensnode/ensnode-sdk";

import { gql } from "@/test/integration/ensnode-graphql-api-client";
import {
  EventFragment,
  type EventResult,
  PermissionsEventsPaginated,
} from "@/test/integration/find-events/event-pagination-queries";
import { testEventPagination } from "@/test/integration/find-events/test-event-pagination";
import {
  flattenConnection,
  type GraphQLConnection,
  type PaginatedGraphQLConnection,
  request,
} from "@/test/integration/graphql-utils";

const namespace = "ens-test-env";

const V2_ETH_REGISTRY = getDatasourceContract(namespace, DatasourceNames.ENSv2Root, "ETHRegistry");

describe("Permissions.events", () => {
  type PermissionsEventsResult = {
    permissions: {
      events: GraphQLConnection<EventResult>;
    };
  };

  const PermissionsEvents = gql`
    query PermissionsEvents($contract: AccountIdInput!) {
      permissions(for: $contract) {
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

  it("returns events for the ETHRegistry permissions", async () => {
    const result = await request<PermissionsEventsResult>(PermissionsEvents, {
      contract: V2_ETH_REGISTRY,
    });
    const events = flattenConnection(result.permissions.events);

    expect(events.length).toBeGreaterThan(0);

    // all events should be scoped to the ETHRegistry contract
    for (const event of events) {
      expect(event.address.toLowerCase()).toBe(V2_ETH_REGISTRY.address);
    }
  });
});

describe("Permissions.events pagination", () => {
  testEventPagination(async (variables) => {
    const result = await request<{
      permissions: { events: PaginatedGraphQLConnection<EventResult> };
    }>(PermissionsEventsPaginated, { contract: V2_ETH_REGISTRY, ...variables });
    return result.permissions.events;
  });
});

describe.todo("Permissions.events filtering (EventsWhereInput)");
