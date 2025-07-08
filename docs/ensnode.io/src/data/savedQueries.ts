import { z } from "astro:content";

export const exampleQueryCategorySchema = z.enum([
  "Domain",
  "Registrar",
  "Label",
  "Resolver",
  "Account",
  "Meta",
]);

export type ExampleQueryCategory = z.infer<typeof exampleQueryCategorySchema>;

export const ExampleQueryCategory = exampleQueryCategorySchema.enum;

export const exampleQuerySchema = z.object({
  operationName: z.string(),
  id: z.string(),
  name: z.string(),
  category: exampleQueryCategorySchema,
  description: z.string(),
  query: z.string(),
  variables: z.string(),
});

export type SavedQuery = z.infer<typeof exampleQuerySchema>;

export const savedQueries: SavedQuery[] = [
  {
    operationName: "GetLatestDomains",
    id: "1",
    name: "Get Latest Domains",
    category: ExampleQueryCategory.Domain,
    description:
      "Retrieves the most recently created domains in descending order by creation time.",
    query: /* GraphQL */ `
      query GetLatestDomains($first: Int!) {
        # This is an example inline comment about this query
        domains(orderBy: createdAt, orderDirection: desc, first: $first) {
          # this comment is about the name below
          name
          expiryDate # this is an inline comment
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
    operationName: "LatestRegistrations",
    id: "21",
    name: "Get Latest Registrations",
    category: ExampleQueryCategory.Registrar,
    description:
      "Retrieves the most recent domain registrations ordered by registration date in descending order. Shows registration details including expiry dates and ownership information for newly registered domains.",
    query: /* GraphQL */ `
      query LatestRegistrations($first: Int!) {
        registrations(
          first: $first
          orderBy: registrationDate
          orderDirection: desc
        ) {
          registrationDate
          expiryDate
          domain {
            id
            name
            labelName
            createdAt
            expiryDate
            owner {
              id
            }
            wrappedOwner {
              id
            }
          }
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
    operationName: "GetDomainsWithPagination",
    id: "1a",
    name: "Get Domains with Pagination",
    category: ExampleQueryCategory.Domain,
    description:
      "Fetches domains with pagination support, ordered by creation time in ascending order. Use this when you need to iterate through all domains systematically or implement pagination in your application.",
    query: /* GraphQL */ `
      query GetDomainsWithPagination($first: Int!, $skip: Int) {
        domains(
          orderBy: createdAt
          orderDirection: asc
          first: $first
          skip: $skip
        ) {
          id
          name
          expiryDate
          createdAt
        }
      }
    `,
    variables: JSON.stringify(
      {
        first: 10,
        skip: 20,
      },
      null,
      2,
    ),
  },
  {
    operationName: "allDomainsByCreationTime",
    id: "22",
    name: "Get All Domains with Pagination by Creation Time",
    category: ExampleQueryCategory.Domain,
    description:
      "Retrieves domains in batches for pagination, ordered by creation time in ascending order. Excludes reverse records and null names. Use the lastCreatedAt parameter to paginate through all domains by passing the createdAt timestamp of the last domain from the previous batch.",
    query: /* GraphQL */ `
      query allDomainsByCreationTime($lastCreatedAt: BigInt, $first: Int!) {
        domains(
          first: $first
          where: {
            createdAt_gt: $lastCreatedAt
            name_not_ends_with: ".addr.reverse"
            name_not: null
          }
          orderBy: createdAt
          orderDirection: asc
        ) {
          createdAt
          name
        }
      }
    `,
    variables: JSON.stringify(
      {
        lastCreatedAt: "1489206542",
        first: 10,
      },
      null,
      2,
    ),
  },
  {
    operationName: "GetDomainByNamehash",
    id: "2",
    name: "Get Domain by Namehash",
    category: ExampleQueryCategory.Domain,
    description:
      "Retrieves a specific domain using its namehash (the unique identifier for ENS names). The namehash is the cryptographic hash of the domain name.",
    query: /* GraphQL */ `
      query GetDomainByNamehash($id: String!) {
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
        id: "0x4e34d3a81dc3a20f71bbdf2160492ddaa17ee7e5523757d47153379c13cb46df", // namehash("ens.eth")
      },
      null,
      2,
    ),
  },
  {
    operationName: "GetDomainByName",
    id: "2a",
    name: "Get Domain by Name",
    category: ExampleQueryCategory.Domain,
    description:
      "Looks up a domain by its human-readable name (e.g., 'ens.eth'). This is user-friendly for ad-hoc queries, but not recommended for programmatic access because names are not stable identifiers. Use the 'Get Domain by Namehash' query for reliable lookups.",
    query: /* GraphQL */ `
      query GetDomainByName($name: String!) {
        domains(where: { name: $name }) {
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
        name: "ens.eth",
      },
      null,
      2,
    ),
  },
  {
    operationName: "GetDomainsByChildmostLabel",
    id: "2c",
    name: "Get Domains by the childmost-label substring",
    category: ExampleQueryCategory.Domain,
    description:
      "Searches for domains containing a specific substring in their label (the leftmost part of the domain name). For example, searching for 'ens' would find 'ens.eth', 'myens.eth', etc. Useful for finding related domains or performing fuzzy searches.",
    query: /* GraphQL */ `
      query GetDomainsByChildmostLabel($label: String!) {
        domains(where: { labelName_contains: $label }) {
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
    operationName: "getLabelByLabelhash",
    id: "3",
    name: "Get Label by Labelhash",
    category: ExampleQueryCategory.Label,
    description:
      "Reverse lookup to find the human-readable label from its labelhash. This is useful when you have a labelhash and need to determine what the actual text label is.",
    query: /* GraphQL */ `
      query getLabelByLabelhash($labelhash: String!) {
        domains(
          first: 1
          where: { labelhash: $labelhash, labelName_not: null }
        ) {
          labelName
        }
      }
    `,
    variables: JSON.stringify(
      {
        labelhash: "0x5cee339e13375638553bdf5a6e36ba80fb9f6a4f0783680884d92b558aa471da", // labelhash("ens")
      },
      null,
      2,
    ),
  },
  {
    operationName: "GetDomainHistory",
    id: "4",
    name: "Get Complete Domain History",
    category: ExampleQueryCategory.Domain,
    description:
      "Retrieves the complete historical timeline of events for a domain, including ownership transfers, resolver changes, registrations, renewals, and all resolver record updates. This provides an audit trail of activities related to the domain.",
    query: /* GraphQL */ `
      query GetDomainHistory($id: String!) {
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
        id: "0x4e34d3a81dc3a20f71bbdf2160492ddaa17ee7e5523757d47153379c13cb46df", // namehash("ens.eth")
      },
      null,
      2,
    ),
  },
  {
    operationName: "GetDomainEvents",
    id: "5",
    name: "Get Domain Events Only",
    category: ExampleQueryCategory.Domain,
    description:
      "Retrieves only the domain-level events (transfers, ownership changes, wrapping events) without registration or resolver events. Use this when you're specifically interested in domain ownership and management events.",
    //events(orderBy: blockNumber, orderDirection: desc) is not working
    query: /* GraphQL */ `
      query GetDomainEvents($id: String!) {
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
        id: "0x4e34d3a81dc3a20f71bbdf2160492ddaa17ee7e5523757d47153379c13cb46df", // namehash("ens.eth")
      },
      null,
      2,
    ),
  },
  {
    operationName: "GetResolverEvents",
    id: "6",
    name: "Get Resolver Events Only",
    category: ExampleQueryCategory.Resolver,
    description:
      "Retrieves only the resolver-related events (address changes, text record updates, contenthash changes) for a domain. Useful when you're tracking how a domain's records have been updated over time.",
    //events(orderBy: blockNumber, orderDirection: desc) is not working
    query: /* GraphQL */ `
      query GetResolverEvents($id: String!) {
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
        id: "0x4e34d3a81dc3a20f71bbdf2160492ddaa17ee7e5523757d47153379c13cb46df", // namehash("ens.eth")
      },
      null,
      2,
    ),
  },
  {
    operationName: "GetDomainsForAddress",
    id: "7",
    name: "Get Domains for Address (owner, registrant, wrappedOwner, or resolvedAddress)",
    category: ExampleQueryCategory.Account,
    description:
      "Finds all domains associated with an Ethereum address in any capacity - as owner, registrant, wrapped owner, or as the resolved address. Excludes reverse records and expired domains. This is a comprehensive way to find domains connected to an address.",
    query: /* GraphQL */ `
      query GetDomainsForAddress(
        $owner: String!
        $first: Int!
        $orderBy: Domain_orderBy!
        $orderDirection: OrderDirection!
        $date: BigInt!
      ) {
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
              # namehash("addr.reverse") = 0x91d1777781884d03a6757a803996e38de2a42967fb37eeaca72729271025a9e2
              {
                parent_not: "0x91d1777781884d03a6757a803996e38de2a42967fb37eeaca72729271025a9e2"
              }
              { or: [{ expiryDate_gt: $date }, { expiryDate: null }] }
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
    operationName: "getOwnedInRegistryDomains",
    id: "8",
    name: "Get Owned In Registry Domains Only",
    category: ExampleQueryCategory.Account,
    description:
      "Retrieves domains where the specified address is the owner in the ENS registry (not registrant or wrapped owner). This shows domains where the address has direct control over the ENS records but may not be the original registrant.",
    query: /* GraphQL */ `
      query getOwnedInRegistryDomains(
        $owner: String!
        $first: Int!
        $date: BigInt!
      ) {
        domains(
          where: {
            owner: $owner
            # Exclude domains with parent addr.reverse
            # namehash("addr.reverse") = 0x91d1777781884d03a6757a803996e38de2a42967fb37eeaca72729271025a9e2
            parent_not: "0x91d1777781884d03a6757a803996e38de2a42967fb37eeaca72729271025a9e2"
            or: [{ expiryDate_gt: $date }, { expiryDate: null }]
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
    operationName: "GetRegisteredDomains",
    id: "9",
    name: "Get Registered Domains Only",
    category: ExampleQueryCategory.Account,
    description:
      "Retrieves domains where the specified address is the original registrant (the one who initially registered the .eth domain). This shows domains the address actually purchased and registered, not just ones they received or control.",
    query: /* GraphQL */ `
      query GetRegisteredDomains(
        $registrant: String!
        $first: Int!
        $date: BigInt!
      ) {
        domains(
          where: {
            registrant: $registrant
            # Exclude domains with parent addr.reverse
            # namehash("addr.reverse") = 0x91d1777781884d03a6757a803996e38de2a42967fb37eeaca72729271025a9e2
            parent_not: "0x91d1777781884d03a6757a803996e38de2a42967fb37eeaca72729271025a9e2"
            or: [{ expiryDate_gt: $date }, { expiryDate: null }]
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
    operationName: "GetNamesIncludingExpired",
    id: "10",
    name: "Get Names Including Expired",
    category: ExampleQueryCategory.Account,
    description:
      "Retrieves all domains associated with an address (as owner, registrant, or wrapped owner) including those that have expired. Useful for historical analysis or when you need to see the domain portfolio of an address.",
    query: /* GraphQL */ `
      query GetNamesIncludingExpired($owner: String!, $first: Int!) {
        domains(
          where: {
            or: [
              { owner: $owner }
              { registrant: $owner }
              { wrappedOwner: $owner }
            ]
            # Exclude domains with parent addr.reverse
            # namehash("addr.reverse") = 0x91d1777781884d03a6757a803996e38de2a42967fb37eeaca72729271025a9e2
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
    operationName: "GetSubgraphRegistrant",
    id: "11",
    name: "Get Registrant by Labelhash", // works with ENS only?
    category: ExampleQueryCategory.Registrar,
    description:
      "Looks up registration information using a labelhash. This is primarily used for .eth domains and provides details about who registered the domain, when it was registered, when it expires, and what it cost. Note: This mainly works with .eth domains.",
    query: /* GraphQL */ `
      query GetSubgraphRegistrant($id: String!) {
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
        id: "0x5cee339e13375638553bdf5a6e36ba80fb9f6a4f0783680884d92b558aa471da", // labelhash("ens")
      },
      null,
      2,
    ),
  },
  {
    operationName: "GetSubnames",
    id: "12",
    name: "Get Subdomains",
    category: ExampleQueryCategory.Domain,
    description:
      "Retrieves all subdomains under a given parent domain, filtering out expired domains and empty records. This is useful for exploring the subdomain hierarchy and finding active subdomains under a particular domain.",
    query: /* GraphQL */ `
      query GetSubnames(
        $id: String!
        $first: Int!
        $orderBy: Domain_orderBy!
        $orderDirection: OrderDirection!
        $date: BigInt!
      ) {
        domain(id: $id) {
          name
          subdomains(
            orderBy: $orderBy
            orderDirection: $orderDirection
            first: $first
            where: {
              and: [
                { or: [{ expiryDate_gt: $date }, { expiryDate: null }] }
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
        id: "0x4e34d3a81dc3a20f71bbdf2160492ddaa17ee7e5523757d47153379c13cb46df", // namehash("ens.eth")
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
    operationName: "SearchSubnames",
    id: "13",
    name: "Search Subdomains by Label",
    category: ExampleQueryCategory.Domain,
    description:
      "Searches for subdomains under a parent domain that contain a specific text string in their label. This enables fuzzy searching within a domain's subdomain space, useful for finding related or similarly named subdomains.",
    query: /* GraphQL */ `
      query SearchSubnames(
        $id: String!
        $searchString: String!
        $first: Int!
        $date: BigInt!
      ) {
        domain(id: $id) {
          name
          subdomains(
            orderBy: name
            orderDirection: asc
            first: $first
            where: {
              and: [
                { labelName_contains: $searchString }
                { or: [{ expiryDate_gt: $date }, { expiryDate: null }] }
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
        id: "0x4e34d3a81dc3a20f71bbdf2160492ddaa17ee7e5523757d47153379c13cb46df", // namehash("ens.eth")
        searchString: "test",
        first: 10,
        date: Math.floor(Date.now() / 1000),
      },
      null,
      2,
    ),
  },
  {
    operationName: "GetSubnamesIncludingExpired",
    id: "14",
    name: "Get Subdomains Including Expired",
    category: ExampleQueryCategory.Domain,
    description:
      "Retrieves all subdomains under a parent domain, including those that have expired. This provides a complete historical view of all subdomains that have ever existed under the parent domain.",
    query: /* GraphQL */ `
      query GetSubnamesIncludingExpired($id: String!, $first: Int!) {
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
        id: "0x4e34d3a81dc3a20f71bbdf2160492ddaa17ee7e5523757d47153379c13cb46df", // namehash("ens.eth")
        first: 10,
      },
      null,
      2,
    ),
  },
  {
    operationName: "GetLatestSubnames",
    id: "15",
    name: "Get Latest Subdomains",
    category: ExampleQueryCategory.Registrar,
    description:
      "Retrieves the most recently created subdomains under a parent domain, ordered by creation time. This is useful for monitoring new subdomain activity and tracking the growth of a domain's subdomain ecosystem.",
    query: /* GraphQL */ `
      query GetLatestSubnames($id: String!, $first: Int!, $date: BigInt!) {
        domain(id: $id) {
          name
          subdomains(
            orderBy: createdAt
            orderDirection: desc
            first: $first
            where: {
              and: [
                { or: [{ expiryDate_gt: $date }, { expiryDate: null }] }
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
        id: "0x4e34d3a81dc3a20f71bbdf2160492ddaa17ee7e5523757d47153379c13cb46df", // namehash("ens.eth")
        first: 10,
        date: Math.floor(Date.now() / 1000),
      },
      null,
      2,
    ),
  },
  {
    operationName: "GetSubgraphRecords",
    id: "16",
    name: "Get Domain Records (Inherited Resolver)",
    category: ExampleQueryCategory.Resolver,
    description:
      "Retrieves a domain's resolver information including the types of records it supports (text records and coin types). This uses the domain's current resolver and shows what kind of records are available for the domain.",
    query: /* GraphQL */ `
      query GetSubgraphRecords($id: String!) {
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
        id: "0x4e34d3a81dc3a20f71bbdf2160492ddaa17ee7e5523757d47153379c13cb46df", // namehash("ens.eth")
      },
      null,
      2,
    ),
  },
  {
    operationName: "GetSubgraphRecordsCustomResolver",
    id: "17",
    name: "Get Domain Records (Custom Resolver)",
    category: ExampleQueryCategory.Resolver,
    description:
      "Retrieves domain information along with records from a specific resolver address.",
    query: /* GraphQL */ `
      query GetSubgraphRecordsCustomResolver(
        $id: String!
        $resolverId: String!
      ) {
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
        id: "0x4e34d3a81dc3a20f71bbdf2160492ddaa17ee7e5523757d47153379c13cb46df", // namehash("ens.eth")
        resolverId:
          "0x4976fb03c32e5b8cfe2b6ccb31c09ba78ebaba41-0x4e34d3a81dc3a20f71bbdf2160492ddaa17ee7e5523757d47153379c13cb46df", // ENS: Public Resolver 2
      },
      null,
      2,
    ),
  },
  {
    operationName: "GetResolverDetails",
    id: "18",
    name: "Get Resolver Details by Address",
    category: ExampleQueryCategory.Resolver,
    description:
      "Retrieves detailed information about a resolver by its contract address. This shows the domains using this resolver and what types of records it supports.",
    query: /* GraphQL */ `
      query GetResolverDetails($resolverAddress: String!) {
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
    operationName: "GetDomainTextRecords",
    id: "19",
    name: "Get Domain Text Records",
    category: ExampleQueryCategory.Resolver,
    description:
      "Retrieves the current text record keys for a domain and all resolver events history. The 'texts' field shows currently set text record keys, while 'events' shows all resolver events including TextChanged, ContenthashChanged, AddrChanged, and MulticoinAddrChanged.",
    //events(where: { type_in: ["TextChanged"] }, first: 20) is not working
    query: /* GraphQL */ `
      query GetDomainTextRecords($id: String!) {
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
        id: "0x4e34d3a81dc3a20f71bbdf2160492ddaa17ee7e5523757d47153379c13cb46df", // namehash("ens.eth")
      },
      null,
      2,
    ),
  },
  {
    operationName: "GetHistoricalResolverRecords",
    id: "20",
    name: "Get Historical Resolver Records Evolution",
    category: ExampleQueryCategory.Resolver,
    description:
      "Provides a comprehensive view of how a domain's resolver records have evolved over time. This tracks resolver changes and the history of text records, address records, and contenthash changes across all resolvers the domain has used.",
    query: /* GraphQL */ `
      query GetHistoricalResolverRecords($ensName: String!) {
        domains(where: { name: $ensName }) {
          id
          name
          newResolvers {
            resolverId
            blockNumber
            transactionID
            resolver {
              address
              textChangeds {
                key
                value
                blockNumber
                transactionID
              }
              multicoinAddrChangeds {
                coinType
                addr
                blockNumber
                transactionID
              }
              contenthashChangeds {
                hash
                blockNumber
                transactionID
              }
            }
          }
        }
      }
    `,
    variables: JSON.stringify(
      {
        ensName: "ens.eth",
      },
      null,
      2,
    ),
  },
  {
    operationName: "getIndexerMetadata",
    id: "23",
    name: "Get Indexer Metadata",
    category: ExampleQueryCategory.Meta,
    description:
      "Retrieves metadata information about the indexer including indexing status and current block number. Use this to check if the indexer has indexing errors and to monitor synchronization with the blockchain.",
    query: /* GraphQL */ `
      query getIndexerMetadata {
        _meta {
          hasIndexingErrors
          block {
            number
          }
        }
      }
    `,
    variables: JSON.stringify({}, null, 2),
  },
  {
    operationName: "getResolverExists",
    id: "24",
    name: "Check if Resolver Exists",
    category: ExampleQueryCategory.Resolver,
    description:
      "Checks if a specific resolver exists by its ID. The resolver ID is constructed as 'resolverAddress-namehash' where resolverAddress is the contract address and namehash is the domain's namehash. Used to verify resolver existence before operations.",
    query: /* GraphQL */ `
      query getResolverExists($id: String!) {
        resolver(id: $id) {
          id
        }
      }
    `,
    variables: JSON.stringify(
      {
        id: "0x4976fb03c32e5b8cfe2b6ccb31c09ba78ebaba41-0x4e34d3a81dc3a20f71bbdf2160492ddaa17ee7e5523757d47153379c13cb46df", // ENS: Public Resolver 2 + namehash("ens.eth")
      },
      null,
      2,
    ),
  },
  {
    operationName: "getNameDates",
    id: "25",
    name: "Get Registration Data by Labelhash",
    category: ExampleQueryCategory.Registrar,
    description:
      "Retrieves registration information for a domain using its labelhash (hash of the label without the TLD). Returns the registration date and the most recent registration transaction ID. Primarily used for .eth domains.",
    query: /* GraphQL */ `
      query getNameDates($id: String!) {
        registration(id: $id) {
          registrationDate
        }
        nameRegistereds(
          first: 1
          orderBy: blockNumber
          orderDirection: desc
          where: { registration: $id }
        ) {
          transactionID
        }
      }
    `,
    variables: JSON.stringify(
      {
        id: "0x5cee339e13375638553bdf5a6e36ba80fb9f6a4f0783680884d92b558aa471da", // labelhash("ens")
      },
      null,
      2,
    ),
  },
  {
    operationName: "getDomainWithResolver",
    id: "26",
    name: "Get Domain with Resolver Address",
    category: ExampleQueryCategory.Domain,
    description:
      "Retrieves domain information including resolver address and text records. Unlike other domain queries, this specifically includes the resolver's address field along with standard domain information.",
    query: /* GraphQL */ `
      query getDomainWithResolver($tokenId: String!) {
        domain(id: $tokenId) {
          id
          labelhash
          name
          createdAt
          parent {
            id
          }
          resolver {
            texts
            address
          }
        }
      }
    `,
    variables: JSON.stringify(
      {
        tokenId: "0x4e34d3a81dc3a20f71bbdf2160492ddaa17ee7e5523757d47153379c13cb46df", // namehash("ens.eth")
      },
      null,
      2,
    ),
  },
  {
    operationName: "getEthDomainByLabelhash",
    id: "27",
    name: "Get .eth Domain by Labelhash",
    category: ExampleQueryCategory.Domain,
    description:
      "Retrieves .eth domains by their labelhash under the .eth parent domain. This is specifically for finding .eth domains using their labelhash identifier.",
    query: /* GraphQL */ `
      query getEthDomainByLabelhash($tokenId: String!) {
        domains(
          where: {
            parent: "0x93cdeb708b7545dc668eb9280176169d1c33cfd8ed6f04690a0bcc88a93fc4ae"
            labelhash: $tokenId
          }
        ) {
          id
          labelhash
          name
          createdAt
          parent {
            id
          }
          resolver {
            texts
            address
          }
        }
      }
    `,
    variables: JSON.stringify(
      {
        tokenId: "0x5cee339e13375638553bdf5a6e36ba80fb9f6a4f0783680884d92b558aa471da", // labelhash("ens")
      },
      null,
      2,
    ),
  },
  {
    operationName: "getRegistrationByTokenId", //similar to getSubgraphRegistrant - remove?
    id: "28",
    name: "Get Registration by Token ID",
    category: ExampleQueryCategory.Registrar,
    description:
      "Retrieves registration information by token ID (labelhash), including label name, registration date, and expiry date. Ordered by registration date in descending order.",
    query: /* GraphQL */ `
      query getRegistrationByTokenId($tokenId: String!) {
        registrations(
          orderBy: registrationDate
          orderDirection: desc
          where: { id: $tokenId }
        ) {
          labelName
          registrationDate
          expiryDate
        }
      }
    `,
    variables: JSON.stringify(
      {
        tokenId: "0x5cee339e13375638553bdf5a6e36ba80fb9f6a4f0783680884d92b558aa471da", // labelhash("ens")
      },
      null,
      2,
    ),
  },
  {
    operationName: "getWrappedDomain",
    id: "29",
    name: "Get Wrapped Domain",
    category: ExampleQueryCategory.Domain,
    description:
      "Retrieves wrapped domain information including owner, fuses, expiry date, and domain name. Used for ENS domains that have been wrapped using the Name Wrapper contract.",
    query: /* GraphQL */ `
      query getWrappedDomain($tokenId: String!) {
        wrappedDomain(id: $tokenId) {
          id
          owner {
            id
          }
          fuses
          expiryDate
          domain {
            name
          }
        }
      }
    `,
    variables: JSON.stringify(
      {
        tokenId: "0x2c18815bc184e0d6d1d6817e9461e713acb6f3d6c1d2092babfbad56842a4085", // namehash("$$$.eth")
      },
      null,
      2,
    ),
  },
];
