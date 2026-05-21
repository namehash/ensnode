import { asInterpretedName, toNormalizedAddress } from "enssdk";

import { DatasourceNames, ENSNamespaceIds } from "@ensnode/datasources";
import { accounts } from "@ensnode/datasources/devnet";

import { getDatasourceContract } from "../shared/datasource-contract";
import type { NamespaceSpecificValue } from "../shared/namespace-specific-value";

const SEPOLIA_V2_V2_ETH_REGISTRY = getDatasourceContract(
  ENSNamespaceIds.SepoliaV2,
  DatasourceNames.ENSv2Root,
  "ETHRegistry",
);

const SEPOLIA_V2_V2_ETH_REGISTRAR = getDatasourceContract(
  ENSNamespaceIds.SepoliaV2,
  DatasourceNames.ENSv2Root,
  "ETHRegistrar",
);

const ENS_TEST_ENV_V2_ETH_REGISTRY = getDatasourceContract(
  ENSNamespaceIds.EnsTestEnv,
  DatasourceNames.ENSv2Root,
  "ETHRegistry",
);

const ENS_TEST_ENV_V2_ETH_REGISTRAR = getDatasourceContract(
  ENSNamespaceIds.EnsTestEnv,
  DatasourceNames.ENSv2Root,
  "ETHRegistrar",
);

const VITALIK_ADDRESS = toNormalizedAddress("0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045");

// owns sfmonicdeb*.eth (mix of v1 + v2) on sepolia-v2 and holds v2 ETHRegistry permissions
const _SEPOLIA_V2_USER_ADDRESS = toNormalizedAddress("0x2f8e8b1126e75fde0b7f731e7cb5847eba2d2574");

const SEPOLIA_V2_ADDRESS_WITH_LOT_OF_NAMES = toNormalizedAddress(
  "0x205d2686da3bf33f64c17f21462c51b5ead462cf",
);

const DEVNET_NAME_WITH_OWNED_RESOLVER = asInterpretedName("example.eth");

const SEPOLIA_V2_NAME_WITH_OWNED_RESOLVER = asInterpretedName("sfmonicdebmig.eth");

const SEPOLIA_V2_TEST_NAME = asInterpretedName("test-name.eth");

const MAINNET_PUBLIC_RESOLVER = getDatasourceContract(
  ENSNamespaceIds.Mainnet,
  DatasourceNames.ReverseResolverRoot,
  "DefaultPublicResolver5",
);

const SEPOLIA_V2_PUBLIC_RESOLVER = getDatasourceContract(
  ENSNamespaceIds.SepoliaV2,
  DatasourceNames.ReverseResolverRoot,
  "DefaultPublicResolver5",
);

export type GraphqlApiExampleQuery = {
  id: string;
  query: string;
  variables: NamespaceSpecificValue<Record<string, unknown>>;
};

export function getGraphqlApiExampleQueryById(id: string): GraphqlApiExampleQuery {
  const found = graphqlApiExampleQueryById.get(id);
  if (!found) {
    throw new Error(`Unknown GraphQL API example query id: ${id}`);
  }
  return found;
}

export const GRAPHQL_API_EXAMPLE_QUERIES: GraphqlApiExampleQuery[] = [
  ////////////////
  // Hello World
  ////////////////
  {
    id: "hello-world",
    query: `#
# Welcome to this interactive playground for
# ENSNode's GraphQL API!
#
# You can get started by typing your query here or by using
# the Explorer on the left to select the data you want to query.
#
# There are also example queries in the tabs above ☝️
query HelloWorld {
  domain(by: { name: "eth" }) { canonical { name { interpreted beautified } } owner { address } }
}`,
    variables: { default: {} },
  },

  /////////////////
  // Find Domains
  /////////////////
  {
    id: "find-domains",
    query: `
query FindDomains(
  $name: DomainsNameFilter!
  $order: DomainsOrderInput
) {
  domains(
    where: { name: $name }
    order: $order
    first: 20
  ) {
    edges {
      node {
        __typename
        id
        label { interpreted hash }
        canonical { name { interpreted beautified } }

        registration { expiry event { timestamp } }
      }
    }
  }
}`,
    variables: {
      default: { name: { starts_with: "vitalik" }, order: { by: "NAME", dir: "DESC" } },
      [ENSNamespaceIds.EnsTestEnv]: {
        name: { starts_with: "c" },
        order: { by: "NAME", dir: "DESC" },
      },
      [ENSNamespaceIds.SepoliaV2]: {
        name: { starts_with: "test-na" },
        order: { by: "NAME", dir: "DESC" },
      },
    },
  },

  ///////////////////
  // Domain By Name
  ///////////////////
  {
    id: "domain-by-name",
    query: `
query DomainByName($name: InterpretedName!) {
  domain(by: {name: $name}) {
    __typename
    id
    label { interpreted hash }
    canonical { name { interpreted } node path { id } }
    owner { address }
    subregistry { contract { chainId address } }

    ... on ENSv1Domain {
      rootRegistryOwner { address }
    }
  }
}`,
    variables: {
      default: { name: "eth" },
      [ENSNamespaceIds.SepoliaV2]: { name: SEPOLIA_V2_TEST_NAME },
    },
  },

  ///////////////////////
  // Domain Registration
  ///////////////////////
  {
    id: "domain-registration",
    query: `
query DomainRegistration($name: InterpretedName!) {
  domain(by: { name: $name }) {
    canonical { name { interpreted } }

    registration {
      __typename
      id
      start
      expiry
      expired
      referrer
      registrar { chainId address }
      registrant { address }
      renewals(first: 5) {
        totalCount
        edges { node { duration base premium referrer } }
      }

      # ENSv1 .eth registrations (also Basenames & Lineanames)
      ... on BaseRegistrarRegistration {
        baseCost
        premium
        isInGracePeriod
        # present when the .eth name is wrapped by the NameWrapper
        wrapped { fuses tokenId }
      }

      # names held natively in the NameWrapper
      ... on NameWrapperRegistration {
        fuses
      }
    }
  }
}`,
    variables: {
      default: { name: "vitalik.eth" },
      [ENSNamespaceIds.SepoliaV2]: { name: SEPOLIA_V2_NAME_WITH_OWNED_RESOLVER },
    },
  },

  //////////////////////
  // Domain Subdomains
  //////////////////////
  {
    id: "domain-subdomains",
    query: `
query DomainSubdomains($name: InterpretedName!) {
  domain(by: {name: $name}) {
    canonical { name { interpreted beautified } }
    subdomains(first: 10) {
      edges {
        node {
          canonical { name { interpreted beautified } }
        }
      }
    }
  }
}`,
    variables: { default: { name: "eth" } },
  },

  ////////////////////////
  // Subdomains Pagination
  ////////////////////////
  {
    id: "subdomains-pagination",
    query: `
query SubdomainsPagination($first: Int!, $after: String) {
  domain(by: { name: "eth" }) {
    canonical { name { interpreted } }

    # paginate child names: pass pageInfo.endCursor back as $after for the next page
    subdomains(first: $first, after: $after) {
      totalCount
      pageInfo { hasNextPage endCursor }
      edges {
        cursor
        node {
          canonical { name { interpreted } }
        }
      }
    }
  }
}`,
    variables: { default: { first: 10, after: null } },
  },

  /////////////////
  // Domain Events
  /////////////////
  {
    id: "domain-events",
    query: `
query DomainEvents($name: InterpretedName!) {
  domain(by: {name: $name}) {
    events {
      totalCount
      edges {
        node {
          from
          to
          topics
          data
          timestamp
          transactionHash
        }
      }
    }
  }
}`,
    variables: {
      default: { name: "newowner.eth" },
      [ENSNamespaceIds.SepoliaV2]: { name: "sfmonicdebmig.eth" },
    },
  },

  ////////////////////
  // Account Domains
  ////////////////////
  {
    id: "domains-by-address",
    query: `
query AccountDomains(
  $address: Address!
) {
  account(by: { address: $address }) {
    domains {
      edges {
        node {
          label { interpreted }
          canonical { name { interpreted beautified } }
        }
      }
    }
  }
}`,
    variables: {
      default: { address: VITALIK_ADDRESS },
      [ENSNamespaceIds.EnsTestEnv]: { address: accounts.owner.address },
      [ENSNamespaceIds.SepoliaV2]: { address: SEPOLIA_V2_ADDRESS_WITH_LOT_OF_NAMES },
    },
  },

  ////////////////////
  // Account Events
  ////////////////////
  {
    id: "account-events",
    query: `
query AccountEvents(
  $address: Address!
) {
  account(by: { address: $address }) {
    events { totalCount edges { node { topics data timestamp } } }
  }
}`,
    variables: {
      default: { address: VITALIK_ADDRESS },
      [ENSNamespaceIds.EnsTestEnv]: { address: accounts.deployer.address },
      [ENSNamespaceIds.SepoliaV2]: { address: SEPOLIA_V2_ADDRESS_WITH_LOT_OF_NAMES },
    },
  },

  /////////////////////
  // Registry Domains
  /////////////////////
  {
    id: "registry-domains",
    query: `
query RegistryDomains(
  $registry: AccountIdInput!
) {
  registry(by: { contract: $registry }) {
    domains {
      edges {
        node {
          label { interpreted }
          canonical { name { interpreted beautified } }
        }
      }
    }
  }
}`,
    variables: {
      // TODO: this only accesses v2 registries, so we default to ens-test-env for now
      default: { registry: ENS_TEST_ENV_V2_ETH_REGISTRY },
      [ENSNamespaceIds.SepoliaV2]: { registry: SEPOLIA_V2_V2_ETH_REGISTRY },
    },
  },

  ////////////////////////////
  // Permissions By Contract
  ////////////////////////////
  {
    id: "permissions-by-contract",
    query: `
query PermissionsByContract(
  $contract: AccountIdInput!
) {
  permissions(by: { contract: $contract }) {
    resources {
      edges {
        node {
          resource
          users {
            edges {
              node {
                id
                user { address }
                roles
              }
            }
          }
        }
      }
    }
    events { totalCount edges { node { topics data timestamp } } }
  }
}`,
    variables: {
      // TODO: same as above
      default: { contract: ENS_TEST_ENV_V2_ETH_REGISTRAR },
      // TODO: example response is empty for this address on Sepolia V2
      [ENSNamespaceIds.SepoliaV2]: { contract: SEPOLIA_V2_V2_ETH_REGISTRAR },
    },
  },

  ////////////////////////
  // Permissions By User
  ////////////////////////
  {
    id: "permissions-by-user",
    query: `
query PermissionsByUser($address: Address!) {
  account(by: { address: $address }) {
    permissions {
      edges {
        node {
          resource
          roles
        }
      }
    }
  }
}`,
    variables: {
      default: { address: accounts.deployer.address },
      // TODO: example response is empty for this address on Sepolia V2
      [ENSNamespaceIds.SepoliaV2]: { address: SEPOLIA_V2_ADDRESS_WITH_LOT_OF_NAMES },
    },
  },

  //////////////////////////////////
  // Account Resolver Permissions
  //////////////////////////////////
  {
    id: "account-resolver-permissions",
    query: `
query AccountResolverPermissions($address: Address!) {
  account(by: { address: $address }) {
    resolverPermissions {
      edges {
        node {
          resolver {
            contract {
              address
            }
          }
        }
      }
    }
  }
}`,
    variables: {
      default: { address: accounts.deployer.address },
      [ENSNamespaceIds.SepoliaV2]: { address: SEPOLIA_V2_ADDRESS_WITH_LOT_OF_NAMES },
    },
  },

  //////////////////////////////
  // Domain's Assigned Resolver
  //////////////////////////////
  {
    id: "domain-resolver",
    query: `
query DomainResolver($name: InterpretedName!) {
  domain(by: { name: $name }) {
    resolver {
      assigned {
        records { edges { node { node keys coinTypes } } }
        permissions { resources { edges { node { resource users { edges { node { user { address } roles } } } } } } }
        events { totalCount edges { node { topics data timestamp } } }
      }
    }
  }
}`,
    variables: {
      default: { name: "vitalik.eth" },
      [ENSNamespaceIds.EnsTestEnv]: { name: DEVNET_NAME_WITH_OWNED_RESOLVER },
      [ENSNamespaceIds.SepoliaV2]: { name: SEPOLIA_V2_NAME_WITH_OWNED_RESOLVER },
    },
  },

  ////////////////////////
  // Resolver By Address
  ////////////////////////
  {
    id: "resolver-by-address",
    query: `
query ResolverByAddress($contract: AccountIdInput!) {
  resolver(by: { contract: $contract }) {
    id
    contract { chainId address }

    # records this resolver stores, keyed by node
    records(first: 5) {
      totalCount
      edges {
        node {
          node
          name
          keys
          coinTypes
        }
      }
    }

    events { totalCount edges { node { topics data timestamp } } }
  }
}`,
    variables: {
      default: { contract: MAINNET_PUBLIC_RESOLVER },
      [ENSNamespaceIds.SepoliaV2]: { contract: SEPOLIA_V2_PUBLIC_RESOLVER },
    },
  },

  //////////////
  // Namegraph
  //////////////
  {
    id: "namegraph",
    query: `
query Namegraph {
  root {
    id
    domains {
      edges {
        node {
          canonical { name { interpreted beautified } }

          subdomains {
            edges {
              node {
                canonical { name { interpreted beautified } }

                subdomains {
                  edges {
                    node {
                      canonical { name { interpreted beautified } }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
}`,
    variables: { default: {} },
  },
];

const graphqlApiExampleQueryById = new Map(
  GRAPHQL_API_EXAMPLE_QUERIES.map((entry) => [entry.id, entry]),
);
