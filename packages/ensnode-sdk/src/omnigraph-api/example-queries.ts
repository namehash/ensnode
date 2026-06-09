import { asInterpretedName, toNormalizedAddress } from "enssdk";

import { DatasourceNames, ENSNamespaceIds } from "@ensnode/datasources";
import { accounts } from "@ensnode/integration-test-env/devnet";

import { getDatasourceContract } from "../shared/datasource-contract";
import type { NamespaceSpecificValue } from "../shared/namespace-specific-value";

const SEPOLIA_V2_V2_ETH_REGISTRY = getDatasourceContract(
  ENSNamespaceIds.SepoliaV2,
  DatasourceNames.ENSv2Root,
  "ETHRegistry",
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

// rich sepolia-v2 account: owns several named .eth domains (roppp/wrapnation/katrenpadu),
// holds ETHRegistry (EnhancedAccessControl) + resolver permissions, and has event history
const SEPOLIA_V2_ACCOUNT = toNormalizedAddress("0x801d2e48d378f161dba7ad7ad002ad557714c191");

// the sepolia-v2 ENSv2 admin/controller account; the only indexed account holding both
// ENSv1 (legacy) and ENSv2 names, so it best illustrates the v1→v2 migration split
const SEPOLIA_V2_ACCOUNT_WITH_V1_AND_V2 = toNormalizedAddress(
  "0xffffffffff52d316b7bd028358089bc8066b8f80",
);

const DEVNET_NAME_WITH_OWNED_RESOLVER = asInterpretedName("example.eth");

const SEPOLIA_V2_NAME = asInterpretedName("roppp.eth");

const VITALIK_NAME = asInterpretedName("vitalik.eth");

const GREG_NAME = asInterpretedName("gregskril.eth");

const GREG_ADDRESS = toNormalizedAddress("0x179a862703a4adfb29896552df9e307980d19285");

const MAINNET_PUBLIC_RESOLVER = getDatasourceContract(
  ENSNamespaceIds.Mainnet,
  DatasourceNames.ReverseResolverRoot,
  "DefaultPublicResolver5",
);

// a sepolia-v2 resolver with indexed records (the DefaultPublicResolver5 has none indexed)
const SEPOLIA_V2_RESOLVER_WITH_RECORDS = {
  chainId: 11155111,
  address: toNormalizedAddress("0x8fade66b79cc9f707ab26799354482eb93a5b7dd"),
};

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
    query: `query HelloWorld($address: Address!) {
  # Lookup an Account by address.
  account(by: { address: $address }) {
    resolve {
      # Reverse resolve the ENS primary name of the account
      # using a convenient ETHEREUM alias for mainnet.
      primaryName(by: { chainName: ETHEREUM }) {
        # Get the regular interpreted variant of the primary name 
        # and also the special beautified variant that optimizes names 
        # containing special characters such as emojis for proper display in interfaces.
        name { interpreted beautified }
        resolve {
          # If the account has a primary name on Ethereum (mainnet),
          # forward resolve the interpreted ENS profile of that name in the same query!.
          profile {
            description
            avatar { httpUrl }
            addresses { ethereum bitcoin }
            socials {
              twitter { handle httpUrl }
              github { handle httpUrl }
            }
          }
        }
      }
    }

    # Also load the count of ENSv1 and ENSv2 domains owned by the account
    # to see if they have domains they should upgrade to ENSv2
    v1DomainsCount: domains(where: { version: ENSv1 }) { totalCount }
    v2DomainsCount: domains(where: { version: ENSv2 }) { totalCount }
  }
}`,
    variables: {
      default: { address: VITALIK_ADDRESS },
      [ENSNamespaceIds.EnsTestEnv]: { address: accounts.owner.address },
      [ENSNamespaceIds.SepoliaV2]: { address: SEPOLIA_V2_ACCOUNT_WITH_V1_AND_V2 },
    },
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
        name: { starts_with: "sf" },
        order: { by: "NAME", dir: "DESC" },
      },
    },
  },

  {
    id: "domain-by-name",
    query: `
query DomainByName($name: InterpretedName!) {
  domain(by: { name: $name }) {
    canonical { name { beautified } }
    owner { address }
    resolve {
      profile {
        description
        addresses {
          ethereum
        }
      }
    }
  }
}`,
    variables: {
      default: { name: "eth" },
      [ENSNamespaceIds.SepoliaV2]: { name: SEPOLIA_V2_NAME },
      [ENSNamespaceIds.Mainnet]: { name: VITALIK_NAME },
    },
  },

  ////////////////////////////////
  // Domain By Name Type Condition
  ////////////////////////////////
  {
    id: "domain-by-name-type-condition",
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
      [ENSNamespaceIds.SepoliaV2]: { name: SEPOLIA_V2_NAME },
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
      default: { name: VITALIK_NAME },
      [ENSNamespaceIds.SepoliaV2]: { name: SEPOLIA_V2_NAME },
    },
  },

  ////////////////////
  // Domain Records
  ////////////////////
  {
    id: "domain-records",
    query: `
query DomainRecords($name: InterpretedName!) {
  domain(by: {name: $name}) {
    canonical {
      name {
        interpreted
      }
    }
    resolve {
      records {
        addresses(coinTypes: [60, 2147483658, 501]) {
          coinType
          address
        }
        texts(keys: ["description", "avatar", "url", "com.github", "com.twitter"]) {
          key
          value
        }
        contenthash
      }
    }
  }
}`,
    variables: {
      default: { name: GREG_NAME },
      [ENSNamespaceIds.EnsTestEnv]: {
        name: DEVNET_NAME_WITH_OWNED_RESOLVER,
      },
      [ENSNamespaceIds.SepoliaV2]: {
        name: SEPOLIA_V2_NAME,
      },
    },
  },

  {
    id: "domain-profile",
    query: `
query DomainProfile($name: InterpretedName!) {
  domain(by: {name: $name}) {
    resolve {
      profile {
        description
        avatar {
          httpUrl
        }
        addresses {
          ethereum
          base
          solana
          bitcoin
          rootstock
        }
        socials {
          github {
            handle
            httpUrl
          }
          twitter {
            handle
            httpUrl
          }
        }
        website {
          httpUrl
        }
        header {
          httpUrl
        }
      }
    }
  }
}`,
    variables: { default: { name: GREG_NAME } },
  },

  {
    id: "domain-profile-and-records",
    query: `
query DomainProfileAndRecords($name: InterpretedName!) {
  domain(by: { name: $name }) {
    resolve {
      profile {
        avatar {
          httpUrl
        }
        addresses {
          ethereum
          solana
        }
        socials {
          github {
            handle
            httpUrl
          }
          twitter {
            handle
            httpUrl
          }
        }
        website {
          httpUrl
        }
      }
      records {
        addresses(coinTypes: [60, 501]) {
          coinType
          address
        }
        texts(keys: ["avatar", "com.twitter", "com.github", "url"]) {
          key
          value
        }
      }
    }
  }
}`,
    variables: { default: { name: GREG_NAME } },
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
    subdomains(first: 10, order: {
       by: NAME,
       dir: ASC
    }) {
      edges {
        node {
          canonical { name { interpreted beautified } }
        }
      }
    }
  }
}`,
    variables: {
      default: { name: "eth" },
      // in mainnet there is too many subdomains of eth
      [ENSNamespaceIds.Mainnet]: { name: "base.eth" },
    },
  },

  ////////////////////////////////////
  // Most Recently Registered Subdomains
  ////////////////////////////////////
  {
    id: "domain-subdomains-recently-registered",
    query: `
query RecentlyRegisteredSubdomains($name: InterpretedName!) {
  domain(by: {name: $name}) {
    canonical { name { interpreted beautified } }
    subdomains(first: 10, order: {by: REGISTRATION_TIMESTAMP, dir: DESC}) {
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
      [ENSNamespaceIds.SepoliaV2]: { name: SEPOLIA_V2_NAME },
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
      [ENSNamespaceIds.SepoliaV2]: { address: SEPOLIA_V2_ACCOUNT },
    },
  },

  /////////////////////////
  // Account Primary Names
  /////////////////////////
  {
    id: "account-primary-names",
    query: `
query AccountPrimaryNames($address: Address!) {
  account(by: { address: $address }) {
    address
    resolve {
      onePrimaryName: primaryName(by: { chainName: OPTIMISM }) {
        chainName
        name { interpreted beautified }
      }

      twoPrimaryNames: primaryNames(where: { chainNames: [ETHEREUM, BASE] }) {
        chainName
        name { interpreted beautified }
      }
    }
  }
}`,
    variables: {
      default: { address: GREG_ADDRESS },
      [ENSNamespaceIds.EnsTestEnv]: { address: accounts.owner.address },
      [ENSNamespaceIds.SepoliaV2]: { address: SEPOLIA_V2_ACCOUNT },
    },
  },
  {
    id: "account-primary-name-records",
    query: `
query AccountPrimaryNameRecords($address: Address!) {
  account(by: { address: $address }) {
    address
    resolve {
      primaryName(by: { chainName: ETHEREUM }) {
        name { interpreted beautified }
        resolve {
          profile {
            description
            socials {
              twitter {
                httpUrl
              }
            }
          }
        }
      }
    }
  }
}`,
    variables: {
      default: { address: VITALIK_ADDRESS },
      [ENSNamespaceIds.EnsTestEnv]: { address: accounts.owner.address },
      [ENSNamespaceIds.SepoliaV2]: { address: SEPOLIA_V2_ACCOUNT },
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
      [ENSNamespaceIds.SepoliaV2]: { address: SEPOLIA_V2_ACCOUNT },
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
      // the ETHRegistrar holds no EAC permissions on sepolia-v2; the ETHRegistry does
      [ENSNamespaceIds.SepoliaV2]: { contract: SEPOLIA_V2_V2_ETH_REGISTRY },
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
      [ENSNamespaceIds.SepoliaV2]: { address: SEPOLIA_V2_ACCOUNT },
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
      [ENSNamespaceIds.SepoliaV2]: { address: SEPOLIA_V2_ACCOUNT },
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
        contract {
          address
        }
        events(first: 5) {
          edges { node { topics data timestamp } }
        }
      }
    }
  }
}`,
    variables: {
      default: { name: VITALIK_NAME },
      [ENSNamespaceIds.EnsTestEnv]: { name: DEVNET_NAME_WITH_OWNED_RESOLVER },
      [ENSNamespaceIds.SepoliaV2]: { name: SEPOLIA_V2_NAME },
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
      [ENSNamespaceIds.SepoliaV2]: { contract: SEPOLIA_V2_RESOLVER_WITH_RECORDS },
    },
  },

  //////////////
  // Namegraph
  //////////////
  {
    id: "namegraph",
    query: `
query Namegraph {
  domain(by: { name: "eth" }) {
    registry { id contract { chainId address } }
    parent { id }
    subregistry {
      domains {
        edges {
          node {
            canonical { name { beautified } }
          }
        }
      }
    }
    subdomains { edges { node { canonical { name { beautified } } } } }
  }
}`,
    variables: { default: {} },
  },

  /////////////////////////////
  // ENSv1 → ENSv2 Migration
  /////////////////////////////
  {
    id: "account-migrated-names",
    query: `
query AccountMigratedNames($address: Address!) {
  account(by: { address: $address }) {
    v1DomainsCount: domains(where: { version: ENSv1 }) { totalCount }
    v2DomainsCount: domains(where: { version: ENSv2 }) { totalCount }
  }
}`,
    variables: {
      default: { address: VITALIK_ADDRESS },
      [ENSNamespaceIds.SepoliaV2]: { address: SEPOLIA_V2_ACCOUNT_WITH_V1_AND_V2 },
    },
  },
  {
    id: "eth-by-version",
    query: `
query GetEthDomains {
  domains(where: { name: { eq: "eth" } }) {
    edges {
      node {
        __typename
        id
      }
    }
  }
}`,
    variables: { default: {} },
  },
  {
    id: "accelerate-resolve",
    query: `
query AccelerateResolve($address: Address!) {
  account(by: { address: $address }) {
    address
    resolve(accelerate: true) {
      trace
      acceleration {
        requested
        attempted
      }
      primaryName(by: { chainName: ETHEREUM }) {
        name { interpreted beautified }
        resolve {
          trace
          acceleration {
            requested
            attempted
          }
          profile {
            description
          }
        }
      }
    }
  }
}`,
    variables: {
      default: { address: VITALIK_ADDRESS },
      [ENSNamespaceIds.EnsTestEnv]: { address: accounts.owner.address },
      [ENSNamespaceIds.SepoliaV2]: { address: SEPOLIA_V2_ACCOUNT_WITH_V1_AND_V2 },
    },
  },
];

const graphqlApiExampleQueryById = new Map(
  GRAPHQL_API_EXAMPLE_QUERIES.map((entry) => [entry.id, entry]),
);
