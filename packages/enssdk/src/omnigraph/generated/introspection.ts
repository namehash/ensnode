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
        "name": "AccelerationStatus",
        "fields": [
          {
            "name": "attempted",
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
            "name": "requested",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "SCALAR",
                "name": "Boolean"
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
            "name": "nameReferences",
            "type": {
              "kind": "OBJECT",
              "name": "AccountNameReferencesConnection"
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
                  "name": "AccountNameReferencesWhereInput"
                }
              }
            ],
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
                  "name": "AccountPermissionsWhereInput"
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
            "name": "resolve",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "OBJECT",
                "name": "ReverseResolve"
              }
            },
            "args": [
              {
                "name": "accelerate",
                "type": {
                  "kind": "SCALAR",
                  "name": "Boolean"
                },
                "defaultValue": "true"
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
            }
          },
          {
            "name": "name",
            "type": {
              "kind": "INPUT_OBJECT",
              "name": "DomainsNameFilter"
            }
          },
          {
            "name": "version",
            "type": {
              "kind": "ENUM",
              "name": "ENSProtocolVersion"
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
            "name": "from",
            "type": {
              "kind": "INPUT_OBJECT",
              "name": "EventsFromFilter"
            }
          },
          {
            "name": "selector",
            "type": {
              "kind": "INPUT_OBJECT",
              "name": "EventsSelectorFilter"
            }
          },
          {
            "name": "timestamp",
            "type": {
              "kind": "INPUT_OBJECT",
              "name": "EventsTimestampFilter"
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
        "name": "AccountNameReferencesConnection",
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
                    "name": "AccountNameReferencesConnectionEdge"
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
        "name": "AccountNameReferencesConnectionEdge",
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
                "name": "NameReference"
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
        "name": "AccountNameReferencesWhereInput",
        "inputFields": [
          {
            "name": "coinType",
            "type": {
              "kind": "SCALAR",
              "name": "CoinType"
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
        "kind": "INPUT_OBJECT",
        "name": "AccountPermissionsWhereInput",
        "inputFields": [
          {
            "name": "contract",
            "type": {
              "kind": "INPUT_OBJECT",
              "name": "AccountIdInput"
            }
          }
        ],
        "isOneOf": false
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
        "name": "BeautifiedLabel"
      },
      {
        "kind": "SCALAR",
        "name": "BeautifiedName"
      },
      {
        "kind": "SCALAR",
        "name": "BigInt"
      },
      {
        "kind": "SCALAR",
        "name": "BinanceAddress"
      },
      {
        "kind": "SCALAR",
        "name": "BitcoinAddress"
      },
      {
        "kind": "SCALAR",
        "name": "BitcoinCashAddress"
      },
      {
        "kind": "SCALAR",
        "name": "Boolean"
      },
      {
        "kind": "OBJECT",
        "name": "CanonicalName",
        "fields": [
          {
            "name": "beautified",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "SCALAR",
                "name": "BeautifiedName"
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
                "name": "InterpretedName"
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
        "name": "ChainId"
      },
      {
        "kind": "ENUM",
        "name": "ChainName",
        "enumValues": [
          {
            "name": "ARBITRUM_ONE",
            "isDeprecated": false
          },
          {
            "name": "BASE",
            "isDeprecated": false
          },
          {
            "name": "ETHEREUM",
            "isDeprecated": false
          },
          {
            "name": "LINEA",
            "isDeprecated": false
          },
          {
            "name": "OPTIMISM",
            "isDeprecated": false
          },
          {
            "name": "SCROLL",
            "isDeprecated": false
          }
        ]
      },
      {
        "kind": "SCALAR",
        "name": "CoinType"
      },
      {
        "kind": "ENUM",
        "name": "ContenthashProtocol",
        "enumValues": [
          {
            "name": "ARWEAVE",
            "isDeprecated": false
          },
          {
            "name": "IPFS",
            "isDeprecated": false
          },
          {
            "name": "IPNS",
            "isDeprecated": false
          },
          {
            "name": "ONION",
            "isDeprecated": false
          },
          {
            "name": "ONION3",
            "isDeprecated": false
          },
          {
            "name": "SKYNET",
            "isDeprecated": false
          },
          {
            "name": "SWARM",
            "isDeprecated": false
          }
        ]
      },
      {
        "kind": "SCALAR",
        "name": "DogecoinAddress"
      },
      {
        "kind": "INTERFACE",
        "name": "Domain",
        "fields": [
          {
            "name": "canonical",
            "type": {
              "kind": "OBJECT",
              "name": "DomainCanonical"
            },
            "args": [],
            "isDeprecated": false
          },
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
              "kind": "INTERFACE",
              "name": "Domain"
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
            "name": "registry",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "INTERFACE",
                "name": "Registry"
              }
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "resolve",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "OBJECT",
                "name": "ForwardResolve"
              }
            },
            "args": [
              {
                "name": "accelerate",
                "type": {
                  "kind": "SCALAR",
                  "name": "Boolean"
                },
                "defaultValue": "true"
              }
            ],
            "isDeprecated": false
          },
          {
            "name": "resolver",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "OBJECT",
                "name": "DomainResolver"
              }
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
              "kind": "INTERFACE",
              "name": "Registry"
            },
            "args": [],
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
          },
          {
            "kind": "OBJECT",
            "name": "UnindexedDomain"
          }
        ]
      },
      {
        "kind": "OBJECT",
        "name": "DomainCanonical",
        "fields": [
          {
            "name": "depth",
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
            "name": "name",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "OBJECT",
                "name": "CanonicalName"
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
                "kind": "SCALAR",
                "name": "Node"
              }
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "path",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "LIST",
                "ofType": {
                  "kind": "NON_NULL",
                  "ofType": {
                    "kind": "INTERFACE",
                    "name": "Domain"
                  }
                }
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
        "name": "DomainPermissionsUserFilter",
        "inputFields": [
          {
            "name": "eq",
            "type": {
              "kind": "SCALAR",
              "name": "Address"
            }
          },
          {
            "name": "in",
            "type": {
              "kind": "LIST",
              "ofType": {
                "kind": "NON_NULL",
                "ofType": {
                  "kind": "SCALAR",
                  "name": "Address"
                }
              }
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
              "kind": "INPUT_OBJECT",
              "name": "DomainPermissionsUserFilter"
            }
          }
        ],
        "isOneOf": false
      },
      {
        "kind": "OBJECT",
        "name": "DomainProfile",
        "fields": [
          {
            "name": "addresses",
            "type": {
              "kind": "OBJECT",
              "name": "ProfileAddresses"
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "avatar",
            "type": {
              "kind": "OBJECT",
              "name": "ProfileAvatar"
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "contenthash",
            "type": {
              "kind": "OBJECT",
              "name": "ProfileContenthash"
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "description",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "email",
            "type": {
              "kind": "SCALAR",
              "name": "Email"
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "header",
            "type": {
              "kind": "OBJECT",
              "name": "ProfileHeader"
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "socials",
            "type": {
              "kind": "OBJECT",
              "name": "ProfileSocials"
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "website",
            "type": {
              "kind": "OBJECT",
              "name": "ProfileWebsite"
            },
            "args": [],
            "isDeprecated": false
          }
        ],
        "interfaces": []
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
        "name": "DomainResolver",
        "fields": [
          {
            "name": "assigned",
            "type": {
              "kind": "OBJECT",
              "name": "Resolver"
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "effective",
            "type": {
              "kind": "OBJECT",
              "name": "Resolver"
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
        "kind": "INPUT_OBJECT",
        "name": "DomainsNameFilter",
        "inputFields": [
          {
            "name": "eq",
            "type": {
              "kind": "SCALAR",
              "name": "InterpretedName"
            }
          },
          {
            "name": "in",
            "type": {
              "kind": "LIST",
              "ofType": {
                "kind": "NON_NULL",
                "ofType": {
                  "kind": "SCALAR",
                  "name": "InterpretedName"
                }
              }
            }
          },
          {
            "name": "starts_with",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            }
          }
        ],
        "isOneOf": true
      },
      {
        "kind": "ENUM",
        "name": "DomainsOrderBy",
        "enumValues": [
          {
            "name": "DEPTH",
            "isDeprecated": false
          },
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
            "name": "name",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "INPUT_OBJECT",
                "name": "DomainsNameFilter"
              }
            }
          },
          {
            "name": "version",
            "type": {
              "kind": "ENUM",
              "name": "ENSProtocolVersion"
            }
          }
        ],
        "isOneOf": false
      },
      {
        "kind": "ENUM",
        "name": "ENSProtocolVersion",
        "enumValues": [
          {
            "name": "ENSv1",
            "isDeprecated": false
          },
          {
            "name": "ENSv2",
            "isDeprecated": false
          }
        ]
      },
      {
        "kind": "OBJECT",
        "name": "ENSv1Domain",
        "fields": [
          {
            "name": "canonical",
            "type": {
              "kind": "OBJECT",
              "name": "DomainCanonical"
            },
            "args": [],
            "isDeprecated": false
          },
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
              "kind": "INTERFACE",
              "name": "Domain"
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
            "name": "registry",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "INTERFACE",
                "name": "Registry"
              }
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "resolve",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "OBJECT",
                "name": "ForwardResolve"
              }
            },
            "args": [
              {
                "name": "accelerate",
                "type": {
                  "kind": "SCALAR",
                  "name": "Boolean"
                },
                "defaultValue": "true"
              }
            ],
            "isDeprecated": false
          },
          {
            "name": "resolver",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "OBJECT",
                "name": "DomainResolver"
              }
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
          },
          {
            "name": "subregistry",
            "type": {
              "kind": "INTERFACE",
              "name": "Registry"
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
        "name": "ENSv1Registry",
        "fields": [
          {
            "name": "canonical",
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
        "interfaces": [
          {
            "kind": "INTERFACE",
            "name": "Registry"
          }
        ]
      },
      {
        "kind": "OBJECT",
        "name": "ENSv1VirtualRegistry",
        "fields": [
          {
            "name": "canonical",
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
        "interfaces": [
          {
            "kind": "INTERFACE",
            "name": "Registry"
          }
        ]
      },
      {
        "kind": "OBJECT",
        "name": "ENSv2Domain",
        "fields": [
          {
            "name": "canonical",
            "type": {
              "kind": "OBJECT",
              "name": "DomainCanonical"
            },
            "args": [],
            "isDeprecated": false
          },
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
              "kind": "INTERFACE",
              "name": "Domain"
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
                "kind": "INTERFACE",
                "name": "Registry"
              }
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "resolve",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "OBJECT",
                "name": "ForwardResolve"
              }
            },
            "args": [
              {
                "name": "accelerate",
                "type": {
                  "kind": "SCALAR",
                  "name": "Boolean"
                },
                "defaultValue": "true"
              }
            ],
            "isDeprecated": false
          },
          {
            "name": "resolver",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "OBJECT",
                "name": "DomainResolver"
              }
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
              "kind": "INTERFACE",
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
        "name": "ENSv2Registry",
        "fields": [
          {
            "name": "canonical",
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
        "interfaces": [
          {
            "kind": "INTERFACE",
            "name": "Registry"
          }
        ]
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
        "kind": "SCALAR",
        "name": "Email"
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
            "name": "sender",
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
        "name": "EventsFromFilter",
        "inputFields": [
          {
            "name": "eq",
            "type": {
              "kind": "SCALAR",
              "name": "Address"
            }
          },
          {
            "name": "in",
            "type": {
              "kind": "LIST",
              "ofType": {
                "kind": "NON_NULL",
                "ofType": {
                  "kind": "SCALAR",
                  "name": "Address"
                }
              }
            }
          }
        ],
        "isOneOf": true
      },
      {
        "kind": "INPUT_OBJECT",
        "name": "EventsSelectorFilter",
        "inputFields": [
          {
            "name": "eq",
            "type": {
              "kind": "SCALAR",
              "name": "Hex"
            }
          },
          {
            "name": "in",
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
          }
        ],
        "isOneOf": true
      },
      {
        "kind": "INPUT_OBJECT",
        "name": "EventsSenderFilter",
        "inputFields": [
          {
            "name": "eq",
            "type": {
              "kind": "SCALAR",
              "name": "Address"
            }
          },
          {
            "name": "in",
            "type": {
              "kind": "LIST",
              "ofType": {
                "kind": "NON_NULL",
                "ofType": {
                  "kind": "SCALAR",
                  "name": "Address"
                }
              }
            }
          }
        ],
        "isOneOf": true
      },
      {
        "kind": "INPUT_OBJECT",
        "name": "EventsTimestampFilter",
        "inputFields": [
          {
            "name": "gt",
            "type": {
              "kind": "SCALAR",
              "name": "BigInt"
            }
          },
          {
            "name": "gte",
            "type": {
              "kind": "SCALAR",
              "name": "BigInt"
            }
          },
          {
            "name": "lt",
            "type": {
              "kind": "SCALAR",
              "name": "BigInt"
            }
          },
          {
            "name": "lte",
            "type": {
              "kind": "SCALAR",
              "name": "BigInt"
            }
          }
        ],
        "isOneOf": false
      },
      {
        "kind": "INPUT_OBJECT",
        "name": "EventsWhereInput",
        "inputFields": [
          {
            "name": "from",
            "type": {
              "kind": "INPUT_OBJECT",
              "name": "EventsFromFilter"
            }
          },
          {
            "name": "selector",
            "type": {
              "kind": "INPUT_OBJECT",
              "name": "EventsSelectorFilter"
            }
          },
          {
            "name": "sender",
            "type": {
              "kind": "INPUT_OBJECT",
              "name": "EventsSenderFilter"
            }
          },
          {
            "name": "timestamp",
            "type": {
              "kind": "INPUT_OBJECT",
              "name": "EventsTimestampFilter"
            }
          }
        ],
        "isOneOf": false
      },
      {
        "kind": "OBJECT",
        "name": "ForwardResolve",
        "fields": [
          {
            "name": "acceleration",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "OBJECT",
                "name": "AccelerationStatus"
              }
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "profile",
            "type": {
              "kind": "OBJECT",
              "name": "DomainProfile"
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "records",
            "type": {
              "kind": "OBJECT",
              "name": "ResolvedRecords"
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "trace",
            "type": {
              "kind": "SCALAR",
              "name": "JSON"
            },
            "args": [],
            "isDeprecated": false
          }
        ],
        "interfaces": []
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
        "name": "InterfaceId"
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
        "kind": "SCALAR",
        "name": "JSON"
      },
      {
        "kind": "OBJECT",
        "name": "Label",
        "fields": [
          {
            "name": "beautified",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "SCALAR",
                "name": "BeautifiedLabel"
              }
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "hash",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "SCALAR",
                "name": "LabelHash"
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
        "kind": "SCALAR",
        "name": "LabelHash"
      },
      {
        "kind": "INPUT_OBJECT",
        "name": "LabelsByLabelHashesInput",
        "inputFields": [
          {
            "name": "labelHashes",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "LIST",
                "ofType": {
                  "kind": "NON_NULL",
                  "ofType": {
                    "kind": "SCALAR",
                    "name": "LabelHash"
                  }
                }
              }
            }
          }
        ],
        "isOneOf": false
      },
      {
        "kind": "SCALAR",
        "name": "LitecoinAddress"
      },
      {
        "kind": "SCALAR",
        "name": "MonacoinAddress"
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
        "name": "NameReference",
        "fields": [
          {
            "name": "coinType",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "SCALAR",
                "name": "CoinType"
              }
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
            "name": "match",
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
          }
        ],
        "interfaces": []
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
            "name": "events",
            "type": {
              "kind": "OBJECT",
              "name": "PermissionsUserEventsConnection"
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
        "kind": "OBJECT",
        "name": "PermissionsUserEventsConnection",
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
                    "name": "PermissionsUserEventsConnectionEdge"
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
        "name": "PermissionsUserEventsConnectionEdge",
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
        "name": "PermissionsUserId"
      },
      {
        "kind": "INPUT_OBJECT",
        "name": "PrimaryNameByInput",
        "inputFields": [
          {
            "name": "chainName",
            "type": {
              "kind": "ENUM",
              "name": "ChainName"
            }
          },
          {
            "name": "coinType",
            "type": {
              "kind": "SCALAR",
              "name": "CoinType"
            }
          }
        ],
        "isOneOf": true
      },
      {
        "kind": "OBJECT",
        "name": "PrimaryNameRecord",
        "fields": [
          {
            "name": "chainName",
            "type": {
              "kind": "ENUM",
              "name": "ChainName"
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "coinType",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "SCALAR",
                "name": "CoinType"
              }
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "name",
            "type": {
              "kind": "OBJECT",
              "name": "CanonicalName"
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "resolve",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "OBJECT",
                "name": "ForwardResolve"
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
        "name": "PrimaryNamesWhereInput",
        "inputFields": [
          {
            "name": "chainNames",
            "type": {
              "kind": "LIST",
              "ofType": {
                "kind": "NON_NULL",
                "ofType": {
                  "kind": "ENUM",
                  "name": "ChainName"
                }
              }
            }
          },
          {
            "name": "coinTypes",
            "type": {
              "kind": "LIST",
              "ofType": {
                "kind": "NON_NULL",
                "ofType": {
                  "kind": "SCALAR",
                  "name": "CoinType"
                }
              }
            }
          }
        ],
        "isOneOf": true
      },
      {
        "kind": "OBJECT",
        "name": "ProfileAddresses",
        "fields": [
          {
            "name": "base",
            "type": {
              "kind": "SCALAR",
              "name": "Address"
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "binance",
            "type": {
              "kind": "SCALAR",
              "name": "BinanceAddress"
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "bitcoin",
            "type": {
              "kind": "SCALAR",
              "name": "BitcoinAddress"
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "bitcoincash",
            "type": {
              "kind": "SCALAR",
              "name": "BitcoinCashAddress"
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "dogecoin",
            "type": {
              "kind": "SCALAR",
              "name": "DogecoinAddress"
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "ethereum",
            "type": {
              "kind": "SCALAR",
              "name": "Address"
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "litecoin",
            "type": {
              "kind": "SCALAR",
              "name": "LitecoinAddress"
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "monacoin",
            "type": {
              "kind": "SCALAR",
              "name": "MonacoinAddress"
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "ripple",
            "type": {
              "kind": "SCALAR",
              "name": "RippleAddress"
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "rootstock",
            "type": {
              "kind": "SCALAR",
              "name": "RootstockAddress"
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "solana",
            "type": {
              "kind": "SCALAR",
              "name": "SolanaAddress"
            },
            "args": [],
            "isDeprecated": false
          }
        ],
        "interfaces": []
      },
      {
        "kind": "OBJECT",
        "name": "ProfileAvatar",
        "fields": [
          {
            "name": "httpUrl",
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
        "name": "ProfileContenthash",
        "fields": [
          {
            "name": "decoded",
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
            "name": "httpUrl",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "protocolType",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "ENUM",
                "name": "ContenthashProtocol"
              }
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "uri",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "SCALAR",
                "name": "String"
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
        "name": "ProfileHeader",
        "fields": [
          {
            "name": "httpUrl",
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
        "name": "ProfileSocialAccount",
        "fields": [
          {
            "name": "handle",
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
            "name": "httpUrl",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "SCALAR",
                "name": "String"
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
        "name": "ProfileSocials",
        "fields": [
          {
            "name": "github",
            "type": {
              "kind": "OBJECT",
              "name": "ProfileSocialAccount"
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "keybase",
            "type": {
              "kind": "OBJECT",
              "name": "ProfileSocialAccount"
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "linkedin",
            "type": {
              "kind": "OBJECT",
              "name": "ProfileSocialAccount"
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "telegram",
            "type": {
              "kind": "OBJECT",
              "name": "ProfileSocialAccount"
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "twitter",
            "type": {
              "kind": "OBJECT",
              "name": "ProfileSocialAccount"
            },
            "args": [],
            "isDeprecated": false
          }
        ],
        "interfaces": []
      },
      {
        "kind": "OBJECT",
        "name": "ProfileWebsite",
        "fields": [
          {
            "name": "httpUrl",
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
            "name": "labels",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "LIST",
                "ofType": {
                  "kind": "NON_NULL",
                  "ofType": {
                    "kind": "OBJECT",
                    "name": "Label"
                  }
                }
              }
            },
            "args": [
              {
                "name": "by",
                "type": {
                  "kind": "NON_NULL",
                  "ofType": {
                    "kind": "INPUT_OBJECT",
                    "name": "LabelsByLabelHashesInput"
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
            "name": "registry",
            "type": {
              "kind": "INTERFACE",
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
            "name": "root",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "INTERFACE",
                "name": "Registry"
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
        "kind": "INTERFACE",
        "name": "Registry",
        "fields": [
          {
            "name": "canonical",
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
        "interfaces": [],
        "possibleTypes": [
          {
            "kind": "OBJECT",
            "name": "ENSv1Registry"
          },
          {
            "kind": "OBJECT",
            "name": "ENSv1VirtualRegistry"
          },
          {
            "kind": "OBJECT",
            "name": "ENSv2Registry"
          }
        ]
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
              "kind": "INPUT_OBJECT",
              "name": "DomainsNameFilter"
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
                "kind": "INTERFACE",
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
        "name": "ResolvedAbiRecord",
        "fields": [
          {
            "name": "contentType",
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
          }
        ],
        "interfaces": []
      },
      {
        "kind": "OBJECT",
        "name": "ResolvedAddressRecord",
        "fields": [
          {
            "name": "address",
            "type": {
              "kind": "SCALAR",
              "name": "Hex"
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "coinType",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "SCALAR",
                "name": "CoinType"
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
        "name": "ResolvedInterfaceRecord",
        "fields": [
          {
            "name": "implementer",
            "type": {
              "kind": "SCALAR",
              "name": "Address"
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "interfaceId",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "SCALAR",
                "name": "InterfaceId"
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
        "name": "ResolvedPubkeyRecord",
        "fields": [
          {
            "name": "x",
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
            "name": "y",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "SCALAR",
                "name": "Hex"
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
        "name": "ResolvedRawTextRecord",
        "fields": [
          {
            "name": "key",
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
            "name": "value",
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
        "name": "ResolvedRecords",
        "fields": [
          {
            "name": "abi",
            "type": {
              "kind": "OBJECT",
              "name": "ResolvedAbiRecord"
            },
            "args": [
              {
                "name": "contentTypeMask",
                "type": {
                  "kind": "NON_NULL",
                  "ofType": {
                    "kind": "SCALAR",
                    "name": "BigInt"
                  }
                }
              }
            ],
            "isDeprecated": false
          },
          {
            "name": "addresses",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "LIST",
                "ofType": {
                  "kind": "NON_NULL",
                  "ofType": {
                    "kind": "OBJECT",
                    "name": "ResolvedAddressRecord"
                  }
                }
              }
            },
            "args": [
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
                }
              }
            ],
            "isDeprecated": false
          },
          {
            "name": "contenthash",
            "type": {
              "kind": "SCALAR",
              "name": "Hex"
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "dnszonehash",
            "type": {
              "kind": "SCALAR",
              "name": "Hex"
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "interfaces",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "LIST",
                "ofType": {
                  "kind": "NON_NULL",
                  "ofType": {
                    "kind": "OBJECT",
                    "name": "ResolvedInterfaceRecord"
                  }
                }
              }
            },
            "args": [
              {
                "name": "ids",
                "type": {
                  "kind": "NON_NULL",
                  "ofType": {
                    "kind": "LIST",
                    "ofType": {
                      "kind": "NON_NULL",
                      "ofType": {
                        "kind": "SCALAR",
                        "name": "InterfaceId"
                      }
                    }
                  }
                }
              }
            ],
            "isDeprecated": false
          },
          {
            "name": "pubkey",
            "type": {
              "kind": "OBJECT",
              "name": "ResolvedPubkeyRecord"
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "reverseName",
            "type": {
              "kind": "SCALAR",
              "name": "String"
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "texts",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "LIST",
                "ofType": {
                  "kind": "NON_NULL",
                  "ofType": {
                    "kind": "OBJECT",
                    "name": "ResolvedRawTextRecord"
                  }
                }
              }
            },
            "args": [
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
                }
              }
            ],
            "isDeprecated": false
          },
          {
            "name": "version",
            "type": {
              "kind": "SCALAR",
              "name": "BigInt"
            },
            "args": [],
            "isDeprecated": false
          }
        ],
        "interfaces": []
      },
      {
        "kind": "OBJECT",
        "name": "Resolver",
        "fields": [
          {
            "name": "bridged",
            "type": {
              "kind": "INTERFACE",
              "name": "Registry"
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
            "name": "extended",
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
        "kind": "OBJECT",
        "name": "ReverseResolve",
        "fields": [
          {
            "name": "acceleration",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "OBJECT",
                "name": "AccelerationStatus"
              }
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "primaryName",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "OBJECT",
                "name": "PrimaryNameRecord"
              }
            },
            "args": [
              {
                "name": "by",
                "type": {
                  "kind": "NON_NULL",
                  "ofType": {
                    "kind": "INPUT_OBJECT",
                    "name": "PrimaryNameByInput"
                  }
                }
              }
            ],
            "isDeprecated": false
          },
          {
            "name": "primaryNames",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "LIST",
                "ofType": {
                  "kind": "NON_NULL",
                  "ofType": {
                    "kind": "OBJECT",
                    "name": "PrimaryNameRecord"
                  }
                }
              }
            },
            "args": [
              {
                "name": "where",
                "type": {
                  "kind": "NON_NULL",
                  "ofType": {
                    "kind": "INPUT_OBJECT",
                    "name": "PrimaryNamesWhereInput"
                  }
                }
              }
            ],
            "isDeprecated": false
          },
          {
            "name": "trace",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "SCALAR",
                "name": "JSON"
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
        "name": "RippleAddress"
      },
      {
        "kind": "SCALAR",
        "name": "RootstockAddress"
      },
      {
        "kind": "SCALAR",
        "name": "SolanaAddress"
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
              "kind": "INPUT_OBJECT",
              "name": "DomainsNameFilter"
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
        "name": "UnindexedDomain",
        "fields": [
          {
            "name": "canonical",
            "type": {
              "kind": "OBJECT",
              "name": "DomainCanonical"
            },
            "args": [],
            "isDeprecated": false
          },
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
              "kind": "INTERFACE",
              "name": "Domain"
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
            "name": "registry",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "INTERFACE",
                "name": "Registry"
              }
            },
            "args": [],
            "isDeprecated": false
          },
          {
            "name": "resolve",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "OBJECT",
                "name": "ForwardResolve"
              }
            },
            "args": [
              {
                "name": "accelerate",
                "type": {
                  "kind": "SCALAR",
                  "name": "Boolean"
                },
                "defaultValue": "true"
              }
            ],
            "isDeprecated": false
          },
          {
            "name": "resolver",
            "type": {
              "kind": "NON_NULL",
              "ofType": {
                "kind": "OBJECT",
                "name": "DomainResolver"
              }
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
              "kind": "INTERFACE",
              "name": "Registry"
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