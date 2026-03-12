import { gql } from "@/test/integration/ensnode-graphql-api-client";

const PageInfoFragment = gql`
  fragment PageInfoFragment on PageInfo {
    hasNextPage
    hasPreviousPage
    startCursor
    endCursor
  }
`;

export const EventFragment = gql`
  fragment EventFragment on Event {
    id
    chainId
    blockNumber
    blockHash
    timestamp
    transactionHash
    transactionIndex
    from
    to
    address
    logIndex
    topics
    data
  }
`;

export type EventResult = {
  id: string;
  chainId: number;
  blockNumber: string;
  blockHash: string;
  timestamp: string;
  transactionHash: string;
  transactionIndex: number;
  from: string;
  to: string | null;
  address: string;
  logIndex: number;
  topics: string[];
  data: string;
};

export const DomainEventsPaginated = gql`
  query DomainEventsPaginated(
    $name: Name!
    $first: Int
    $after: String
    $last: Int
    $before: String
  ) {
    domain(by: { name: $name }) {
      events(first: $first, after: $after, last: $last, before: $before) {
        edges { cursor node { ...EventFragment } }
        pageInfo { ...PageInfoFragment }
      }
    }
  }

  ${PageInfoFragment}
  ${EventFragment}
`;

export const AccountEventsPaginated = gql`
  query AccountEventsPaginated(
    $address: Address!
    $first: Int
    $after: String
    $last: Int
    $before: String
  ) {
    account(address: $address) {
      events(first: $first, after: $after, last: $last, before: $before) {
        edges { cursor node { ...EventFragment } }
        pageInfo { ...PageInfoFragment }
      }
    }
  }

  ${PageInfoFragment}
  ${EventFragment}
`;

export const ResolverEventsPaginated = gql`
  query ResolverEventsPaginated(
    $name: Name!
    $first: Int
    $after: String
    $last: Int
    $before: String
  ) {
    domain(by: { name: $name }) {
      resolver {
        events(first: $first, after: $after, last: $last, before: $before) {
          edges { cursor node { ...EventFragment } }
          pageInfo { ...PageInfoFragment }
        }
      }
    }
  }

  ${PageInfoFragment}
  ${EventFragment}
`;

export const PermissionsEventsPaginated = gql`
  query PermissionsEventsPaginated(
    $contract: AccountIdInput!
    $first: Int
    $after: String
    $last: Int
    $before: String
  ) {
    permissions(for: $contract) {
      events(first: $first, after: $after, last: $last, before: $before) {
        edges { cursor node { ...EventFragment } }
        pageInfo { ...PageInfoFragment }
      }
    }
  }

  ${PageInfoFragment}
  ${EventFragment}
`;
