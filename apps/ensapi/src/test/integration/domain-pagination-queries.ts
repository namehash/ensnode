import type { InterpretedLabel, Name } from "@ensnode/ensnode-sdk";

import { gql } from "@/test/integration/ensnode-graphql-api-client";

const PageInfoFragment = gql`
  fragment PageInfoFragment on PageInfo {
    hasNextPage
    hasPreviousPage
    startCursor
    endCursor
  }
`;

const PaginatedDomainFragment = gql`
  fragment PaginatedDomainFragment on Domain {
    name
    label { interpreted }
    registration {
      expiry
      event { timestamp }
    }
  }
`;

export type PaginatedDomainResult = {
  name: Name | null;
  label: { interpreted: InterpretedLabel };
  registration: {
    expiry: string | null;
    event: { timestamp: string };
  } | null;
};

export const QueryDomainsPaginated = gql`
  query QueryDomainsPaginated(
    $order: DomainsOrderInput!
    $first: Int
    $after: String
    $last: Int
    $before: String
  ) {
    domains(
      where: { name: "e" }
      order: $order
      first: $first
      after: $after
      last: $last
      before: $before
    ) {
      edges { cursor node { ...PaginatedDomainFragment } }
      pageInfo { ...PageInfoFragment }
    }
  }

  ${PageInfoFragment}
  ${PaginatedDomainFragment}
`;

export const DomainSubdomainsPaginated = gql`
  query DomainSubdomainsPaginated(
    $order: DomainsOrderInput!
    $first: Int
    $after: String
    $last: Int
    $before: String
  ) {
    domain(by: { name: "eth" }) {
      subdomains(order: $order, first: $first, after: $after, last: $last, before: $before) {
        edges { cursor node { ...PaginatedDomainFragment } }
        pageInfo { ...PageInfoFragment }
      }
    }
  }

  ${PageInfoFragment}
  ${PaginatedDomainFragment}
`;

export const AccountDomainsPaginated = gql`
  query AccountDomainsPaginated(
    $address: Address!
    $order: DomainsOrderInput!
    $first: Int
    $after: String
    $last: Int
    $before: String
  ) {
    account(address: $address) {
      domains(order: $order, first: $first, after: $after, last: $last, before: $before) {
        edges { cursor node { ...PaginatedDomainFragment } }
        pageInfo { ...PageInfoFragment }
      }
    }
  }

  ${PageInfoFragment}
  ${PaginatedDomainFragment}
`;

export const RegistryDomainsPaginated = gql`
  query RegistryDomainsPaginated(
    $contract: AccountIdInput!
    $order: DomainsOrderInput!
    $first: Int
    $after: String
    $last: Int
    $before: String
  ) {
    registry(by: { contract: $contract }) {
      domains(order: $order, first: $first, after: $after, last: $last, before: $before) {
        edges { cursor node { ...PaginatedDomainFragment } }
        pageInfo { ...PageInfoFragment }
      }
    }
  }

  ${PageInfoFragment}
  ${PaginatedDomainFragment}
`;
