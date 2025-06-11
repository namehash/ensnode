import { type SavedQuery, SubgraphGraphiQLEditor } from "@/components/graphiql-editor";
import { defaultEnsNodeUrl } from "@/lib/env";

type PageProps = {
  searchParams: Promise<{
    [key: string]: string | string[] | undefined;
  }>;
};

const savedQueries = [
  {
    operationName: "getDomains",
    id: "1",
    name: "Get Latest Domains",
    category: "Domain",
    query: `query GetLatestDomains($first: Int!) {
  domains(orderBy: createdAt, orderDirection: desc, first: $first) {
    name
    expiryDate
  }
}
    `,
    variables: JSON.stringify(
      {
        first: 5,
      },
      null,
      2,
    ),
  },
  {
    operationName: "getDomainByNamehash",
    id: "2",
    name: "Get Domain by Namehash",
    category: "Domain",
    query: `query GetDomainByNamehash($id: String!) {
  domain(id: $id) {
    name
    labelName
    labelhash
    createdAt
    expiryDate
  }
}
    `,
    variables: JSON.stringify(
      {
        id: "0x4e34d3a81dc3a20f71bbdf2160492ddaa17ee7e5523757d47153379c13cb46df", // ens.eth
      },
      null,
      2,
    ),
  },
  {
    operationName: "getDomainByName",
    id: "2a",
    name: "Get Domain by Name",
    category: "Domain",
    query: `query GetDomainByName($ensName: String!) {
  domains(where: {name: $ensName}) {
    id
    name
    labelName
    labelhash
    createdAt
    expiryDate
  }
}
    `,
    variables: JSON.stringify(
      {
        id: "ens.eth",
      },
      null,
      2,
    ),
  },
  {
    operationName: "getDomainByLabel",
    id: "2c",
    name: "Get Domain by Label substring",
    category: "Domain",
    query: `query GetDomainByLabel($label: String!) {
  domains(where: {labelName_contains: $label}) {
    id
    name
    labelName
    labelhash
    createdAt
    expiryDate
  }
}
    `,
    variables: JSON.stringify(
      {
        label: "ens",
      },
      null,
      2,
    ),
  },
  {
    operationName: "getDomainByLabelhash",
    id: "3",
    name: "Get Label by Labelhash",
    category: "Label",
    query: `query GetLabelByLabelhash($labelhash: String!) {
  domains(first: 1, where: { labelhash: $labelhash, labelName_not: null }) {
    labelName
  }
}
    `,
    variables: JSON.stringify(
      {
        labelhash: "0x5cee339e13375638553bdf5a6e36ba80fb9f6a4f0783680884d92b558aa471da", // ens
      },
      null,
      2,
    ),
  },
  {
    operationName: "getNameHistory",
    id: "4",
    name: "Get Complete Name History",
    category: "Domain",
    query: `query GetNameHistory($id: String!) {
  domain(id: $id) {
    name
    events {
      id
      blockNumber
      transactionID
      type: __typename
      ... on Transfer {
        owner {
          id
        }
      }
      ... on NewOwner {
        owner {
          id
        }
      }
      ... on NewResolver {
        resolver {
          id
        }
      }
      ... on NewTTL {
        ttl
      }
      ... on WrappedTransfer {
        owner {
          id
        }
      }
      ... on NameWrapped {
        fuses
        expiryDate
        owner {
          id
        }
      }
      ... on NameUnwrapped {
        owner {
          id
        }
      }
      ... on FusesSet {
        fuses
      }
      ... on ExpiryExtended {
        expiryDate
      }
    }
    registration {
      events {
        id
        blockNumber
        transactionID
        type: __typename
        ... on NameRegistered {
          registrant {
            id
          }
          expiryDate
        }
        ... on NameRenewed {
          expiryDate
        }
        ... on NameTransferred {
          newOwner {
            id
          }
        }
      }
    }
    resolver {
      events {
        id
        blockNumber
        transactionID
        type: __typename
        ... on AddrChanged {
          addr {
            id
          }
        }
        ... on MulticoinAddrChanged {
          coinType
          multiaddr: addr
        }
        ... on NameChanged {
          name
        }
        ... on TextChanged {
          key
          value
        }
        ... on ContenthashChanged {
          hash
        }
      }
    }
  }
}
    `,
    variables: JSON.stringify(
      {
        id: "0x4e34d3a81dc3a20f71bbdf2160492ddaa17ee7e5523757d47153379c13cb46df", // ens.eth
      },
      null,
      2,
    ),
  },
  {
    operationName: "getDomainEvents",
    id: "5",
    name: "Get Domain Events Only",
    category: "Domain",
    //events(orderBy: blockNumber, orderDirection: desc) is not working
    query: `query GetDomainEvents($id: String!) {
  domain(id: $id) {
    name
    events {
      id
      blockNumber
      transactionID
      type: __typename
      ... on Transfer {
        owner {
          id
        }
      }
      ... on NewOwner {
        owner {
          id
        }
      }
      ... on NewResolver {
        resolver {
          id
        }
      }
      ... on NameWrapped {
        fuses
        expiryDate
        owner {
          id
        }
      }
    }
  }
}
    `,
    variables: JSON.stringify(
      {
        id: "0x4e34d3a81dc3a20f71bbdf2160492ddaa17ee7e5523757d47153379c13cb46df", // ens.eth
      },
      null,
      2,
    ),
  },
  {
    operationName: "getResolverEvents",
    id: "6",
    name: "Get Resolver Events Only",
    category: "Resolver",
    //events(orderBy: blockNumber, orderDirection: desc) is not working
    query: `query GetResolverEvents($id: String!) {
  domain(id: $id) {
    name
    resolver {
      events {
        id
        blockNumber
        transactionID
        type: __typename
        ... on AddrChanged {
          addr {
            id
          }
        }
        ... on MulticoinAddrChanged {
          coinType
          multiaddr: addr
        }
        ... on TextChanged {
          key
          value
        }
        ... on ContenthashChanged {
          hash
        }
        ... on NameChanged {
          name
        }
      }
    }
  }
}
    `,
    variables: JSON.stringify(
      {
        id: "0x4e34d3a81dc3a20f71bbdf2160492ddaa17ee7e5523757d47153379c13cb46df", // ens.eth
      },
      null,
      2,
    ),
  },
  {
    operationName: "getNamesForAddress",
    id: "7",
    name: "Get Names for Address (All Relations)",
    category: "Account",
    query: `query GetNamesForAddress($owner: String!, $first: Int!, $orderBy: Domain_orderBy!, $orderDirection: OrderDirection!, $date: BigInt!) {
  domains(
    where: {
      or: [
        { owner: $owner }
        { registrant: $owner }
        { wrappedOwner: $owner }
        { resolvedAddress: $owner }
      ]
      and: [
        # Exclude domains with parent addr.reverse
        # namehash of addr.reverse = 0x91d1777781884d03a6757a803996e38de2a42967fb37eeaca72729271025a9e2
        { parent_not: "0x91d1777781884d03a6757a803996e38de2a42967fb37eeaca72729271025a9e2" }
        {
          or: [
            { expiryDate_gt: $date }
            { expiryDate: null }
          ]
        }
      ]
    }
    orderBy: $orderBy
    orderDirection: $orderDirection
    first: $first
  ) {
    id
    name
    labelName
    createdAt
    expiryDate
    owner {
      id
    }
    registrant {
      id
    }
    wrappedOwner {
      id
    }
    resolvedAddress {
      id
    }
    registration {
      registrationDate
      expiryDate
    }
  }
}
    `,
    variables: JSON.stringify(
      {
        owner: "0xfe89cc7abb2c4183683ab71653c4cdc9b02d44b7", // ENS: DAO Wallet
        first: 10,
        orderBy: "name",
        orderDirection: "asc",
        date: Math.floor(Date.now() / 1000),
      },
      null,
      2,
    ),
  },
  {
    operationName: "getOwnedNames",
    id: "8",
    name: "Get Owned Names Only",
    category: "Account",
    query: `query GetOwnedNames($owner: String!, $first: Int!, $date: BigInt!) {
  domains(
    where: {
      owner: $owner
      # Exclude domains with parent addr.reverse
      # namehash of addr.reverse = 0x91d1777781884d03a6757a803996e38de2a42967fb37eeaca72729271025a9e2
      parent_not: "0x91d1777781884d03a6757a803996e38de2a42967fb37eeaca72729271025a9e2"
      or: [
        { expiryDate_gt: $date }
        { expiryDate: null }
      ]
    }
    orderBy: name
    orderDirection: asc
    first: $first
  ) {
    id
    name
    labelName
    createdAt
    expiryDate
    owner {
      id
    }
    resolver {
      id
    }
  }
}
    `,
    variables: JSON.stringify(
      {
        owner: "0xfe89cc7abb2c4183683ab71653c4cdc9b02d44b7", // ENS: DAO Wallet
        first: 10,
        date: Math.floor(Date.now() / 1000),
      },
      null,
      2,
    ),
  },
  {
    operationName: "getRegisteredNames",
    id: "9",
    name: "Get Registered Names Only",
    category: "Account",
    query: `query GetRegisteredNames($registrant: String!, $first: Int!, $date: BigInt!) {
  domains(
    where: {
      registrant: $registrant
      # Exclude domains with parent addr.reverse
      # namehash of addr.reverse = 0x91d1777781884d03a6757a803996e38de2a42967fb37eeaca72729271025a9e2
      parent_not: "0x91d1777781884d03a6757a803996e38de2a42967fb37eeaca72729271025a9e2"
      or: [
        { expiryDate_gt: $date }
        { expiryDate: null }
      ]
    }
    orderBy: expiryDate
    orderDirection: desc
    first: $first
  ) {
    id
    name
    labelName
    createdAt
    expiryDate
    registrant {
      id
    }
    registration {
      registrationDate
      expiryDate
      cost
    }
  }
}
    `,
    variables: JSON.stringify(
      {
        registrant: "0xfe89cc7abb2c4183683ab71653c4cdc9b02d44b7", // ENS: DAO Wallet
        first: 10,
        date: Math.floor(Date.now() / 1000),
      },
      null,
      2,
    ),
  },
  {
    operationName: "getNamesIncludingExpired",
    id: "10",
    name: "Get Names Including Expired",
    category: "Account",
    query: `query GetNamesIncludingExpired($owner: String!, $first: Int!) {
  domains(
    where: {
      or: [
        { owner: $owner }
        { registrant: $owner }
        { wrappedOwner: $owner }
      ]
      parent_not: "0x91d1777781884d03a6757a803996e38de2a42967fb37eeaca72729271025a9e2"
    }
    orderBy: expiryDate
    orderDirection: desc
    first: $first
  ) {
    id
    name
    labelName
    createdAt
    expiryDate
    owner {
      id
    }
    registrant {
      id
    }
    wrappedOwner {
      id
    }
    registration {
      expiryDate
    }
  }
}
    `,
    variables: JSON.stringify(
      {
        owner: "0xfe89cc7abb2c4183683ab71653c4cdc9b02d44b7", // ENS: DAO Wallet
        first: 10,
      },
      null,
      2,
    ),
  },
  {
    operationName: "getSubgraphRegistrant",
    id: "11",
    name: "Get Registrant by Labelhash", // works with ENS only?
    category: "Registrar",
    query: `query GetSubgraphRegistrant($id: String!) {
  registration(id: $id) {
    registrant {
      id
    }
    registrationDate
    expiryDate
    cost
    domain {
      name
      labelName
    }
  }
}
    `,
    variables: JSON.stringify(
      {
        id: "0x5cee339e13375638553bdf5a6e36ba80fb9f6a4f0783680884d92b558aa471da", // ens
      },
      null,
      2,
    ),
  },
  {
    operationName: "getSubnames",
    id: "12",
    name: "Get Subdomains",
    category: "Domain",
    query: `query GetSubnames($id: String!, $first: Int!, $orderBy: Domain_orderBy!, $orderDirection: OrderDirection!, $date: BigInt!) {
  domain(id: $id) {
    name
    subdomains(
      orderBy: $orderBy
      orderDirection: $orderDirection
      first: $first
      where: {
        and: [
          {
            or: [
              { expiryDate_gt: $date }
              { expiryDate: null }
            ]
          }
          {
            or: [
              { owner_not: "0x0000000000000000000000000000000000000000" }
              { resolver_not: null }
            ]
          }
        ]
      }
    ) {
      id
      name
      labelName
      createdAt
      expiryDate
      owner {
        id
      }
      resolver {
        id
      }
      registration {
        registrationDate
        expiryDate
      }
    }
  }
}
    `,
    variables: JSON.stringify(
      {
        id: "0x4e34d3a81dc3a20f71bbdf2160492ddaa17ee7e5523757d47153379c13cb46df",
        first: 10,
        orderBy: "name",
        orderDirection: "asc",
        date: Math.floor(Date.now() / 1000),
      },
      null,
      2,
    ),
  },
  {
    operationName: "searchSubnames",
    id: "13",
    name: "Search Subdomains by Label",
    category: "Domain",
    query: `query SearchSubnames($id: String!, $searchString: String!, $first: Int!, $date: BigInt!) {
  domain(id: $id) {
    name
    subdomains(
      orderBy: name
      orderDirection: asc
      first: $first
      where: {
        and: [
          { labelName_contains: $searchString }
          {
            or: [
              { expiryDate_gt: $date }
              { expiryDate: null }
            ]
          }
          {
            or: [
              { owner_not: "0x0000000000000000000000000000000000000000" }
              { resolver_not: null }
            ]
          }
        ]
      }
    ) {
      id
      name
      labelName
      createdAt
      owner {
        id
      }
      resolver {
        id
      }
    }
  }
}
    `,
    variables: JSON.stringify(
      {
        id: "0x4e34d3a81dc3a20f71bbdf2160492ddaa17ee7e5523757d47153379c13cb46df", // ens.eth
        searchString: "test",
        first: 10,
        date: Math.floor(Date.now() / 1000),
      },
      null,
      2,
    ),
  },
  {
    operationName: "getSubnamesIncludingExpired",
    id: "14",
    name: "Get Subdomains Including Expired",
    category: "Domain",
    query: `query GetSubnamesIncludingExpired($id: String!, $first: Int!) {
  domain(id: $id) {
    name
    subdomains(
      orderBy: expiryDate
      orderDirection: desc
      first: $first
      where: {
        or: [
          { owner_not: "0x0000000000000000000000000000000000000000" }
          { resolver_not: null }
        ]
      }
    ) {
      id
      name
      labelName
      createdAt
      expiryDate
      owner {
        id
      }
      resolver {
        id
      }
      registration {
        expiryDate
      }
    }
  }
}
    `,
    variables: JSON.stringify(
      {
        id: "0x4e34d3a81dc3a20f71bbdf2160492ddaa17ee7e5523757d47153379c13cb46df", // ens.eth
        first: 10,
      },
      null,
      2,
    ),
  },
  {
    operationName: "getRecentSubnames",
    id: "15",
    name: "Get Recently Created Subdomains",
    category: "Registrar",
    query: `query GetRecentSubnames($id: String!, $first: Int!, $date: BigInt!) {
  domain(id: $id) {
    name
    subdomains(
      orderBy: createdAt
      orderDirection: desc
      first: $first
      where: {
        and: [
          {
            or: [
              { expiryDate_gt: $date }
              { expiryDate: null }
            ]
          }
          {
            or: [
              { owner_not: "0x0000000000000000000000000000000000000000" }
              { resolver_not: null }
            ]
          }
        ]
      }
    ) {
      id
      name
      labelName
      createdAt
      expiryDate
      owner {
        id
      }
      resolver {
        id
        texts
        coinTypes
      }
    }
  }
}
    `,
    variables: JSON.stringify(
      {
        id: "0x4e34d3a81dc3a20f71bbdf2160492ddaa17ee7e5523757d47153379c13cb46df", // ens.eth
        first: 10,
        date: Math.floor(Date.now() / 1000),
      },
      null,
      2,
    ),
  },
  {
    operationName: "getSubgraphRecords",
    id: "16",
    name: "Get Domain Records (Inherited Resolver)",
    category: "Resolver",
    query: `query GetSubgraphRecords($id: String!) {
  domain(id: $id) {
    name
    isMigrated
    createdAt
    resolver {
      id
      texts
      coinTypes
    }
  }
}
    `,
    variables: JSON.stringify(
      {
        id: "0x4e34d3a81dc3a20f71bbdf2160492ddaa17ee7e5523757d47153379c13cb46df", // ens.eth
      },
      null,
      2,
    ),
  },
  {
    operationName: "getSubgraphRecordsCustomResolver",
    id: "17",
    name: "Get Domain Records (Custom Resolver)",
    category: "Resolver",
    query: `query GetSubgraphRecordsCustomResolver($id: String!, $resolverId: String!) {
  domain(id: $id) {
    name
    isMigrated
    createdAt
  }
  resolver(id: $resolverId) {
    id
    texts
    coinTypes
    domain {
      name
    }
  }
}
    `,
    variables: JSON.stringify(
      {
        id: "0x4e34d3a81dc3a20f71bbdf2160492ddaa17ee7e5523757d47153379c13cb46df", // ens.eth
        resolverId:
          "0x4976fb03c32e5b8cfe2b6ccb31c09ba78ebaba41-0x4e34d3a81dc3a20f71bbdf2160492ddaa17ee7e5523757d47153379c13cb46df", // ENS: Public Resolver 2
      },
      null,
      2,
    ),
  },
  {
    operationName: "getResolverDetails",
    id: "18",
    name: "Get Resolver Details by Address",
    category: "Resolver",
    query: `query GetResolverDetails($resolverAddress: String!) {
  resolvers(where: { address: $resolverAddress }, first: 10) {
    id
    texts
    coinTypes
    domain {
      name
      id
    }
  }
}
    `,
    variables: JSON.stringify(
      {
        resolverAddress: "0x4976fb03c32e5b8cfe2b6ccb31c09ba78ebaba41", // ENS: Public Resolver 2
      },
      null,
      2,
    ),
  },
  {
    operationName: "getDomainTextRecords",
    id: "19",
    name: "Get Domain Text Records", //FIXME
    category: "Resolver",
    //events(where: { type_in: ["TextChanged"] }, first: 20) is not working
    query: `query GetDomainTextRecords($id: String!) {
  domain(id: $id) {
    name
    resolver {
      texts
      events(first: 20) {
        id
        blockNumber
        type: __typename
        ... on TextChanged {
          key
          value
        }
      }
    }
  }
}
    `,
    variables: JSON.stringify(
      {
        id: "0x4e34d3a81dc3a20f71bbdf2160492ddaa17ee7e5523757d47153379c13cb46df", // ens.eth
      },
      null,
      2,
    ),
  },
] satisfies Array<SavedQuery>;

export default async function SubgraphGraphQLPage({ searchParams }: PageProps) {
  const { ensnode = defaultEnsNodeUrl() } = await searchParams;

  const baseUrl = Array.isArray(ensnode)
    ? ensnode[0]
    : typeof ensnode === "string"
      ? ensnode
      : defaultEnsNodeUrl();

  const url = new URL(`/subgraph`, baseUrl).toString();

  return <SubgraphGraphiQLEditor url={url} savedQueries={savedQueries} />;
}
