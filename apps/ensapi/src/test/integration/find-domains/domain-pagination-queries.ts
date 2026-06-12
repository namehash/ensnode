import type { DomainId, InterpretedName } from "enssdk";

import { gql } from "@/test/integration/omnigraph-api-client";

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
    id
    canonical { name { interpreted } depth }
    registration {
      expiry
      start
    }
  }
`;

export type PaginatedDomainResult = {
  id: DomainId;
  canonical: { name: { interpreted: InterpretedName }; depth: number } | null;
  registration: {
    expiry: string | null;
    start: string;
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
      where: { name: { starts_with: "e" } }
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
    account(by: { address: $address }) {
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
