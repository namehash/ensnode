/* eslint-disable */
/* prettier-ignore */

/** An IntrospectionQuery representation of your schema.
 *
 * @remarks
 * This is an introspection of your schema saved as a file by GraphQLSP.
 * You may import it to create a `graphql()` tag function with `gql.tada`
 * by importing it and passing it to `initGraphQLTada<>()`.
 *
 * @example
 * ```
 * import { initGraphQLTada } from 'gql.tada';
 * import type { introspection } from './introspection';
 *
 * export const graphql = initGraphQLTada<{
 *   introspection: typeof introspection;
 *   scalars: {
 *     DateTime: string;
 *     Json: any;
 *   };
 * }>();
 * ```
 */
const introspection = {
  "__schema": {
    "queryType": {
      "name": "Query"
    },
    "mutationType": null,
    "subscriptionType": null,
    "types": [
      {
        "kind": "OBJECT",
        "name": "Account",
        "fields": [
          {
            "name": "address",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "SCALAR",
                "name": "Address"
              }
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "domains",
            "type": {
              "kind": "OBJECT",
              "name": "AccountDomainsConnection"
            },
            "args": [
              {
                "name": "after",
                "type": {
                  "kind": "SCALAR",
                  "name": "String"
                }
              },
              {
                "name": "before",
                "type": {
                  "kind": "SCALAR",
                  "name": "String"
                }
              },
              {
                "name": "first",
                "type": {
                  "kind": "SCALAR",
                  "name": "Int"
                }
              },
              {
                "name": "last",
                "type": {
                  "kind": "SCALAR",
                  "name": "Int"
                }
              },
              {
                "name": "order",
                "type": {
                  "kind": "INPUT_OBJECT",
                  "name": "DomainsOrderInput"
                }
              },
              {
                "name": "where",
                "type": {
                  "kind": "INPUT_OBJECT",
                  "name": "AccountDomainsWhereInput"
                }
              }
            ],
            "isDeprecated": false
          },
          {
            "name": "events",
            "type": {
              "kind": "OBJECT",
              "name": "AccountEventsConnection"
            },
            "args": [
              {
                "name": "after",
                "type": {
                  "kind": "SCALAR",
                  "name": "String"
                }
              },
              {
                "name": "before",
                "type": {
                  "kind": "SCALAR",
                  "name": "String"
                }
              },
              {
                "name": "first",
                "type": {
                  "kind": "SCALAR",
                  "name": "Int"
                }
              },
              {
                "name": "last",
                "type": {
                  "kind": "SCALAR",
                  "name": "Int"
                }
              },
              {
                "name": "where",
                "type": {
                  "kind": "INPUT_OBJECT",
                  "name": "AccountEventsWhereInput"
                }
              }
            ],
            "isDeprecated": false
          },
          {
            "name": "id",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "SCALAR",
                "name": "Address"
              }
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "permissions",
            "type": {
              "kind": "OBJECT",
              "name": "AccountPermissionsConnection"
            },
            "args": [
              {
                "name": "after",
                "type": {
                  "kind": "SCALAR",
                  "name": "String"
                }
              },
              {
                "name": "before",
                "type": {
                  "kind": "SCALAR",
                  "name": "String"
                }
              },
              {
                "name": "first",
                "type": {
                  "kind": "SCALAR",
                  "name": "Int"
                }
              },
              {
                "name": "in",
                "type": {
                  "kind": "INPUT_OBJECT",
                  "name": "AccountIdInput"
                }
              },
              {
                "name": "last",
                "type": {
                  "kind": "SCALAR",
                  "name": "Int"
                }
              }
            ],
            "isDeprecated": false
          },
          {
            "name": "registryPermissions",
            "type": {
              "kind": "OBJECT",
              "name": "AccountRegistryPermissionsConnection"
            },
            "args": [
              {
                "name": "after",
                "type": {
                  "kind": "SCALAR",
                  "name": "String"
                }
              },
              {
                "name": "before",
                "type": {
                  "kind": "SCALAR",
                  "name": "String"
                }
              },
              {
                "name": "first",
                "type": {
                  "kind": "SCALAR",
                  "name": "Int"
                }
              },
              {
                "name": "last",
                "type": {
                  "kind": "SCALAR",
                  "name": "Int"
                }
              }
            ],
            "isDeprecated": false
          },
          {
            "name": "resolverPermissions",
            "type": {
              "kind": "OBJECT",
              "name": "AccountResolverPermissionsConnection"
            },
            "args": [
              {
                "name": "after",
                "type": {
                  "kind": "SCALAR",
                  "name": "String"
                }
              },
              {
                "name": "before",
                "type": {
                  "kind": "SCALAR",
                  "name": "String"
                }
              },
              {
                "name": "first",
                "type": {
                  "kind": "SCALAR",
                  "name": "Int"
                }
              },
              {
                "name": "last",
                "type": {
                  "kind": "SCALAR",
                  "name": "Int"
                }
              }
            ],
            "isDeprecated": false
          }
        ],
        "interfaces": []
      },
      {
        "kind": "INPUT_OBJECT",
        "name": "AccountByInput",
        "inputFields": [
          {
            "name": "address",
            "type": {
              "kind": "SCALAR",
              "name": "Address"
            }
          },
          {
            "name": "id",
            "type": {
              "kind": "SCALAR",
              "name": "Address"
            }
          }
        ],
        "isOneOf": true
      },
      {
        "kind": "OBJECT",
        "name": "AccountDomainsConnection",
        "fields": [
          {
            "name": "edges",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "LIST",
                "ofType": {
                  "kind": "NON_NULL",
                  "ofType": {
                    "kind": "OBJECT",
                    "name": "AccountDomainsConnectionEdge"
                  }
                }
              }
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "pageInfo",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "OBJECT",
                "name": "PageInfo"
              }
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "totalCount",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "SCALAR",
                "name": "Int"
              }
            },
            "args": [],
            "isDeprecated": false
          }
        ],
        "interfaces": []
      },
      {
        "kind": "OBJECT",
        "name": "AccountDomainsConnectionEdge",
        "fields": [
          {
            "name": "cursor",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "SCALAR",
                "name": "String"
              }
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "node",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "INTERFACE",
                "name": "Domain"
              }
            },
            "args": [],
            "isDeprecated": false
          }
        ],
        "interfaces": []
      },
      {
        "kind": "INPUT_OBJECT",
        "name": "AccountDomainsWhereInput",
        "inputFields": [
          {
            "name": "canonical",
            "type": {
              "kind": "SCALAR",
              "name": "Boolean"
            },
            "defaultValue": "false"
          },
          {
            "name": "name",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            }
          }
        ],
        "isOneOf": false
      },
      {
        "kind": "OBJECT",
        "name": "AccountEventsConnection",
        "fields": [
          {
            "name": "edges",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "LIST",
                "ofType": {
                  "kind": "NON_NULL",
                  "ofType": {
                    "kind": "OBJECT",
                    "name": "AccountEventsConnectionEdge"
                  }
                }
              }
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "pageInfo",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "OBJECT",
                "name": "PageInfo"
              }
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "totalCount",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "SCALAR",
                "name": "Int"
              }
            },
            "args": [],
            "isDeprecated": false
          }
        ],
        "interfaces": []
      },
      {
        "kind": "OBJECT",
        "name": "AccountEventsConnectionEdge",
        "fields": [
          {
            "name": "cursor",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "SCALAR",
                "name": "String"
              }
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "node",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "OBJECT",
                "name": "Event"
              }
            },
            "args": [],
            "isDeprecated": false
          }
        ],
        "interfaces": []
      },
      {
        "kind": "INPUT_OBJECT",
        "name": "AccountEventsWhereInput",
        "inputFields": [
          {
            "name": "selector_in",
            "type": {
              "kind": "LIST",
              "ofType": {
                "kind": "NON_NULL",
                "ofType": {
                  "kind": "SCALAR",
                  "name": "Hex"
                }
              }
            }
          },
          {
            "name": "timestamp_gte",
            "type": {
              "kind": "SCALAR",
              "name": "BigInt"
            }
          },
          {
            "name": "timestamp_lte",
            "type": {
              "kind": "SCALAR",
              "name": "BigInt"
            }
          }
        ],
        "isOneOf": false
      },
      {
        "kind": "OBJECT",
        "name": "AccountId",
        "fields": [
          {
            "name": "address",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "SCALAR",
                "name": "Address"
              }
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "chainId",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "SCALAR",
                "name": "ChainId"
              }
            },
            "args": [],
            "isDeprecated": false
          }
        ],
        "interfaces": []
      },
      {
        "kind": "INPUT_OBJECT",
        "name": "AccountIdInput",
        "inputFields": [
          {
            "name": "address",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "SCALAR",
                "name": "Address"
              }
            }
          },
          {
            "name": "chainId",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "SCALAR",
                "name": "ChainId"
              }
            }
          }
        ],
        "isOneOf": false
      },
      {
        "kind": "OBJECT",
        "name": "AccountPermissionsConnection",
        "fields": [
          {
            "name": "edges",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "LIST",
                "ofType": {
                  "kind": "NON_NULL",
                  "ofType": {
                    "kind": "OBJECT",
                    "name": "AccountPermissionsConnectionEdge"
                  }
                }
              }
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "pageInfo",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "OBJECT",
                "name": "PageInfo"
              }
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "totalCount",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "SCALAR",
                "name": "Int"
              }
            },
            "args": [],
            "isDeprecated": false
          }
        ],
        "interfaces": []
      },
      {
        "kind": "OBJECT",
        "name": "AccountPermissionsConnectionEdge",
        "fields": [
          {
            "name": "cursor",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "SCALAR",
                "name": "String"
              }
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "node",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "OBJECT",
                "name": "PermissionsUser"
              }
            },
            "args": [],
            "isDeprecated": false
          }
        ],
        "interfaces": []
      },
      {
        "kind": "OBJECT",
        "name": "AccountRegistryPermissionsConnection",
        "fields": [
          {
            "name": "edges",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "LIST",
                "ofType": {
                  "kind": "NON_NULL",
                  "ofType": {
                    "kind": "OBJECT",
                    "name": "AccountRegistryPermissionsConnectionEdge"
                  }
                }
              }
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "pageInfo",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "OBJECT",
                "name": "PageInfo"
              }
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "totalCount",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "SCALAR",
                "name": "Int"
              }
            },
            "args": [],
            "isDeprecated": false
          }
        ],
        "interfaces": []
      },
      {
        "kind": "OBJECT",
        "name": "AccountRegistryPermissionsConnectionEdge",
        "fields": [
          {
            "name": "cursor",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "SCALAR",
                "name": "String"
              }
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "node",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "OBJECT",
                "name": "RegistryPermissionsUser"
              }
            },
            "args": [],
            "isDeprecated": false
          }
        ],
        "interfaces": []
      },
      {
        "kind": "OBJECT",
        "name": "AccountResolverPermissionsConnection",
        "fields": [
          {
            "name": "edges",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "LIST",
                "ofType": {
                  "kind": "NON_NULL",
                  "ofType": {
                    "kind": "OBJECT",
                    "name": "AccountResolverPermissionsConnectionEdge"
                  }
                }
              }
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "pageInfo",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "OBJECT",
                "name": "PageInfo"
              }
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "totalCount",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "SCALAR",
                "name": "Int"
              }
            },
            "args": [],
            "isDeprecated": false
          }
        ],
        "interfaces": []
      },
      {
        "kind": "OBJECT",
        "name": "AccountResolverPermissionsConnectionEdge",
        "fields": [
          {
            "name": "cursor",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "SCALAR",
                "name": "String"
              }
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "node",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "OBJECT",
                "name": "ResolverPermissionsUser"
              }
            },
            "args": [],
            "isDeprecated": false
          }
        ],
        "interfaces": []
      },
      {
        "kind": "SCALAR",
        "name": "Address"
      },
      {
        "kind": "OBJECT",
        "name": "BaseRegistrarRegistration",
        "fields": [
          {
            "name": "baseCost",
            "type": {
              "kind": "SCALAR",
              "name": "BigInt"
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "domain",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "INTERFACE",
                "name": "Domain"
              }
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "event",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "OBJECT",
                "name": "Event"
              }
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "expired",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "SCALAR",
                "name": "Boolean"
              }
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "expiry",
            "type": {
              "kind": "SCALAR",
              "name": "BigInt"
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "id",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "SCALAR",
                "name": "RegistrationId"
              }
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "isInGracePeriod",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "SCALAR",
                "name": "Boolean"
              }
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "premium",
            "type": {
              "kind": "SCALAR",
              "name": "BigInt"
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "referrer",
            "type": {
              "kind": "SCALAR",
              "name": "Hex"
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "registrant",
            "type": {
              "kind": "OBJECT",
              "name": "Account"
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "registrar",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "OBJECT",
                "name": "AccountId"
              }
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "renewals",
            "type": {
              "kind": "OBJECT",
              "name": "RegistrationRenewalsConnection"
            },
            "args": [
              {
                "name": "after",
                "type": {
                  "kind": "SCALAR",
                  "name": "String"
                }
              },
              {
                "name": "before",
                "type": {
                  "kind": "SCALAR",
                  "name": "String"
                }
              },
              {
                "name": "first",
                "type": {
                  "kind": "SCALAR",
                  "name": "Int"
                }
              },
              {
                "name": "last",
                "type": {
                  "kind": "SCALAR",
                  "name": "Int"
                }
              }
            ],
            "isDeprecated": false
          },
          {
            "name": "start",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "SCALAR",
                "name": "BigInt"
              }
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "unregistrant",
            "type": {
              "kind": "OBJECT",
              "name": "Account"
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "wrapped",
            "type": {
              "kind": "OBJECT",
              "name": "WrappedBaseRegistrarRegistration"
            },
            "args": [],
            "isDeprecated": false
          }
        ],
        "interfaces": [
          {
            "kind": "INTERFACE",
            "name": "Registration"
          }
        ]
      },
      {
        "kind": "SCALAR",
        "name": "BigInt"
      },
      {
        "kind": "SCALAR",
        "name": "Boolean"
      },
      {
        "kind": "SCALAR",
        "name": "ChainId"
      },
      {
        "kind": "SCALAR",
        "name": "CoinType"
      },
      {
        "kind": "INTERFACE",
        "name": "Domain",
        "fields": [
          {
            "name": "events",
            "type": {
              "kind": "OBJECT",
              "name": "DomainEventsConnection"
            },
            "args": [
              {
                "name": "after",
                "type": {
                  "kind": "SCALAR",
                  "name": "String"
                }
              },
              {
                "name": "before",
                "type": {
                  "kind": "SCALAR",
                  "name": "String"
                }
              },
              {
                "name": "first",
                "type": {
                  "kind": "SCALAR",
                  "name": "Int"
                }
              },
              {
                "name": "last",
                "type": {
                  "kind": "SCALAR",
                  "name": "Int"
                }
              },
              {
                "name": "where",
                "type": {
                  "kind": "INPUT_OBJECT",
                  "name": "EventsWhereInput"
                }
              }
            ],
            "isDeprecated": false
          },
          {
            "name": "id",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "SCALAR",
                "name": "DomainId"
              }
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "label",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "OBJECT",
                "name": "Label"
              }
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "name",
            "type": {
              "kind": "SCALAR",
              "name": "InterpretedName"
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "owner",
            "type": {
              "kind": "OBJECT",
              "name": "Account"
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "path",
            "type": {
              "kind": "LIST",
              "ofType": {
                "kind": "NON_NULL",
                "ofType": {
                  "kind": "INTERFACE",
                  "name": "Domain"
                }
              }
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "registration",
            "type": {
              "kind": "INTERFACE",
              "name": "Registration"
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "registrations",
            "type": {
              "kind": "OBJECT",
              "name": "DomainRegistrationsConnection"
            },
            "args": [
              {
                "name": "after",
                "type": {
                  "kind": "SCALAR",
                  "name": "String"
                }
              },
              {
                "name": "before",
                "type": {
                  "kind": "SCALAR",
                  "name": "String"
                }
              },
              {
                "name": "first",
                "type": {
                  "kind": "SCALAR",
                  "name": "Int"
                }
              },
              {
                "name": "last",
                "type": {
                  "kind": "SCALAR",
                  "name": "Int"
                }
              }
            ],
            "isDeprecated": false
          },
          {
            "name": "resolver",
            "type": {
              "kind": "OBJECT",
              "name": "Resolver"
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "subdomains",
            "type": {
              "kind": "OBJECT",
              "name": "DomainSubdomainsConnection"
            },
            "args": [
              {
                "name": "after",
                "type": {
                  "kind": "SCALAR",
                  "name": "String"
                }
              },
              {
                "name": "before",
                "type": {
                  "kind": "SCALAR",
                  "name": "String"
                }
              },
              {
                "name": "first",
                "type": {
                  "kind": "SCALAR",
                  "name": "Int"
                }
              },
              {
                "name": "last",
                "type": {
                  "kind": "SCALAR",
                  "name": "Int"
                }
              },
              {
                "name": "order",
                "type": {
                  "kind": "INPUT_OBJECT",
                  "name": "DomainsOrderInput"
                }
              },
              {
                "name": "where",
                "type": {
                  "kind": "INPUT_OBJECT",
                  "name": "SubdomainsWhereInput"
                }
              }
            ],
            "isDeprecated": false
          }
        ],
        "interfaces": [],
        "possibleTypes": [
          {
            "kind": "OBJECT",
            "name": "ENSv1Domain"
          },
          {
            "kind": "OBJECT",
            "name": "ENSv2Domain"
          }
        ]
      },
      {
        "kind": "OBJECT",
        "name": "DomainEventsConnection",
        "fields": [
          {
            "name": "edges",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "LIST",
                "ofType": {
                  "kind": "NON_NULL",
                  "ofType": {
                    "kind": "OBJECT",
                    "name": "DomainEventsConnectionEdge"
                  }
                }
              }
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "pageInfo",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "OBJECT",
                "name": "PageInfo"
              }
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "totalCount",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "SCALAR",
                "name": "Int"
              }
            },
            "args": [],
            "isDeprecated": false
          }
        ],
        "interfaces": []
      },
      {
        "kind": "OBJECT",
        "name": "DomainEventsConnectionEdge",
        "fields": [
          {
            "name": "cursor",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "SCALAR",
                "name": "String"
              }
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "node",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "OBJECT",
                "name": "Event"
              }
            },
            "args": [],
            "isDeprecated": false
          }
        ],
        "interfaces": []
      },
      {
        "kind": "SCALAR",
        "name": "DomainId"
      },
      {
        "kind": "INPUT_OBJECT",
        "name": "DomainIdInput",
        "inputFields": [
          {
            "name": "id",
            "type": {
              "kind": "SCALAR",
              "name": "DomainId"
            }
          },
          {
            "name": "name",
            "type": {
              "kind": "SCALAR",
              "name": "InterpretedName"
            }
          }
        ],
        "isOneOf": true
      },
      {
        "kind": "INPUT_OBJECT",
        "name": "DomainPermissionsWhereInput",
        "inputFields": [
          {
            "name": "user",
            "type": {
              "kind": "SCALAR",
              "name": "Address"
            }
          }
        ],
        "isOneOf": false
      },
      {
        "kind": "OBJECT",
        "name": "DomainRegistrationsConnection",
        "fields": [
          {
            "name": "edges",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "LIST",
                "ofType": {
                  "kind": "NON_NULL",
                  "ofType": {
                    "kind": "OBJECT",
                    "name": "DomainRegistrationsConnectionEdge"
                  }
                }
              }
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "pageInfo",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "OBJECT",
                "name": "PageInfo"
              }
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "totalCount",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "SCALAR",
                "name": "Int"
              }
            },
            "args": [],
            "isDeprecated": false
          }
        ],
        "interfaces": []
      },
      {
        "kind": "OBJECT",
        "name": "DomainRegistrationsConnectionEdge",
        "fields": [
          {
            "name": "cursor",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "SCALAR",
                "name": "String"
              }
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "node",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "INTERFACE",
                "name": "Registration"
              }
            },
            "args": [],
            "isDeprecated": false
          }
        ],
        "interfaces": []
      },
      {
        "kind": "OBJECT",
        "name": "DomainSubdomainsConnection",
        "fields": [
          {
            "name": "edges",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "LIST",
                "ofType": {
                  "kind": "NON_NULL",
                  "ofType": {
                    "kind": "OBJECT",
                    "name": "DomainSubdomainsConnectionEdge"
                  }
                }
              }
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "pageInfo",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "OBJECT",
                "name": "PageInfo"
              }
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "totalCount",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "SCALAR",
                "name": "Int"
              }
            },
            "args": [],
            "isDeprecated": false
          }
        ],
        "interfaces": []
      },
      {
        "kind": "OBJECT",
        "name": "DomainSubdomainsConnectionEdge",
        "fields": [
          {
            "name": "cursor",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "SCALAR",
                "name": "String"
              }
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "node",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "INTERFACE",
                "name": "Domain"
              }
            },
            "args": [],
            "isDeprecated": false
          }
        ],
        "interfaces": []
      },
      {
        "kind": "ENUM",
        "name": "DomainsOrderBy",
        "enumValues": [
          {
            "name": "NAME",
            "isDeprecated": false
          },
          {
            "name": "REGISTRATION_EXPIRY",
            "isDeprecated": false
          },
          {
            "name": "REGISTRATION_TIMESTAMP",
            "isDeprecated": false
          }
        ]
      },
      {
        "kind": "INPUT_OBJECT",
        "name": "DomainsOrderInput",
        "inputFields": [
          {
            "name": "by",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "ENUM",
                "name": "DomainsOrderBy"
              }
            }
          },
          {
            "name": "dir",
            "type": {
              "kind": "ENUM",
              "name": "OrderDirection"
            },
            "defaultValue": "ASC"
          }
        ],
        "isOneOf": false
      },
      {
        "kind": "INPUT_OBJECT",
        "name": "DomainsWhereInput",
        "inputFields": [
          {
            "name": "canonical",
            "type": {
              "kind": "SCALAR",
              "name": "Boolean"
            },
            "defaultValue": "false"
          },
          {
            "name": "name",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "SCALAR",
                "name": "String"
              }
            }
          }
        ],
        "isOneOf": false
      },
      {
        "kind": "OBJECT",
        "name": "ENSv1Domain",
        "fields": [
          {
            "name": "events",
            "type": {
              "kind": "OBJECT",
              "name": "DomainEventsConnection"
            },
            "args": [
              {
                "name": "after",
                "type": {
                  "kind": "SCALAR",
                  "name": "String"
                }
              },
              {
                "name": "before",
                "type": {
                  "kind": "SCALAR",
                  "name": "String"
                }
              },
              {
                "name": "first",
                "type": {
                  "kind": "SCALAR",
                  "name": "Int"
                }
              },
              {
                "name": "last",
                "type": {
                  "kind": "SCALAR",
                  "name": "Int"
                }
              },
              {
                "name": "where",
                "type": {
                  "kind": "INPUT_OBJECT",
                  "name": "EventsWhereInput"
                }
              }
            ],
            "isDeprecated": false
          },
          {
            "name": "id",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "SCALAR",
                "name": "DomainId"
              }
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "label",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "OBJECT",
                "name": "Label"
              }
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "name",
            "type": {
              "kind": "SCALAR",
              "name": "InterpretedName"
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "owner",
            "type": {
              "kind": "OBJECT",
              "name": "Account"
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "parent",
            "type": {
              "kind": "OBJECT",
              "name": "ENSv1Domain"
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "path",
            "type": {
              "kind": "LIST",
              "ofType": {
                "kind": "NON_NULL",
                "ofType": {
                  "kind": "INTERFACE",
                  "name": "Domain"
                }
              }
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "registration",
            "type": {
              "kind": "INTERFACE",
              "name": "Registration"
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "registrations",
            "type": {
              "kind": "OBJECT",
              "name": "DomainRegistrationsConnection"
            },
            "args": [
              {
                "name": "after",
                "type": {
                  "kind": "SCALAR",
                  "name": "String"
                }
              },
              {
                "name": "before",
                "type": {
                  "kind": "SCALAR",
                  "name": "String"
                }
              },
              {
                "name": "first",
                "type": {
                  "kind": "SCALAR",
                  "name": "Int"
                }
              },
              {
                "name": "last",
                "type": {
                  "kind": "SCALAR",
                  "name": "Int"
                }
              }
            ],
            "isDeprecated": false
          },
          {
            "name": "resolver",
            "type": {
              "kind": "OBJECT",
              "name": "Resolver"
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "rootRegistryOwner",
            "type": {
              "kind": "OBJECT",
              "name": "Account"
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "subdomains",
            "type": {
              "kind": "OBJECT",
              "name": "DomainSubdomainsConnection"
            },
            "args": [
              {
                "name": "after",
                "type": {
                  "kind": "SCALAR",
                  "name": "String"
                }
              },
              {
                "name": "before",
                "type": {
                  "kind": "SCALAR",
                  "name": "String"
                }
              },
              {
                "name": "first",
                "type": {
                  "kind": "SCALAR",
                  "name": "Int"
                }
              },
              {
                "name": "last",
                "type": {
                  "kind": "SCALAR",
                  "name": "Int"
                }
              },
              {
                "name": "order",
                "type": {
                  "kind": "INPUT_OBJECT",
                  "name": "DomainsOrderInput"
                }
              },
              {
                "name": "where",
                "type": {
                  "kind": "INPUT_OBJECT",
                  "name": "SubdomainsWhereInput"
                }
              }
            ],
            "isDeprecated": false
          }
        ],
        "interfaces": [
          {
            "kind": "INTERFACE",
            "name": "Domain"
          }
        ]
      },
      {
        "kind": "OBJECT",
        "name": "ENSv2Domain",
        "fields": [
          {
            "name": "events",
            "type": {
              "kind": "OBJECT",
              "name": "DomainEventsConnection"
            },
            "args": [
              {
                "name": "after",
                "type": {
                  "kind": "SCALAR",
                  "name": "String"
                }
              },
              {
                "name": "before",
                "type": {
                  "kind": "SCALAR",
                  "name": "String"
                }
              },
              {
                "name": "first",
                "type": {
                  "kind": "SCALAR",
                  "name": "Int"
                }
              },
              {
                "name": "last",
                "type": {
                  "kind": "SCALAR",
                  "name": "Int"
                }
              },
              {
                "name": "where",
                "type": {
                  "kind": "INPUT_OBJECT",
                  "name": "EventsWhereInput"
                }
              }
            ],
            "isDeprecated": false
          },
          {
            "name": "id",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "SCALAR",
                "name": "DomainId"
              }
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "label",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "OBJECT",
                "name": "Label"
              }
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "name",
            "type": {
              "kind": "SCALAR",
              "name": "InterpretedName"
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "owner",
            "type": {
              "kind": "OBJECT",
              "name": "Account"
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "path",
            "type": {
              "kind": "LIST",
              "ofType": {
                "kind": "NON_NULL",
                "ofType": {
                  "kind": "INTERFACE",
                  "name": "Domain"
                }
              }
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "permissions",
            "type": {
              "kind": "OBJECT",
              "name": "ENSv2DomainPermissionsConnection"
            },
            "args": [
              {
                "name": "after",
                "type": {
                  "kind": "SCALAR",
                  "name": "String"
                }
              },
              {
                "name": "before",
                "type": {
                  "kind": "SCALAR",
                  "name": "String"
                }
              },
              {
                "name": "first",
                "type": {
                  "kind": "SCALAR",
                  "name": "Int"
                }
              },
              {
                "name": "last",
                "type": {
                  "kind": "SCALAR",
                  "name": "Int"
                }
              },
              {
                "name": "where",
                "type": {
                  "kind": "INPUT_OBJECT",
                  "name": "DomainPermissionsWhereInput"
                }
              }
            ],
            "isDeprecated": false
          },
          {
            "name": "registration",
            "type": {
              "kind": "INTERFACE",
              "name": "Registration"
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "registrations",
            "type": {
              "kind": "OBJECT",
              "name": "DomainRegistrationsConnection"
            },
            "args": [
              {
                "name": "after",
                "type": {
                  "kind": "SCALAR",
                  "name": "String"
                }
              },
              {
                "name": "before",
                "type": {
                  "kind": "SCALAR",
                  "name": "String"
                }
              },
              {
                "name": "first",
                "type": {
                  "kind": "SCALAR",
                  "name": "Int"
                }
              },
              {
                "name": "last",
                "type": {
                  "kind": "SCALAR",
                  "name": "Int"
                }
              }
            ],
            "isDeprecated": false
          },
          {
            "name": "registry",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "OBJECT",
                "name": "Registry"
              }
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "resolver",
            "type": {
              "kind": "OBJECT",
              "name": "Resolver"
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "subdomains",
            "type": {
              "kind": "OBJECT",
              "name": "DomainSubdomainsConnection"
            },
            "args": [
              {
                "name": "after",
                "type": {
                  "kind": "SCALAR",
                  "name": "String"
                }
              },
              {
                "name": "before",
                "type": {
                  "kind": "SCALAR",
                  "name": "String"
                }
              },
              {
                "name": "first",
                "type": {
                  "kind": "SCALAR",
                  "name": "Int"
                }
              },
              {
                "name": "last",
                "type": {
                  "kind": "SCALAR",
                  "name": "Int"
                }
              },
              {
                "name": "order",
                "type": {
                  "kind": "INPUT_OBJECT",
                  "name": "DomainsOrderInput"
                }
              },
              {
                "name": "where",
                "type": {
                  "kind": "INPUT_OBJECT",
                  "name": "SubdomainsWhereInput"
                }
              }
            ],
            "isDeprecated": false
          },
          {
            "name": "subregistry",
            "type": {
              "kind": "OBJECT",
              "name": "Registry"
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "tokenId",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "SCALAR",
                "name": "BigInt"
              }
            },
            "args": [],
            "isDeprecated": false
          }
        ],
        "interfaces": [
          {
            "kind": "INTERFACE",
            "name": "Domain"
          }
        ]
      },
      {
        "kind": "OBJECT",
        "name": "ENSv2DomainPermissionsConnection",
        "fields": [
          {
            "name": "edges",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "LIST",
                "ofType": {
                  "kind": "NON_NULL",
                  "ofType": {
                    "kind": "OBJECT",
                    "name": "ENSv2DomainPermissionsConnectionEdge"
                  }
                }
              }
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "pageInfo",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "OBJECT",
                "name": "PageInfo"
              }
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "totalCount",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "SCALAR",
                "name": "Int"
              }
            },
            "args": [],
            "isDeprecated": false
          }
        ],
        "interfaces": []
      },
      {
        "kind": "OBJECT",
        "name": "ENSv2DomainPermissionsConnectionEdge",
        "fields": [
          {
            "name": "cursor",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "SCALAR",
                "name": "String"
              }
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "node",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "OBJECT",
                "name": "PermissionsUser"
              }
            },
            "args": [],
            "isDeprecated": false
          }
        ],
        "interfaces": []
      },
      {
        "kind": "OBJECT",
        "name": "ENSv2RegistryRegistration",
        "fields": [
          {
            "name": "domain",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "INTERFACE",
                "name": "Domain"
              }
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "event",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "OBJECT",
                "name": "Event"
              }
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "expired",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "SCALAR",
                "name": "Boolean"
              }
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "expiry",
            "type": {
              "kind": "SCALAR",
              "name": "BigInt"
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "id",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "SCALAR",
                "name": "RegistrationId"
              }
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "referrer",
            "type": {
              "kind": "SCALAR",
              "name": "Hex"
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "registrant",
            "type": {
              "kind": "OBJECT",
              "name": "Account"
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "registrar",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "OBJECT",
                "name": "AccountId"
              }
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "renewals",
            "type": {
              "kind": "OBJECT",
              "name": "RegistrationRenewalsConnection"
            },
            "args": [
              {
                "name": "after",
                "type": {
                  "kind": "SCALAR",
                  "name": "String"
                }
              },
              {
                "name": "before",
                "type": {
                  "kind": "SCALAR",
                  "name": "String"
                }
              },
              {
                "name": "first",
                "type": {
                  "kind": "SCALAR",
                  "name": "Int"
                }
              },
              {
                "name": "last",
                "type": {
                  "kind": "SCALAR",
                  "name": "Int"
                }
              }
            ],
            "isDeprecated": false
          },
          {
            "name": "start",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "SCALAR",
                "name": "BigInt"
              }
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "unregistrant",
            "type": {
              "kind": "OBJECT",
              "name": "Account"
            },
            "args": [],
            "isDeprecated": false
          }
        ],
        "interfaces": [
          {
            "kind": "INTERFACE",
            "name": "Registration"
          }
        ]
      },
      {
        "kind": "OBJECT",
        "name": "ENSv2RegistryReservation",
        "fields": [
          {
            "name": "domain",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "INTERFACE",
                "name": "Domain"
              }
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "event",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "OBJECT",
                "name": "Event"
              }
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "expired",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "SCALAR",
                "name": "Boolean"
              }
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "expiry",
            "type": {
              "kind": "SCALAR",
              "name": "BigInt"
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "id",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "SCALAR",
                "name": "RegistrationId"
              }
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "referrer",
            "type": {
              "kind": "SCALAR",
              "name": "Hex"
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "registrant",
            "type": {
              "kind": "OBJECT",
              "name": "Account"
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "registrar",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "OBJECT",
                "name": "AccountId"
              }
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "renewals",
            "type": {
              "kind": "OBJECT",
              "name": "RegistrationRenewalsConnection"
            },
            "args": [
              {
                "name": "after",
                "type": {
                  "kind": "SCALAR",
                  "name": "String"
                }
              },
              {
                "name": "before",
                "type": {
                  "kind": "SCALAR",
                  "name": "String"
                }
              },
              {
                "name": "first",
                "type": {
                  "kind": "SCALAR",
                  "name": "Int"
                }
              },
              {
                "name": "last",
                "type": {
                  "kind": "SCALAR",
                  "name": "Int"
                }
              }
            ],
            "isDeprecated": false
          },
          {
            "name": "start",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "SCALAR",
                "name": "BigInt"
              }
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "unregistrant",
            "type": {
              "kind": "OBJECT",
              "name": "Account"
            },
            "args": [],
            "isDeprecated": false
          }
        ],
        "interfaces": [
          {
            "kind": "INTERFACE",
            "name": "Registration"
          }
        ]
      },
      {
        "kind": "OBJECT",
        "name": "Event",
        "fields": [
          {
            "name": "address",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "SCALAR",
                "name": "Address"
              }
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "blockHash",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "SCALAR",
                "name": "Hex"
              }
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "blockNumber",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "SCALAR",
                "name": "BigInt"
              }
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "chainId",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "SCALAR",
                "name": "ChainId"
              }
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "data",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "SCALAR",
                "name": "Hex"
              }
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "from",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "SCALAR",
                "name": "Address"
              }
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "id",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "SCALAR",
                "name": "ID"
              }
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "logIndex",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "SCALAR",
                "name": "Int"
              }
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "timestamp",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "SCALAR",
                "name": "BigInt"
              }
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "to",
            "type": {
              "kind": "SCALAR",
              "name": "Address"
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "topics",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "LIST",
                "ofType": {
                  "kind": "NON_NULL",
                  "ofType": {
                    "kind": "SCALAR",
                    "name": "Hex"
                  }
                }
              }
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "transactionHash",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "SCALAR",
                "name": "Hex"
              }
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "transactionIndex",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "SCALAR",
                "name": "Int"
              }
            },
            "args": [],
            "isDeprecated": false
          }
        ],
        "interfaces": []
      },
      {
        "kind": "INPUT_OBJECT",
        "name": "EventsWhereInput",
        "inputFields": [
          {
            "name": "from",
            "type": {
              "kind": "SCALAR",
              "name": "Address"
            }
          },
          {
            "name": "selector_in",
            "type": {
              "kind": "LIST",
              "ofType": {
                "kind": "NON_NULL",
                "ofType": {
                  "kind": "SCALAR",
                  "name": "Hex"
                }
              }
            }
          },
          {
            "name": "timestamp_gte",
            "type": {
              "kind": "SCALAR",
              "name": "BigInt"
            }
          },
          {
            "name": "timestamp_lte",
            "type": {
              "kind": "SCALAR",
              "name": "BigInt"
            }
          }
        ],
        "isOneOf": false
      },
      {
        "kind": "SCALAR",
        "name": "Hex"
      },
      {
        "kind": "SCALAR",
        "name": "ID"
      },
      {
        "kind": "SCALAR",
        "name": "Int"
      },
      {
        "kind": "SCALAR",
        "name": "InterpretedLabel"
      },
      {
        "kind": "SCALAR",
        "name": "InterpretedName"
      },
      {
        "kind": "OBJECT",
        "name": "Label",
        "fields": [
          {
            "name": "hash",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "SCALAR",
                "name": "Hex"
              }
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "interpreted",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "SCALAR",
                "name": "InterpretedLabel"
              }
            },
            "args": [],
            "isDeprecated": false
          }
        ],
        "interfaces": []
      },
      {
        "kind": "INPUT_OBJECT",
        "name": "NameOrNodeInput",
        "inputFields": [
          {
            "name": "name",
            "type": {
              "kind": "SCALAR",
              "name": "InterpretedName"
            }
          },
          {
            "name": "node",
            "type": {
              "kind": "SCALAR",
              "name": "Node"
            }
          }
        ],
        "isOneOf": true
      },
      {
        "kind": "OBJECT",
        "name": "NameWrapperRegistration",
        "fields": [
          {
            "name": "domain",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "INTERFACE",
                "name": "Domain"
              }
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "event",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "OBJECT",
                "name": "Event"
              }
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "expired",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "SCALAR",
                "name": "Boolean"
              }
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "expiry",
            "type": {
              "kind": "SCALAR",
              "name": "BigInt"
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "fuses",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "SCALAR",
                "name": "Int"
              }
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "id",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "SCALAR",
                "name": "RegistrationId"
              }
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "referrer",
            "type": {
              "kind": "SCALAR",
              "name": "Hex"
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "registrant",
            "type": {
              "kind": "OBJECT",
              "name": "Account"
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "registrar",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "OBJECT",
                "name": "AccountId"
              }
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "renewals",
            "type": {
              "kind": "OBJECT",
              "name": "RegistrationRenewalsConnection"
            },
            "args": [
              {
                "name": "after",
                "type": {
                  "kind": "SCALAR",
                  "name": "String"
                }
              },
              {
                "name": "before",
                "type": {
                  "kind": "SCALAR",
                  "name": "String"
                }
              },
              {
                "name": "first",
                "type": {
                  "kind": "SCALAR",
                  "name": "Int"
                }
              },
              {
                "name": "last",
                "type": {
                  "kind": "SCALAR",
                  "name": "Int"
                }
              }
            ],
            "isDeprecated": false
          },
          {
            "name": "start",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "SCALAR",
                "name": "BigInt"
              }
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "unregistrant",
            "type": {
              "kind": "OBJECT",
              "name": "Account"
            },
            "args": [],
            "isDeprecated": false
          }
        ],
        "interfaces": [
          {
            "kind": "INTERFACE",
            "name": "Registration"
          }
        ]
      },
      {
        "kind": "SCALAR",
        "name": "Node"
      },
      {
        "kind": "ENUM",
        "name": "OrderDirection",
        "enumValues": [
          {
            "name": "ASC",
            "isDeprecated": false
          },
          {
            "name": "DESC",
            "isDeprecated": false
          }
        ]
      },
      {
        "kind": "OBJECT",
        "name": "PageInfo",
        "fields": [
          {
            "name": "endCursor",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "hasNextPage",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "SCALAR",
                "name": "Boolean"
              }
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "hasPreviousPage",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "SCALAR",
                "name": "Boolean"
              }
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "startCursor",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            },
            "args": [],
            "isDeprecated": false
          }
        ],
        "interfaces": []
      },
      {
        "kind": "OBJECT",
        "name": "Permissions",
        "fields": [
          {
            "name": "contract",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "OBJECT",
                "name": "AccountId"
              }
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "events",
            "type": {
              "kind": "OBJECT",
              "name": "PermissionsEventsConnection"
            },
            "args": [
              {
                "name": "after",
                "type": {
                  "kind": "SCALAR",
                  "name": "String"
                }
              },
              {
                "name": "before",
                "type": {
                  "kind": "SCALAR",
                  "name": "String"
                }
              },
              {
                "name": "first",
                "type": {
                  "kind": "SCALAR",
                  "name": "Int"
                }
              },
              {
                "name": "last",
                "type": {
                  "kind": "SCALAR",
                  "name": "Int"
                }
              },
              {
                "name": "where",
                "type": {
                  "kind": "INPUT_OBJECT",
                  "name": "EventsWhereInput"
                }
              }
            ],
            "isDeprecated": false
          },
          {
            "name": "id",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "SCALAR",
                "name": "PermissionsId"
              }
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "resources",
            "type": {
              "kind": "OBJECT",
              "name": "PermissionsResourcesConnection"
            },
            "args": [
              {
                "name": "after",
                "type": {
                  "kind": "SCALAR",
                  "name": "String"
                }
              },
              {
                "name": "before",
                "type": {
                  "kind": "SCALAR",
                  "name": "String"
                }
              },
              {
                "name": "first",
                "type": {
                  "kind": "SCALAR",
                  "name": "Int"
                }
              },
              {
                "name": "last",
                "type": {
                  "kind": "SCALAR",
                  "name": "Int"
                }
              }
            ],
            "isDeprecated": false
          },
          {
            "name": "root",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "OBJECT",
                "name": "PermissionsResource"
              }
            },
            "args": [],
            "isDeprecated": false
          }
        ],
        "interfaces": []
      },
      {
        "kind": "OBJECT",
        "name": "PermissionsEventsConnection",
        "fields": [
          {
            "name": "edges",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "LIST",
                "ofType": {
                  "kind": "NON_NULL",
                  "ofType": {
                    "kind": "OBJECT",
                    "name": "PermissionsEventsConnectionEdge"
                  }
                }
              }
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "pageInfo",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "OBJECT",
                "name": "PageInfo"
              }
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "totalCount",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "SCALAR",
                "name": "Int"
              }
            },
            "args": [],
            "isDeprecated": false
          }
        ],
        "interfaces": []
      },
      {
        "kind": "OBJECT",
        "name": "PermissionsEventsConnectionEdge",
        "fields": [
          {
            "name": "cursor",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "SCALAR",
                "name": "String"
              }
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "node",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "OBJECT",
                "name": "Event"
              }
            },
            "args": [],
            "isDeprecated": false
          }
        ],
        "interfaces": []
      },
      {
        "kind": "SCALAR",
        "name": "PermissionsId"
      },
      {
        "kind": "INPUT_OBJECT",
        "name": "PermissionsIdInput",
        "inputFields": [
          {
            "name": "contract",
            "type": {
              "kind": "INPUT_OBJECT",
              "name": "AccountIdInput"
            }
          },
          {
            "name": "id",
            "type": {
              "kind": "SCALAR",
              "name": "PermissionsId"
            }
          }
        ],
        "isOneOf": true
      },
      {
        "kind": "OBJECT",
        "name": "PermissionsResource",
        "fields": [
          {
            "name": "contract",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "OBJECT",
                "name": "AccountId"
              }
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "id",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "SCALAR",
                "name": "PermissionsResourceId"
              }
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "permissions",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "OBJECT",
                "name": "Permissions"
              }
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "resource",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "SCALAR",
                "name": "BigInt"
              }
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "users",
            "type": {
              "kind": "OBJECT",
              "name": "PermissionsResourceUsersConnection"
            },
            "args": [
              {
                "name": "after",
                "type": {
                  "kind": "SCALAR",
                  "name": "String"
                }
              },
              {
                "name": "before",
                "type": {
                  "kind": "SCALAR",
                  "name": "String"
                }
              },
              {
                "name": "first",
                "type": {
                  "kind": "SCALAR",
                  "name": "Int"
                }
              },
              {
                "name": "last",
                "type": {
                  "kind": "SCALAR",
                  "name": "Int"
                }
              }
            ],
            "isDeprecated": false
          }
        ],
        "interfaces": []
      },
      {
        "kind": "SCALAR",
        "name": "PermissionsResourceId"
      },
      {
        "kind": "OBJECT",
        "name": "PermissionsResourceUsersConnection",
        "fields": [
          {
            "name": "edges",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "LIST",
                "ofType": {
                  "kind": "NON_NULL",
                  "ofType": {
                    "kind": "OBJECT",
                    "name": "PermissionsResourceUsersConnectionEdge"
                  }
                }
              }
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "pageInfo",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "OBJECT",
                "name": "PageInfo"
              }
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "totalCount",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "SCALAR",
                "name": "Int"
              }
            },
            "args": [],
            "isDeprecated": false
          }
        ],
        "interfaces": []
      },
      {
        "kind": "OBJECT",
        "name": "PermissionsResourceUsersConnectionEdge",
        "fields": [
          {
            "name": "cursor",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "SCALAR",
                "name": "String"
              }
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "node",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "OBJECT",
                "name": "PermissionsUser"
              }
            },
            "args": [],
            "isDeprecated": false
          }
        ],
        "interfaces": []
      },
      {
        "kind": "OBJECT",
        "name": "PermissionsResourcesConnection",
        "fields": [
          {
            "name": "edges",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "LIST",
                "ofType": {
                  "kind": "NON_NULL",
                  "ofType": {
                    "kind": "OBJECT",
                    "name": "PermissionsResourcesConnectionEdge"
                  }
                }
              }
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "pageInfo",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "OBJECT",
                "name": "PageInfo"
              }
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "totalCount",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "SCALAR",
                "name": "Int"
              }
            },
            "args": [],
            "isDeprecated": false
          }
        ],
        "interfaces": []
      },
      {
        "kind": "OBJECT",
        "name": "PermissionsResourcesConnectionEdge",
        "fields": [
          {
            "name": "cursor",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "SCALAR",
                "name": "String"
              }
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "node",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "OBJECT",
                "name": "PermissionsResource"
              }
            },
            "args": [],
            "isDeprecated": false
          }
        ],
        "interfaces": []
      },
      {
        "kind": "OBJECT",
        "name": "PermissionsUser",
        "fields": [
          {
            "name": "contract",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "OBJECT",
                "name": "AccountId"
              }
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "id",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "SCALAR",
                "name": "PermissionsUserId"
              }
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "resource",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "SCALAR",
                "name": "BigInt"
              }
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "roles",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "SCALAR",
                "name": "BigInt"
              }
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "user",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "OBJECT",
                "name": "Account"
              }
            },
            "args": [],
            "isDeprecated": false
          }
        ],
        "interfaces": []
      },
      {
        "kind": "SCALAR",
        "name": "PermissionsUserId"
      },
      {
        "kind": "OBJECT",
        "name": "Query",
        "fields": [
          {
            "name": "account",
            "type": {
              "kind": "OBJECT",
              "name": "Account"
            },
            "args": [
              {
                "name": "by",
                "type": {
                  "kind": "NON_NULL",
                  "ofType": {
                    "kind": "INPUT_OBJECT",
                    "name": "AccountByInput"
                  }
                }
              }
            ],
            "isDeprecated": false
          },
          {
            "name": "domain",
            "type": {
              "kind": "INTERFACE",
              "name": "Domain"
            },
            "args": [
              {
                "name": "by",
                "type": {
                  "kind": "NON_NULL",
                  "ofType": {
                    "kind": "INPUT_OBJECT",
                    "name": "DomainIdInput"
                  }
                }
              }
            ],
            "isDeprecated": false
          },
          {
            "name": "domains",
            "type": {
              "kind": "OBJECT",
              "name": "QueryDomainsConnection"
            },
            "args": [
              {
                "name": "after",
                "type": {
                  "kind": "SCALAR",
                  "name": "String"
                }
              },
              {
                "name": "before",
                "type": {
                  "kind": "SCALAR",
                  "name": "String"
                }
              },
              {
                "name": "first",
                "type": {
                  "kind": "SCALAR",
                  "name": "Int"
                }
              },
              {
                "name": "last",
                "type": {
                  "kind": "SCALAR",
                  "name": "Int"
                }
              },
              {
                "name": "order",
                "type": {
                  "kind": "INPUT_OBJECT",
                  "name": "DomainsOrderInput"
                }
              },
              {
                "name": "where",
                "type": {
                  "kind": "NON_NULL",
                  "ofType": {
                    "kind": "INPUT_OBJECT",
                    "name": "DomainsWhereInput"
                  }
                }
              }
            ],
            "isDeprecated": false
          },
          {
            "name": "permissions",
            "type": {
              "kind": "OBJECT",
              "name": "Permissions"
            },
            "args": [
              {
                "name": "by",
                "type": {
                  "kind": "NON_NULL",
                  "ofType": {
                    "kind": "INPUT_OBJECT",
                    "name": "PermissionsIdInput"
                  }
                }
              }
            ],
            "isDeprecated": false
          },
          {
            "name": "registrations",
            "type": {
              "kind": "OBJECT",
              "name": "QueryRegistrationsConnection"
            },
            "args": [
              {
                "name": "after",
                "type": {
                  "kind": "SCALAR",
                  "name": "String"
                }
              },
              {
                "name": "before",
                "type": {
                  "kind": "SCALAR",
                  "name": "String"
                }
              },
              {
                "name": "first",
                "type": {
                  "kind": "SCALAR",
                  "name": "Int"
                }
              },
              {
                "name": "last",
                "type": {
                  "kind": "SCALAR",
                  "name": "Int"
                }
              }
            ],
            "isDeprecated": false
          },
          {
            "name": "registry",
            "type": {
              "kind": "OBJECT",
              "name": "Registry"
            },
            "args": [
              {
                "name": "by",
                "type": {
                  "kind": "NON_NULL",
                  "ofType": {
                    "kind": "INPUT_OBJECT",
                    "name": "RegistryIdInput"
                  }
                }
              }
            ],
            "isDeprecated": false
          },
          {
            "name": "resolver",
            "type": {
              "kind": "OBJECT",
              "name": "Resolver"
            },
            "args": [
              {
                "name": "by",
                "type": {
                  "kind": "NON_NULL",
                  "ofType": {
                    "kind": "INPUT_OBJECT",
                    "name": "ResolverIdInput"
                  }
                }
              }
            ],
            "isDeprecated": false
          },
          {
            "name": "resolvers",
            "type": {
              "kind": "OBJECT",
              "name": "QueryResolversConnection"
            },
            "args": [
              {
                "name": "after",
                "type": {
                  "kind": "SCALAR",
                  "name": "String"
                }
              },
              {
                "name": "before",
                "type": {
                  "kind": "SCALAR",
                  "name": "String"
                }
              },
              {
                "name": "first",
                "type": {
                  "kind": "SCALAR",
                  "name": "Int"
                }
              },
              {
                "name": "last",
                "type": {
                  "kind": "SCALAR",
                  "name": "Int"
                }
              }
            ],
            "isDeprecated": false
          },
          {
            "name": "root",
            "type": {
              "kind": "OBJECT",
              "name": "Registry"
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "v1Domains",
            "type": {
              "kind": "OBJECT",
              "name": "QueryV1DomainsConnection"
            },
            "args": [
              {
                "name": "after",
                "type": {
                  "kind": "SCALAR",
                  "name": "String"
                }
              },
              {
                "name": "before",
                "type": {
                  "kind": "SCALAR",
                  "name": "String"
                }
              },
              {
                "name": "first",
                "type": {
                  "kind": "SCALAR",
                  "name": "Int"
                }
              },
              {
                "name": "last",
                "type": {
                  "kind": "SCALAR",
                  "name": "Int"
                }
              }
            ],
            "isDeprecated": false
          },
          {
            "name": "v2Domains",
            "type": {
              "kind": "OBJECT",
              "name": "QueryV2DomainsConnection"
            },
            "args": [
              {
                "name": "after",
                "type": {
                  "kind": "SCALAR",
                  "name": "String"
                }
              },
              {
                "name": "before",
                "type": {
                  "kind": "SCALAR",
                  "name": "String"
                }
              },
              {
                "name": "first",
                "type": {
                  "kind": "SCALAR",
                  "name": "Int"
                }
              },
              {
                "name": "last",
                "type": {
                  "kind": "SCALAR",
                  "name": "Int"
                }
              }
            ],
            "isDeprecated": false
          }
        ],
        "interfaces": []
      },
      {
        "kind": "OBJECT",
        "name": "QueryDomainsConnection",
        "fields": [
          {
            "name": "edges",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "LIST",
                "ofType": {
                  "kind": "NON_NULL",
                  "ofType": {
                    "kind": "OBJECT",
                    "name": "QueryDomainsConnectionEdge"
                  }
                }
              }
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "pageInfo",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "OBJECT",
                "name": "PageInfo"
              }
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "totalCount",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "SCALAR",
                "name": "Int"
              }
            },
            "args": [],
            "isDeprecated": false
          }
        ],
        "interfaces": []
      },
      {
        "kind": "OBJECT",
        "name": "QueryDomainsConnectionEdge",
        "fields": [
          {
            "name": "cursor",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "SCALAR",
                "name": "String"
              }
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "node",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "INTERFACE",
                "name": "Domain"
              }
            },
            "args": [],
            "isDeprecated": false
          }
        ],
        "interfaces": []
      },
      {
        "kind": "OBJECT",
        "name": "QueryRegistrationsConnection",
        "fields": [
          {
            "name": "edges",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "LIST",
                "ofType": {
                  "kind": "NON_NULL",
                  "ofType": {
                    "kind": "OBJECT",
                    "name": "QueryRegistrationsConnectionEdge"
                  }
                }
              }
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "pageInfo",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "OBJECT",
                "name": "PageInfo"
              }
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "totalCount",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "SCALAR",
                "name": "Int"
              }
            },
            "args": [],
            "isDeprecated": false
          }
        ],
        "interfaces": []
      },
      {
        "kind": "OBJECT",
        "name": "QueryRegistrationsConnectionEdge",
        "fields": [
          {
            "name": "cursor",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "SCALAR",
                "name": "String"
              }
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "node",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "INTERFACE",
                "name": "Registration"
              }
            },
            "args": [],
            "isDeprecated": false
          }
        ],
        "interfaces": []
      },
      {
        "kind": "OBJECT",
        "name": "QueryResolversConnection",
        "fields": [
          {
            "name": "edges",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "LIST",
                "ofType": {
                  "kind": "NON_NULL",
                  "ofType": {
                    "kind": "OBJECT",
                    "name": "QueryResolversConnectionEdge"
                  }
                }
              }
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "pageInfo",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "OBJECT",
                "name": "PageInfo"
              }
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "totalCount",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "SCALAR",
                "name": "Int"
              }
            },
            "args": [],
            "isDeprecated": false
          }
        ],
        "interfaces": []
      },
      {
        "kind": "OBJECT",
        "name": "QueryResolversConnectionEdge",
        "fields": [
          {
            "name": "cursor",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "SCALAR",
                "name": "String"
              }
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "node",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "OBJECT",
                "name": "Resolver"
              }
            },
            "args": [],
            "isDeprecated": false
          }
        ],
        "interfaces": []
      },
      {
        "kind": "OBJECT",
        "name": "QueryV1DomainsConnection",
        "fields": [
          {
            "name": "edges",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "LIST",
                "ofType": {
                  "kind": "NON_NULL",
                  "ofType": {
                    "kind": "OBJECT",
                    "name": "QueryV1DomainsConnectionEdge"
                  }
                }
              }
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "pageInfo",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "OBJECT",
                "name": "PageInfo"
              }
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "totalCount",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "SCALAR",
                "name": "Int"
              }
            },
            "args": [],
            "isDeprecated": false
          }
        ],
        "interfaces": []
      },
      {
        "kind": "OBJECT",
        "name": "QueryV1DomainsConnectionEdge",
        "fields": [
          {
            "name": "cursor",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "SCALAR",
                "name": "String"
              }
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "node",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "OBJECT",
                "name": "ENSv1Domain"
              }
            },
            "args": [],
            "isDeprecated": false
          }
        ],
        "interfaces": []
      },
      {
        "kind": "OBJECT",
        "name": "QueryV2DomainsConnection",
        "fields": [
          {
            "name": "edges",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "LIST",
                "ofType": {
                  "kind": "NON_NULL",
                  "ofType": {
                    "kind": "OBJECT",
                    "name": "QueryV2DomainsConnectionEdge"
                  }
                }
              }
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "pageInfo",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "OBJECT",
                "name": "PageInfo"
              }
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "totalCount",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "SCALAR",
                "name": "Int"
              }
            },
            "args": [],
            "isDeprecated": false
          }
        ],
        "interfaces": []
      },
      {
        "kind": "OBJECT",
        "name": "QueryV2DomainsConnectionEdge",
        "fields": [
          {
            "name": "cursor",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "SCALAR",
                "name": "String"
              }
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "node",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "OBJECT",
                "name": "ENSv2Domain"
              }
            },
            "args": [],
            "isDeprecated": false
          }
        ],
        "interfaces": []
      },
      {
        "kind": "INTERFACE",
        "name": "Registration",
        "fields": [
          {
            "name": "domain",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "INTERFACE",
                "name": "Domain"
              }
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "event",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "OBJECT",
                "name": "Event"
              }
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "expired",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "SCALAR",
                "name": "Boolean"
              }
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "expiry",
            "type": {
              "kind": "SCALAR",
              "name": "BigInt"
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "id",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "SCALAR",
                "name": "RegistrationId"
              }
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "referrer",
            "type": {
              "kind": "SCALAR",
              "name": "Hex"
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "registrant",
            "type": {
              "kind": "OBJECT",
              "name": "Account"
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "registrar",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "OBJECT",
                "name": "AccountId"
              }
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "renewals",
            "type": {
              "kind": "OBJECT",
              "name": "RegistrationRenewalsConnection"
            },
            "args": [
              {
                "name": "after",
                "type": {
                  "kind": "SCALAR",
                  "name": "String"
                }
              },
              {
                "name": "before",
                "type": {
                  "kind": "SCALAR",
                  "name": "String"
                }
              },
              {
                "name": "first",
                "type": {
                  "kind": "SCALAR",
                  "name": "Int"
                }
              },
              {
                "name": "last",
                "type": {
                  "kind": "SCALAR",
                  "name": "Int"
                }
              }
            ],
            "isDeprecated": false
          },
          {
            "name": "start",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "SCALAR",
                "name": "BigInt"
              }
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "unregistrant",
            "type": {
              "kind": "OBJECT",
              "name": "Account"
            },
            "args": [],
            "isDeprecated": false
          }
        ],
        "interfaces": [],
        "possibleTypes": [
          {
            "kind": "OBJECT",
            "name": "BaseRegistrarRegistration"
          },
          {
            "kind": "OBJECT",
            "name": "ENSv2RegistryRegistration"
          },
          {
            "kind": "OBJECT",
            "name": "ENSv2RegistryReservation"
          },
          {
            "kind": "OBJECT",
            "name": "NameWrapperRegistration"
          },
          {
            "kind": "OBJECT",
            "name": "ThreeDNSRegistration"
          }
        ]
      },
      {
        "kind": "SCALAR",
        "name": "RegistrationId"
      },
      {
        "kind": "OBJECT",
        "name": "RegistrationRenewalsConnection",
        "fields": [
          {
            "name": "edges",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "LIST",
                "ofType": {
                  "kind": "NON_NULL",
                  "ofType": {
                    "kind": "OBJECT",
                    "name": "RegistrationRenewalsConnectionEdge"
                  }
                }
              }
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "pageInfo",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "OBJECT",
                "name": "PageInfo"
              }
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "totalCount",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "SCALAR",
                "name": "Int"
              }
            },
            "args": [],
            "isDeprecated": false
          }
        ],
        "interfaces": []
      },
      {
        "kind": "OBJECT",
        "name": "RegistrationRenewalsConnectionEdge",
        "fields": [
          {
            "name": "cursor",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "SCALAR",
                "name": "String"
              }
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "node",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "OBJECT",
                "name": "Renewal"
              }
            },
            "args": [],
            "isDeprecated": false
          }
        ],
        "interfaces": []
      },
      {
        "kind": "OBJECT",
        "name": "Registry",
        "fields": [
          {
            "name": "contract",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "OBJECT",
                "name": "AccountId"
              }
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "domains",
            "type": {
              "kind": "OBJECT",
              "name": "RegistryDomainsConnection"
            },
            "args": [
              {
                "name": "after",
                "type": {
                  "kind": "SCALAR",
                  "name": "String"
                }
              },
              {
                "name": "before",
                "type": {
                  "kind": "SCALAR",
                  "name": "String"
                }
              },
              {
                "name": "first",
                "type": {
                  "kind": "SCALAR",
                  "name": "Int"
                }
              },
              {
                "name": "last",
                "type": {
                  "kind": "SCALAR",
                  "name": "Int"
                }
              },
              {
                "name": "order",
                "type": {
                  "kind": "INPUT_OBJECT",
                  "name": "DomainsOrderInput"
                }
              },
              {
                "name": "where",
                "type": {
                  "kind": "INPUT_OBJECT",
                  "name": "RegistryDomainsWhereInput"
                }
              }
            ],
            "isDeprecated": false
          },
          {
            "name": "id",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "SCALAR",
                "name": "RegistryId"
              }
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "parents",
            "type": {
              "kind": "OBJECT",
              "name": "RegistryParentsConnection"
            },
            "args": [
              {
                "name": "after",
                "type": {
                  "kind": "SCALAR",
                  "name": "String"
                }
              },
              {
                "name": "before",
                "type": {
                  "kind": "SCALAR",
                  "name": "String"
                }
              },
              {
                "name": "first",
                "type": {
                  "kind": "SCALAR",
                  "name": "Int"
                }
              },
              {
                "name": "last",
                "type": {
                  "kind": "SCALAR",
                  "name": "Int"
                }
              }
            ],
            "isDeprecated": false
          },
          {
            "name": "permissions",
            "type": {
              "kind": "OBJECT",
              "name": "Permissions"
            },
            "args": [],
            "isDeprecated": false
          }
        ],
        "interfaces": []
      },
      {
        "kind": "OBJECT",
        "name": "RegistryDomainsConnection",
        "fields": [
          {
            "name": "edges",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "LIST",
                "ofType": {
                  "kind": "NON_NULL",
                  "ofType": {
                    "kind": "OBJECT",
                    "name": "RegistryDomainsConnectionEdge"
                  }
                }
              }
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "pageInfo",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "OBJECT",
                "name": "PageInfo"
              }
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "totalCount",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "SCALAR",
                "name": "Int"
              }
            },
            "args": [],
            "isDeprecated": false
          }
        ],
        "interfaces": []
      },
      {
        "kind": "OBJECT",
        "name": "RegistryDomainsConnectionEdge",
        "fields": [
          {
            "name": "cursor",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "SCALAR",
                "name": "String"
              }
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "node",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "INTERFACE",
                "name": "Domain"
              }
            },
            "args": [],
            "isDeprecated": false
          }
        ],
        "interfaces": []
      },
      {
        "kind": "INPUT_OBJECT",
        "name": "RegistryDomainsWhereInput",
        "inputFields": [
          {
            "name": "name",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            }
          }
        ],
        "isOneOf": false
      },
      {
        "kind": "SCALAR",
        "name": "RegistryId"
      },
      {
        "kind": "INPUT_OBJECT",
        "name": "RegistryIdInput",
        "inputFields": [
          {
            "name": "contract",
            "type": {
              "kind": "INPUT_OBJECT",
              "name": "AccountIdInput"
            }
          },
          {
            "name": "id",
            "type": {
              "kind": "SCALAR",
              "name": "RegistryId"
            }
          }
        ],
        "isOneOf": true
      },
      {
        "kind": "OBJECT",
        "name": "RegistryParentsConnection",
        "fields": [
          {
            "name": "edges",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "LIST",
                "ofType": {
                  "kind": "NON_NULL",
                  "ofType": {
                    "kind": "OBJECT",
                    "name": "RegistryParentsConnectionEdge"
                  }
                }
              }
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "pageInfo",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "OBJECT",
                "name": "PageInfo"
              }
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "totalCount",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "SCALAR",
                "name": "Int"
              }
            },
            "args": [],
            "isDeprecated": false
          }
        ],
        "interfaces": []
      },
      {
        "kind": "OBJECT",
        "name": "RegistryParentsConnectionEdge",
        "fields": [
          {
            "name": "cursor",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "SCALAR",
                "name": "String"
              }
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "node",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "OBJECT",
                "name": "ENSv2Domain"
              }
            },
            "args": [],
            "isDeprecated": false
          }
        ],
        "interfaces": []
      },
      {
        "kind": "OBJECT",
        "name": "RegistryPermissionsUser",
        "fields": [
          {
            "name": "id",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "SCALAR",
                "name": "PermissionsUserId"
              }
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "registry",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "OBJECT",
                "name": "Registry"
              }
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "resource",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "SCALAR",
                "name": "BigInt"
              }
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "roles",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "SCALAR",
                "name": "BigInt"
              }
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "user",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "OBJECT",
                "name": "Account"
              }
            },
            "args": [],
            "isDeprecated": false
          }
        ],
        "interfaces": []
      },
      {
        "kind": "OBJECT",
        "name": "Renewal",
        "fields": [
          {
            "name": "base",
            "type": {
              "kind": "SCALAR",
              "name": "BigInt"
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "duration",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "SCALAR",
                "name": "BigInt"
              }
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "event",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "OBJECT",
                "name": "Event"
              }
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "id",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "SCALAR",
                "name": "RenewalId"
              }
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "premium",
            "type": {
              "kind": "SCALAR",
              "name": "BigInt"
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "referrer",
            "type": {
              "kind": "SCALAR",
              "name": "Hex"
            },
            "args": [],
            "isDeprecated": false
          }
        ],
        "interfaces": []
      },
      {
        "kind": "SCALAR",
        "name": "RenewalId"
      },
      {
        "kind": "OBJECT",
        "name": "Resolver",
        "fields": [
          {
            "name": "bridged",
            "type": {
              "kind": "OBJECT",
              "name": "AccountId"
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "contract",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "OBJECT",
                "name": "AccountId"
              }
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "events",
            "type": {
              "kind": "OBJECT",
              "name": "ResolverEventsConnection"
            },
            "args": [
              {
                "name": "after",
                "type": {
                  "kind": "SCALAR",
                  "name": "String"
                }
              },
              {
                "name": "before",
                "type": {
                  "kind": "SCALAR",
                  "name": "String"
                }
              },
              {
                "name": "first",
                "type": {
                  "kind": "SCALAR",
                  "name": "Int"
                }
              },
              {
                "name": "last",
                "type": {
                  "kind": "SCALAR",
                  "name": "Int"
                }
              },
              {
                "name": "where",
                "type": {
                  "kind": "INPUT_OBJECT",
                  "name": "EventsWhereInput"
                }
              }
            ],
            "isDeprecated": false
          },
          {
            "name": "id",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "SCALAR",
                "name": "ResolverId"
              }
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "permissions",
            "type": {
              "kind": "OBJECT",
              "name": "Permissions"
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "records",
            "type": {
              "kind": "OBJECT",
              "name": "ResolverRecordsConnection"
            },
            "args": [
              {
                "name": "after",
                "type": {
                  "kind": "SCALAR",
                  "name": "String"
                }
              },
              {
                "name": "before",
                "type": {
                  "kind": "SCALAR",
                  "name": "String"
                }
              },
              {
                "name": "first",
                "type": {
                  "kind": "SCALAR",
                  "name": "Int"
                }
              },
              {
                "name": "last",
                "type": {
                  "kind": "SCALAR",
                  "name": "Int"
                }
              }
            ],
            "isDeprecated": false
          },
          {
            "name": "records_",
            "type": {
              "kind": "OBJECT",
              "name": "ResolverRecords"
            },
            "args": [
              {
                "name": "by",
                "type": {
                  "kind": "NON_NULL",
                  "ofType": {
                    "kind": "INPUT_OBJECT",
                    "name": "NameOrNodeInput"
                  }
                }
              }
            ],
            "isDeprecated": false
          }
        ],
        "interfaces": []
      },
      {
        "kind": "OBJECT",
        "name": "ResolverEventsConnection",
        "fields": [
          {
            "name": "edges",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "LIST",
                "ofType": {
                  "kind": "NON_NULL",
                  "ofType": {
                    "kind": "OBJECT",
                    "name": "ResolverEventsConnectionEdge"
                  }
                }
              }
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "pageInfo",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "OBJECT",
                "name": "PageInfo"
              }
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "totalCount",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "SCALAR",
                "name": "Int"
              }
            },
            "args": [],
            "isDeprecated": false
          }
        ],
        "interfaces": []
      },
      {
        "kind": "OBJECT",
        "name": "ResolverEventsConnectionEdge",
        "fields": [
          {
            "name": "cursor",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "SCALAR",
                "name": "String"
              }
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "node",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "OBJECT",
                "name": "Event"
              }
            },
            "args": [],
            "isDeprecated": false
          }
        ],
        "interfaces": []
      },
      {
        "kind": "SCALAR",
        "name": "ResolverId"
      },
      {
        "kind": "INPUT_OBJECT",
        "name": "ResolverIdInput",
        "inputFields": [
          {
            "name": "contract",
            "type": {
              "kind": "INPUT_OBJECT",
              "name": "AccountIdInput"
            }
          },
          {
            "name": "id",
            "type": {
              "kind": "SCALAR",
              "name": "ResolverId"
            }
          }
        ],
        "isOneOf": true
      },
      {
        "kind": "OBJECT",
        "name": "ResolverPermissionsUser",
        "fields": [
          {
            "name": "id",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "SCALAR",
                "name": "PermissionsUserId"
              }
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "resolver",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "OBJECT",
                "name": "Resolver"
              }
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "resource",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "SCALAR",
                "name": "BigInt"
              }
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "roles",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "SCALAR",
                "name": "BigInt"
              }
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "user",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "OBJECT",
                "name": "Account"
              }
            },
            "args": [],
            "isDeprecated": false
          }
        ],
        "interfaces": []
      },
      {
        "kind": "OBJECT",
        "name": "ResolverRecords",
        "fields": [
          {
            "name": "coinTypes",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "LIST",
                "ofType": {
                  "kind": "NON_NULL",
                  "ofType": {
                    "kind": "SCALAR",
                    "name": "CoinType"
                  }
                }
              }
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "id",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "SCALAR",
                "name": "ResolverRecordsId"
              }
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "keys",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "LIST",
                "ofType": {
                  "kind": "NON_NULL",
                  "ofType": {
                    "kind": "SCALAR",
                    "name": "String"
                  }
                }
              }
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "name",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "node",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "SCALAR",
                "name": "Node"
              }
            },
            "args": [],
            "isDeprecated": false
          }
        ],
        "interfaces": []
      },
      {
        "kind": "OBJECT",
        "name": "ResolverRecordsConnection",
        "fields": [
          {
            "name": "edges",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "LIST",
                "ofType": {
                  "kind": "NON_NULL",
                  "ofType": {
                    "kind": "OBJECT",
                    "name": "ResolverRecordsConnectionEdge"
                  }
                }
              }
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "pageInfo",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "OBJECT",
                "name": "PageInfo"
              }
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "totalCount",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "SCALAR",
                "name": "Int"
              }
            },
            "args": [],
            "isDeprecated": false
          }
        ],
        "interfaces": []
      },
      {
        "kind": "OBJECT",
        "name": "ResolverRecordsConnectionEdge",
        "fields": [
          {
            "name": "cursor",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "SCALAR",
                "name": "String"
              }
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "node",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "OBJECT",
                "name": "ResolverRecords"
              }
            },
            "args": [],
            "isDeprecated": false
          }
        ],
        "interfaces": []
      },
      {
        "kind": "SCALAR",
        "name": "ResolverRecordsId"
      },
      {
        "kind": "SCALAR",
        "name": "String"
      },
      {
        "kind": "INPUT_OBJECT",
        "name": "SubdomainsWhereInput",
        "inputFields": [
          {
            "name": "name",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            }
          }
        ],
        "isOneOf": false
      },
      {
        "kind": "OBJECT",
        "name": "ThreeDNSRegistration",
        "fields": [
          {
            "name": "domain",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "INTERFACE",
                "name": "Domain"
              }
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "event",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "OBJECT",
                "name": "Event"
              }
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "expired",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "SCALAR",
                "name": "Boolean"
              }
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "expiry",
            "type": {
              "kind": "SCALAR",
              "name": "BigInt"
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "id",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "SCALAR",
                "name": "RegistrationId"
              }
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "referrer",
            "type": {
              "kind": "SCALAR",
              "name": "Hex"
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "registrant",
            "type": {
              "kind": "OBJECT",
              "name": "Account"
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "registrar",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "OBJECT",
                "name": "AccountId"
              }
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "renewals",
            "type": {
              "kind": "OBJECT",
              "name": "RegistrationRenewalsConnection"
            },
            "args": [
              {
                "name": "after",
                "type": {
                  "kind": "SCALAR",
                  "name": "String"
                }
              },
              {
                "name": "before",
                "type": {
                  "kind": "SCALAR",
                  "name": "String"
                }
              },
              {
                "name": "first",
                "type": {
                  "kind": "SCALAR",
                  "name": "Int"
                }
              },
              {
                "name": "last",
                "type": {
                  "kind": "SCALAR",
                  "name": "Int"
                }
              }
            ],
            "isDeprecated": false
          },
          {
            "name": "start",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "SCALAR",
                "name": "BigInt"
              }
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "unregistrant",
            "type": {
              "kind": "OBJECT",
              "name": "Account"
            },
            "args": [],
            "isDeprecated": false
          }
        ],
        "interfaces": [
          {
            "kind": "INTERFACE",
            "name": "Registration"
          }
        ]
      },
      {
        "kind": "OBJECT",
        "name": "WrappedBaseRegistrarRegistration",
        "fields": [
          {
            "name": "fuses",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "SCALAR",
                "name": "Int"
              }
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "tokenId",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "SCALAR",
                "name": "BigInt"
              }
            },
            "args": [],
            "isDeprecated": false
          }
        ],
        "interfaces": []
      }
    ],
    "directives": []
  }
} as const;

export { introspection };