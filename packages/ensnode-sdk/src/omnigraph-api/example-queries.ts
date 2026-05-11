import { asInterpretedName, toNormalizedAddress } from "enssdk";

import { DatasourceNames, ENSNamespaceIds } from "@ensnode/datasources";

import { maybeGetDatasourceContract } from "../shared/datasource-contract";
import { DevnetAccounts } from "../shared/devnet-accounts";
import type { NamespaceSpecificValue } from "../shared/namespace-specific-value";

const SEPOLIA_V2_V2_ETH_REGISTRY = maybeGetDatasourceContract(
  ENSNamespaceIds.SepoliaV2,
  DatasourceNames.ENSv2Root,
  "ETHRegistry",
);

const SEPOLIA_V2_V2_ETH_REGISTRAR = maybeGetDatasourceContract(
  ENSNamespaceIds.SepoliaV2,
  DatasourceNames.ENSv2Root,
  "ETHRegistrar",
);

const ENS_TEST_ENV_V2_ETH_REGISTRY = maybeGetDatasourceContract(
  ENSNamespaceIds.EnsTestEnv,
  DatasourceNames.ENSv2Root,
  "ETHRegistry",
);

const ENS_TEST_ENV_V2_ETH_REGISTRAR = maybeGetDatasourceContract(
  ENSNamespaceIds.EnsTestEnv,
  DatasourceNames.ENSv2Root,
  "ETHRegistrar",
);

const VITALIK_ADDRESS = toNormalizedAddress("0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045");

// owns sfmonicdeb*.eth (mix of v1 + v2) on sepolia-v2 and holds v2 ETHRegistry permissions
const SEPOLIA_V2_USER_ADDRESS = toNormalizedAddress("0x2f8e8b1126e75fde0b7f731e7cb5847eba2d2574");

const DEVNET_NAME_WITH_OWNED_RESOLVER = asInterpretedName("example.eth");

const SEPOLIA_V2_NAME_WITH_OWNED_RESOLVER = asInterpretedName("sfmonicdebmig.eth");

export const GRAPHQL_API_EXAMPLE_QUERIES: Array<{
  query: string;
  variables: NamespaceSpecificValue<Record<string, unknown>>;
}> = [
  ////////////////
  // Hello World
  ////////////////
  {
    query: `#
# Welcome to this interactive playground for
# ENSNode's GraphQL API!
#
# You can get started by typing your query here or by using
# the Explorer on the left to select the data you want to query.
#
# There are also example queries in the tabs above ☝️
query HelloWorld {
  domain(by: { name: "eth" }) { name owner { address } }
}`,
    variables: { default: {} },
  },

  /////////////////
  // Find Domains
  /////////////////
  {
    query: `
query FindDomains(
  $name: String!
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
        name

        registration { expiry event { timestamp } }
      }
    }
  }
}`,
    variables: {
      default: { name: "vitalik", order: { by: "NAME", dir: "DESC" } },
      [ENSNamespaceIds.EnsTestEnv]: { name: "c", order: { by: "NAME", dir: "DESC" } },
      [ENSNamespaceIds.SepoliaV2]: { name: "sfmonic", order: { by: "NAME", dir: "DESC" } },
    },
  },

  ///////////////////
  // Domain By Name
  ///////////////////
  {
    query: `
query DomainByName($name: InterpretedName!) {
  domain(by: {name: $name}) {
    __typename
    id
    label { interpreted hash }
    name
    owner { address }

    ... on ENSv1Domain {
      rootRegistryOwner { address }
    }

    ... on ENSv2Domain {
      subregistry {
        contract { chainId address }
      }
    }
  }
}`,
    variables: {
      default: { name: "eth" },
      [ENSNamespaceIds.SepoliaV2]: { name: "sfmonicdebmig.eth" },
    },
  },

  //////////////////////
  // Domain Subdomains
  //////////////////////
  {
    query: `
query DomainSubdomains($name: InterpretedName!) {
  domain(by: {name: $name}) {
    name
    subdomains(first: 10) {
      edges {
        node {
          name
        }
      }
    }
  }
}`,
    variables: { default: { name: "eth" } },
  },

  /////////////////
  // Domain Events
  /////////////////
  {
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
    query: `
query AccountDomains(
  $address: Address!
) {
  account(by: { address: $address }) {
    domains {
      edges {
        node {
          label { interpreted }
          name
        }
      }
    }
  }
}`,
    variables: {
      default: { address: VITALIK_ADDRESS },
      [ENSNamespaceIds.EnsTestEnv]: { address: DevnetAccounts.owner.address },
      [ENSNamespaceIds.SepoliaV2]: { address: SEPOLIA_V2_USER_ADDRESS },
    },
  },

  ////////////////////
  // Account Events
  ////////////////////
  {
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
      [ENSNamespaceIds.EnsTestEnv]: { address: DevnetAccounts.deployer.address },
      [ENSNamespaceIds.SepoliaV2]: { address: SEPOLIA_V2_USER_ADDRESS },
    },
  },

  /////////////////////
  // Registry Domains
  /////////////////////
  {
    query: `
query RegistryDomains(
  $registry: AccountIdInput!
) {
  registry(by: { contract: $registry }) {
    domains {
      edges {
        node {
          label { interpreted }
          name
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
      [ENSNamespaceIds.SepoliaV2]: { contract: SEPOLIA_V2_V2_ETH_REGISTRAR },
    },
  },

  ////////////////////////
  // Permissions By User
  ////////////////////////
  {
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
      default: { address: DevnetAccounts.deployer.address },
      [ENSNamespaceIds.SepoliaV2]: { address: SEPOLIA_V2_USER_ADDRESS },
    },
  },

  //////////////////////////////////
  // Account Resolver Permissions
  //////////////////////////////////
  {
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
      default: { address: DevnetAccounts.deployer.address },
      [ENSNamespaceIds.SepoliaV2]: { address: SEPOLIA_V2_USER_ADDRESS },
    },
  },

  //////////////////////////////
  // Domain's Assigned Resolver
  //////////////////////////////
  {
    query: `
query DomainResolver($name: InterpretedName!) {
  domain(by: { name: $name }) {
    resolver {
      records { edges { node { node keys coinTypes } } }
      permissions { resources { edges { node { resource users { edges { node { user { address } roles } } } } } } }
      events { totalCount edges { node { topics data timestamp } } }
    }
  }
}`,
    variables: {
      default: { name: "vitalik.eth" },
      [ENSNamespaceIds.EnsTestEnv]: { name: DEVNET_NAME_WITH_OWNED_RESOLVER },
      [ENSNamespaceIds.SepoliaV2]: { name: SEPOLIA_V2_NAME_WITH_OWNED_RESOLVER },
    },
  },

  //////////////
  // Namegraph
  //////////////
  {
    query: `
query Namegraph {
  root {
    id
    domains {
      edges {
        node {
          name

          subdomains {
            edges {
              node {
                name

                subdomains {
                  edges {
                    node {
                      name
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
