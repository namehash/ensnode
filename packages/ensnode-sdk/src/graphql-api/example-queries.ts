import { type ENSNamespaceId, ENSNamespaceIds } from "@ensnode/datasources";

export const GRAPHQL_API_EXAMPLE_QUERIES: Array<{
  query: string;
  variables: { default: any } & Partial<Record<ENSNamespaceId, any>>;
}> = [
  ////////////////
  // Find Domains
  ////////////////
  {
    query: `
query FindDomains(
  $name: String!
  $order: DomainsOrderInput
) {
  domains(
    where: { name: $name }
    order: $order
  ) {
    edges {
      node {
        __typename
        id
        label { interpreted hash }
        name

        registration { expiry event { timestamp } }
      }
    }
  }
}`,
    variables: {
      default: { name: "vitalik", order: { by: "NAME", dir: "DESC" } },
      [ENSNamespaceIds.EnsTestEnv]: { name: "c", order: { by: "NAME", dir: "DESC" } },
    },
  },

  ////////////////
  // DomainByName
  ////////////////
  {
    query: `
query DomainByName($name: Name!) {
  domain(by: {name: $name}) {
    __typename
    id
    label { interpreted }
    name
    subdomains(first: 10) {
      edges {
        node {
          name
        }
      }
    }

    ... on ENSv2Domain {
      subregistry {
        contract { chainId address }
      }
    }
  }
}`,
    variables: { default: { name: "eth" } },
  },
];
