import { DatasourceNames, ENSNamespaceIds, ensTestEnvChain } from "@ensnode/datasources";

import { getDatasourceContract, maybeGetDatasourceContract } from "../shared/datasource-contract";
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

// these addresses are from the devnet accounts output
const DEVNET_DEPLOYER = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";
const DEVNET_OWNER = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8";
// biome-ignore lint/correctness/noUnusedVariables: keeping it around for the future
const DEVNET_USER = "0x90F79bf6EB2c4f870365E785982E1f101E93b906";

// NOTE: this is an OwnedResolver deployed in the devnet
const SOME_OWNED_RESOLVER = "0x125eE1aeF73e9ef9Bc167eD86A0dC4c139ce5E35";

const VITALIK_ADDRESS = "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045";

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
  root { id }
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
    },
  },

  ///////////////////
  // Domain By Name
  ///////////////////
  {
    query: `
query DomainByName($name: Name!) {
  domain(by: {name: $name}) {
    __typename
    id
    label { interpreted }
    name

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
    variables: { default: { name: "eth" } },
  },

  //////////////////////
  // Domain Subdomains
  //////////////////////
  {
    query: `
query DomainSubdomains($name: Name!) {
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
query DomainEvents($name: Name!) {
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
    variables: { default: { name: "newowner.eth" } },
  },

  ////////////////////
  // Account Domains
  ////////////////////
  {
    query: `
query AccountDomains(
  $address: Address!
) {
  account(address: $address) {
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
      [ENSNamespaceIds.EnsTestEnv]: { address: DEVNET_OWNER },
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
  account(address: $address) {
    events { totalCount edges { node { topics data timestamp } } }
  }
}`,
    variables: {
      default: { address: VITALIK_ADDRESS },
      [ENSNamespaceIds.EnsTestEnv]: { address: DEVNET_DEPLOYER },
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
  permissions(for: $contract) {
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
  account(address: $address) {
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
      default: { address: DEVNET_DEPLOYER },
      // TODO: figure out a good sepolia-v2 user address
      // [ENSNamespaceIds.SepoliaV2]: { address: "" },
    },
  },

  //////////////////////////////////
  // Account Resolver Permissions
  //////////////////////////////////
  {
    query: `
query AccountResolverPermissions($address: Address!) {
  account(address: $address) {
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
      default: { address: DEVNET_DEPLOYER },
      // TODO: figure out a good sepolia-v2 user address
      // [ENSNamespaceIds.SepoliaV2]: { address: "" },
    },
  },

  ////////////////////////
  // Resolver by Contract
  ////////////////////////
  {
    query: `
query Resolver($resolver: AccountIdInput!) {
  resolver(by: { contract: $resolver }) {
    permissions { resources { edges { node { resource users { edges { node { user { address } roles } } } } } } }
    events { totalCount edges { node { topics data timestamp } } }
  }
}`,
    variables: {
      default: {
        resolver: getDatasourceContract(
          ENSNamespaceIds.Mainnet,
          DatasourceNames.ReverseResolverRoot,
          "DefaultPublicResolver5",
        ),
      },
      [ENSNamespaceIds.Sepolia]: {
        resolver: getDatasourceContract(
          ENSNamespaceIds.Sepolia,
          DatasourceNames.ReverseResolverRoot,
          "DefaultPublicResolver5",
        ),
      },
      [ENSNamespaceIds.SepoliaV2]: {
        resolver: getDatasourceContract(
          ENSNamespaceIds.SepoliaV2,
          DatasourceNames.ReverseResolverRoot,
          "DefaultPublicResolver5",
        ),
      },
      [ENSNamespaceIds.EnsTestEnv]: {
        resolver: {
          chainId: ensTestEnvChain.id,
          address: SOME_OWNED_RESOLVER,
        },
      },
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
