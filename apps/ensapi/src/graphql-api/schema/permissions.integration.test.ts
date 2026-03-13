import type { Address } from "viem";
import { toEventSelector } from "viem";
import { beforeAll, describe, expect, it } from "vitest";

import { DatasourceNames, EnhancedAccessControlABI } from "@ensnode/datasources";
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

const NAME_WITH_RESOLVER = "example.eth";

const EAC_ROLES_CHANGED_SELECTOR = toEventSelector(
  EnhancedAccessControlABI.find(
    (item) => item.type === "event" && item.name === "EACRolesChanged",
  )!,
);

describe("Permissions", () => {
  type PermissionsResult = {
    permissions: {
      id: string;
      contract: { chainId: number; address: Address };
      root: {
        id: string;
        resource: string;
        users: GraphQLConnection<{
          id: string;
          resource: string;
          user: { address: Address };
          roles: string;
        }>;
      };
      resources: GraphQLConnection<{
        id: string;
        resource: string;
        users: GraphQLConnection<{
          id: string;
          resource: string;
          user: { address: Address };
          roles: string;
        }>;
      }>;
    };
  };

  const PermissionsQuery = gql`
    query Permissions($contract: AccountIdInput!) {
      permissions(for: $contract) {
        id
        contract { chainId address }
        root {
          id resource
          users { edges { node { id resource user { address } roles } } }
        }
        resources { edges { node {
          id resource
          users { edges { node { id resource user { address } roles } } }
        } } }
      }
    }
  `;

  it("resolves all Permissions fields for the ETHRegistry", async () => {
    const result = await request<PermissionsResult>(PermissionsQuery, {
      contract: V2_ETH_REGISTRY,
    });

    const { permissions } = result;

    // contract field matches the queried contract
    expect(permissions.contract.address).toBe(V2_ETH_REGISTRY.address);
    expect(permissions.contract.chainId).toBe(V2_ETH_REGISTRY.chainId);

    // root is a PermissionsResource with resource === 0 (ROOT_RESOURCE)
    expect(permissions.root.resource).toBe("0");

    // root has at least one user
    const rootUsers = flattenConnection(permissions.root.users);
    expect(rootUsers.length).toBeGreaterThan(0);
    for (const user of rootUsers) {
      expect(user.resource).toBe("0");
      expect(user.user.address).toBeTruthy();
      expect(user.roles).toBeTruthy();
    }

    // resources includes at least the root resource
    const resources = flattenConnection(permissions.resources);
    expect(resources.length).toBeGreaterThan(0);

    // every resource has a valid resource id and its users match the resource
    for (const resource of resources) {
      expect(resource.id).toBeTruthy();
      const users = flattenConnection(resource.users);
      for (const user of users) {
        expect(user.resource).toBe(resource.resource);
      }
    }
  });
});

describe("Registry.permissions", () => {
  const RegistryPermissions = gql`
    query RegistryPermissions($contract: AccountIdInput!) {
      registry(by: { contract: $contract }) {
        permissions { id contract { chainId address } }
      }
    }
  `;

  it("resolves permissions from a registry", async () => {
    const result = await request<{
      registry: {
        permissions: { id: string; contract: { chainId: number; address: Address } };
      };
    }>(RegistryPermissions, { contract: V2_ETH_REGISTRY });

    expect(result.registry.permissions.contract.address).toBe(V2_ETH_REGISTRY.address);
    expect(result.registry.permissions.contract.chainId).toBe(V2_ETH_REGISTRY.chainId);
  });
});

describe("Domain.permissions", () => {
  type DomainPermissionsResult = {
    domain: {
      permissions: GraphQLConnection<{
        id: string;
        resource: string;
        user: { address: Address };
        roles: string;
      }>;
    };
  };

  const DomainPermissions = gql`
    query DomainPermissions($name: Name!) {
      domain(by: { name: $name }) {
        ... on ENSv2Domain {
          permissions { edges { node { id resource user { address } roles } } }
        }
      }
    }
  `;

  let allUsers: { id: string; resource: string; user: { address: Address }; roles: string }[];

  beforeAll(async () => {
    const result = await request<DomainPermissionsResult>(DomainPermissions, {
      name: "test.eth",
    });
    allUsers = flattenConnection(result.domain.permissions);
    expect(allUsers.length).toBeGreaterThan(0);
  });

  it("resolves permissions for test.eth", () => {
    // all users should have the same resource (the domain's tokenId)
    const resources = new Set(allUsers.map((u) => u.resource));
    expect(resources.size).toBe(1);

    for (const user of allUsers) {
      expect(user.user.address).toBeTruthy();
      expect(user.roles).toBeTruthy();
    }
  });

  it("filters permissions by user address", async () => {
    const DomainPermissionsFiltered = gql`
      query DomainPermissionsFiltered($name: Name!, $user: Address!) {
        domain(by: { name: $name }) {
          ... on ENSv2Domain {
            permissions(where: { user: $user }) { edges { node { id resource user { address } roles } } }
          }
        }
      }
    `;

    const targetUser = allUsers[0].user.address;

    const filtered = await request<DomainPermissionsResult>(DomainPermissionsFiltered, {
      name: "test.eth",
      user: targetUser,
    });
    const filteredUsers = flattenConnection(filtered.domain.permissions);

    expect(filteredUsers.length).toBeGreaterThan(0);
    for (const user of filteredUsers) {
      expect(user.user.address.toLowerCase()).toBe(targetUser.toLowerCase());
    }
  });
});

describe("Account.permissions and Account.registryPermissions", () => {
  const PermissionsRootUsers = gql`
    query PermissionsRootUsers($contract: AccountIdInput!) {
      permissions(for: $contract) {
        root { users { edges { node { user { address } } } } }
      }
    }
  `;

  const AccountPermissions = gql`
    query AccountPermissions($address: Address!) {
      account(address: $address) {
        permissions { edges { node { id resource user { address } roles } } }
      }
    }
  `;

  const AccountRegistryPermissions = gql`
    query AccountRegistryPermissions($address: Address!) {
      account(address: $address) {
        registryPermissions { edges { node { id registry { id } resource user { address } roles } } }
      }
    }
  `;

  let targetAddress: Address;

  beforeAll(async () => {
    const rootResult = await request<{
      permissions: {
        root: { users: GraphQLConnection<{ user: { address: Address } }> };
      };
    }>(PermissionsRootUsers, { contract: V2_ETH_REGISTRY });

    const rootUsers = flattenConnection(rootResult.permissions.root.users);
    expect(rootUsers.length).toBeGreaterThan(0);
    targetAddress = rootUsers[0].user.address;
  });

  it("resolves permissions for an account with known roles", async () => {
    const result = await request<{
      account: {
        permissions: GraphQLConnection<{
          id: string;
          resource: string;
          user: { address: Address };
          roles: string;
        }>;
      };
    }>(AccountPermissions, { address: targetAddress });

    const permissions = flattenConnection(result.account.permissions);
    expect(permissions.length).toBeGreaterThan(0);

    for (const p of permissions) {
      expect(p.user.address.toLowerCase()).toBe(targetAddress.toLowerCase());
    }
  });

  it("resolves registry-scoped permissions for an account", async () => {
    const result = await request<{
      account: {
        registryPermissions: GraphQLConnection<{
          id: string;
          registry: { id: string };
          resource: string;
          user: { address: Address };
          roles: string;
        }>;
      };
    }>(AccountRegistryPermissions, { address: targetAddress });

    const permissions = flattenConnection(result.account.registryPermissions);
    expect(permissions.length).toBeGreaterThan(0);

    for (const p of permissions) {
      expect(p.registry.id).toBeTruthy();
      expect(p.user.address.toLowerCase()).toBe(targetAddress.toLowerCase());
    }
  });
});

describe("Resolver.permissions", () => {
  const ResolverPermissions = gql`
    query ResolverPermissions($name: Name!) {
      domain(by: { name: $name }) {
        resolver { permissions { id contract { chainId address } } }
      }
    }
  `;

  it("resolves permissions from a resolver", async () => {
    const result = await request<{
      domain: {
        resolver: {
          permissions: { id: string; contract: { chainId: number; address: Address } };
        };
      };
    }>(ResolverPermissions, { name: NAME_WITH_RESOLVER });

    expect(
      result.domain.resolver,
      `expected ${NAME_WITH_RESOLVER} to have a resolver`,
    ).toBeDefined();
    expect(result.domain.resolver.permissions.id).toBeTruthy();
    expect(result.domain.resolver.permissions.contract.address).toBeTruthy();
    expect(result.domain.resolver.permissions.contract.chainId).toBeTruthy();
  });
});

describe("Permissions.events", () => {
  type PermissionsEventsResult = {
    permissions: { events: GraphQLConnection<EventResult> };
  };

  const PermissionsEvents = gql`
    query PermissionsEvents($contract: AccountIdInput!, $first: Int) {
      permissions(for: $contract) { events(first: $first) { edges { node { ...EventFragment } } } }
    }
    ${EventFragment}
  `;

  let allEvents: EventResult[];

  beforeAll(async () => {
    const result = await request<PermissionsEventsResult>(PermissionsEvents, {
      contract: V2_ETH_REGISTRY,
      first: 1000,
    });
    // events are returned in ascending order, so first/last access yields min/max values
    allEvents = flattenConnection(result.permissions.events);
    expect(allEvents.length).toBeGreaterThan(0);
  });

  it("returns events scoped to the ETHRegistry contract", () => {
    for (const event of allEvents) {
      expect(event.address.toLowerCase()).toBe(V2_ETH_REGISTRY.address);
    }
  });

  it("includes EACRolesChanged events", () => {
    const rolesChangedEvents = allEvents.filter(
      (e) => e.topics[0]?.toLowerCase() === EAC_ROLES_CHANGED_SELECTOR,
    );
    expect(rolesChangedEvents.length).toBeGreaterThan(0);
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

describe("Permissions.events filtering (EventsWhereInput)", () => {
  type PermissionsEventsResult = {
    permissions: { events: GraphQLConnection<EventResult> };
  };

  const PermissionsEventsFiltered = gql`
    query PermissionsEventsFiltered($contract: AccountIdInput!, $where: EventsWhereInput, $first: Int) {
      permissions(for: $contract) { events(where: $where, first: $first) { edges { node { ...EventFragment } } } }
    }
    ${EventFragment}
  `;

  let allEvents: EventResult[];

  beforeAll(async () => {
    const result = await request<PermissionsEventsResult>(PermissionsEventsFiltered, {
      contract: V2_ETH_REGISTRY,
      first: 1000,
    });
    // events are returned in ascending order, so first/last access yields min/max values
    allEvents = flattenConnection(result.permissions.events);
    expect(allEvents.length).toBeGreaterThan(0);
  });

  it("filters by selector_in", async () => {
    const result = await request<PermissionsEventsResult>(PermissionsEventsFiltered, {
      contract: V2_ETH_REGISTRY,
      where: { selector_in: [EAC_ROLES_CHANGED_SELECTOR] },
    });
    const events = flattenConnection(result.permissions.events);

    expect(events.length).toBeGreaterThan(0);
    for (const event of events) {
      expect(event.topics[0]?.toLowerCase()).toBe(EAC_ROLES_CHANGED_SELECTOR);
    }
  });

  it("filters by selector_in with unknown topic returns no results", async () => {
    const result = await request<PermissionsEventsResult>(PermissionsEventsFiltered, {
      contract: V2_ETH_REGISTRY,
      where: {
        selector_in: ["0x0000000000000000000000000000000000000000000000000000000000000001"],
      },
    });
    const events = flattenConnection(result.permissions.events);
    expect(events.length).toBe(0);
  });

  it("filters by empty selector_in returns no results", async () => {
    const result = await request<PermissionsEventsResult>(PermissionsEventsFiltered, {
      contract: V2_ETH_REGISTRY,
      where: { selector_in: [] },
    });
    const events = flattenConnection(result.permissions.events);
    expect(events.length).toBe(0);
  });

  it("filters by timestamp_gte", async () => {
    const midTimestamp = allEvents[Math.floor(allEvents.length / 2)].timestamp;

    const result = await request<PermissionsEventsResult>(PermissionsEventsFiltered, {
      contract: V2_ETH_REGISTRY,
      where: { timestamp_gte: midTimestamp },
    });
    const events = flattenConnection(result.permissions.events);

    expect(events.length).toBeGreaterThan(0);
    expect(events.length).toBeLessThanOrEqual(allEvents.length);
    for (const event of events) {
      expect(BigInt(event.timestamp)).toBeGreaterThanOrEqual(BigInt(midTimestamp));
    }
  });

  it("filters by timestamp_lte", async () => {
    const midTimestamp = allEvents[Math.floor(allEvents.length / 2)].timestamp;

    const result = await request<PermissionsEventsResult>(PermissionsEventsFiltered, {
      contract: V2_ETH_REGISTRY,
      where: { timestamp_lte: midTimestamp },
    });
    const events = flattenConnection(result.permissions.events);

    expect(events.length).toBeGreaterThan(0);
    expect(events.length).toBeLessThanOrEqual(allEvents.length);
    for (const event of events) {
      expect(BigInt(event.timestamp)).toBeLessThanOrEqual(BigInt(midTimestamp));
    }
  });

  it("filters by timestamp range", async () => {
    const minTs = allEvents[0].timestamp;
    const maxTs = allEvents[allEvents.length - 1].timestamp;

    const result = await request<PermissionsEventsResult>(PermissionsEventsFiltered, {
      contract: V2_ETH_REGISTRY,
      where: { timestamp_gte: minTs, timestamp_lte: maxTs },
      first: 1000,
    });
    const events = flattenConnection(result.permissions.events);

    // should return all events when range covers everything
    expect(events.length).toBe(allEvents.length);
  });

  it("filters by from address", async () => {
    const targetFrom = allEvents[0].from;

    const result = await request<PermissionsEventsResult>(PermissionsEventsFiltered, {
      contract: V2_ETH_REGISTRY,
      where: { from: targetFrom },
    });
    const events = flattenConnection(result.permissions.events);

    expect(events.length).toBeGreaterThan(0);
    for (const event of events) {
      expect(event.from.toLowerCase()).toBe(targetFrom.toLowerCase());
    }
  });

  it("combines selector_in and timestamp_gte", async () => {
    const midTimestamp = allEvents[Math.floor(allEvents.length / 2)].timestamp;

    const result = await request<PermissionsEventsResult>(PermissionsEventsFiltered, {
      contract: V2_ETH_REGISTRY,
      where: { selector_in: [EAC_ROLES_CHANGED_SELECTOR], timestamp_gte: midTimestamp },
    });
    const events = flattenConnection(result.permissions.events);

    expect(events.length).toBeGreaterThan(0);
    expect(events.length).toBeLessThanOrEqual(allEvents.length);
    for (const event of events) {
      expect(event.topics[0]?.toLowerCase()).toBe(EAC_ROLES_CHANGED_SELECTOR);
      expect(BigInt(event.timestamp)).toBeGreaterThanOrEqual(BigInt(midTimestamp));
    }
  });

  it("excludes all events with a future timestamp", async () => {
    const maxTimestamp = BigInt(allEvents[allEvents.length - 1].timestamp);

    const result = await request<PermissionsEventsResult>(PermissionsEventsFiltered, {
      contract: V2_ETH_REGISTRY,
      where: { timestamp_gte: (maxTimestamp + 1n).toString() },
    });
    const events = flattenConnection(result.permissions.events);
    expect(events.length).toBe(0);
  });
});
