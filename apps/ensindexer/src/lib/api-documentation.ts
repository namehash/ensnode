import { capitalize } from "@ensnode/ponder-subgraph";
import {
  createDocumentationMiddleware,
  extendWithBaseDefinitions,
  generateTypeDocSet,
} from "ponder-enrich-gql-docs-middleware";

export const makeApiDocumentationMiddleware = (path: "/ponder" | "/subgraph") =>
  createDocumentationMiddleware(makeApiDocumentation(path === "/subgraph"), { path });

const makeApiDocumentation = (isSubgraph: boolean) => {
  // subgraph type names are capitalized, ponder type name are not
  const maybeCapitalizeTypeName = (name: string) => (isSubgraph ? capitalize(name) : name);

  const generateTypeDocSetWithTypeName = (
    name: string,
    description: string,
    fields: Record<string, string>,
  ) =>
    generateTypeDocSet(
      maybeCapitalizeTypeName(name),
      description,
      Object.keys(fields).reduce(
        (memo, fieldName) => ({
          [`${maybeCapitalizeTypeName(name)}.${fieldName}`]: fields[fieldName],
          ...memo,
        }),
        {},
      ),
    );

  return extendWithBaseDefinitions({
    ...generateTypeDocSetWithTypeName("domain", "a domain", {
      id: "The namehash of the name",
      name: "The human readable name, if known. Unknown portions replaced with hash in square brackets (eg, foo.[1234].eth)",
      labelName: "The human readable label name (imported from CSV), if known",
      labelhash: "keccak256(labelName)",
      parent: "The parent Domain of this Domain, if any",
      parentId: "The namehash (id) of the parent name",
      subdomains: "List of Domains under this Domain, if any",
      subdomainCount: "The number of subdomains",
      resolvedAddress: "Currently resolved Address",
      resolvedAddressId: "Address logged from current resolver, if any",
      resolver: "The resolver that controls the domain's settings",
      resolverId: "The resolver that controls the domain's settings",
      ttl: "The time-to-live (TTL) value of the domain's records",
      isMigrated: "Indicates whether the domain has been migrated to a new registrar",
      createdAt: "The time when the domain was created",
      owner: "The account that owns the domain",
      ownerId: "The account that owns the domain",
      registrant: "The account that owns the ERC721 NFT for the domain",
      registrantId: "The account that owns the ERC721 NFT for the domain",
      wrappedOwner: "The account that owns the wrapped domain",
      wrappedOwnerId: "The account that owns the wrapped domain",
      expiryDate:
        "The expiry date for the domain, from either the registration, or the wrapped domain if PCC is burned",
      registration: "The registration associated with the domain",
      wrappedDomain: "The wrapped domain associated with the domain",
      events: "The events associated with the domain",
    }),
    ...generateTypeDocSetWithTypeName("domainEvent", "an event related to a Domain", {
      id: "The unique identifier of the event",
      domain: "The domain name associated with the event",
      blockNumber: "The block number at which the event occurred",
      transactionID: "The transaction hash of the transaction that triggered the event",
    }),
    ...generateTypeDocSetWithTypeName("transfer", "a transfer event", {
      id: "The unique identifier of the event",
      domain: "The domain name associated with the event",
      blockNumber: "The block number at which the event occurred",
      transactionID: "The transaction hash of the transaction that triggered the event",
      owner: "The account that owns the domain after the transfer",
    }),
    ...generateTypeDocSetWithTypeName("newOwner", "a new owner event", {
      id: "The unique identifier of the event",
      parentDomain: "The parent domain of the domain name associated with the event",
      domain: "The domain name associated with the event",
      blockNumber: "The block number at which the event occurred",
      transactionID: "The transaction hash of the transaction that triggered the event",
      owner: "The new account that owns the domain",
    }),
    ...generateTypeDocSetWithTypeName("newResolver", "a new resolver event", {
      id: "The unique identifier of the event",
      domain: "The domain name associated with the event",
      blockNumber: "The block number at which the event occurred",
      transactionID: "The transaction hash of the transaction that triggered the event",
      resolver: "The new resolver contract address associated with the domain",
    }),
    ...generateTypeDocSetWithTypeName("newTTL", "a new TTL event", {
      id: "The unique identifier of the event",
      domain: "The domain name associated with the event",
      blockNumber: "The block number at which the event occurred",
      transactionID: "The transaction hash of the transaction that triggered the event",
      ttl: "The new TTL value (in seconds) associated with the domain",
    }),
    ...generateTypeDocSetWithTypeName("wrappedTransfer", "a wrapped transfer event", {
      id: "The unique identifier of the event",
      domain: "The domain name associated with the event",
      blockNumber: "The block number at which the event occurred",
      transactionID: "The transaction hash of the transaction that triggered the event",
      owner: "The account that owns the wrapped domain after the transfer",
    }),
    ...generateTypeDocSetWithTypeName("nameWrapped", "a name wrapped event", {
      id: "The unique identifier of the wrapped domain",
      domain: "The domain name associated with the wrapped domain",
      blockNumber: "The block number at which the wrapped domain was wrapped",
      transactionID: "The transaction hash of the transaction that wrapped the domain",
      name: "The human-readable name of the wrapped domain",
      fuses: "The number of fuses associated with the wrapped domain",
      owner: "The account that owns the wrapped domain",
      expiryDate: "The expiry date of the wrapped domain registration",
    }),
    ...generateTypeDocSetWithTypeName("nameUnwrapped", "a name unwrapped event", {
      id: "The unique identifier of the event",
      domain: "The domain name associated with the event",
      blockNumber: "The block number at which the event occurred",
      transactionID: "The transaction hash of the transaction that triggered the event",
      owner: "The account that owns the domain after it was unwrapped",
    }),
    ...generateTypeDocSetWithTypeName("fusesSet", "a fuses set event", {
      id: "The unique identifier of the event",
      domain: "The domain name associated with the event",
      blockNumber: "The block number at which the event occurred",
      transactionID: "The transaction hash of the transaction that triggered the event",
      fuses: "The number of fuses associated with the domain after the set event",
    }),
    ...generateTypeDocSetWithTypeName("expiryExtended", "an expiry extended event", {
      id: "The unique identifier of the event",
      domain: "The domain name associated with the event",
      blockNumber: "The block number at which the event occurred",
      transactionID: "The transaction hash of the transaction that triggered the event",
      expiryDate: "The new expiry date associated with the domain after the extension event",
    }),
    ...generateTypeDocSetWithTypeName("registration", "a domain registration", {
      id: "The unique identifier of the registration",
      domain: "The domain name associated with the registration",
      domainId: "The domain name associated with the registration",
      registrationDate: "The registration date of the domain",
      expiryDate: "The expiry date of the domain",
      cost: "The cost associated with the domain registration",
      registrant: "The account that registered the domain",
      registrantId: "The account that registered the domain",
      labelName: "The human-readable label name associated with the domain registration",
      events: "The events associated with the domain registration",
    }),
    ...generateTypeDocSetWithTypeName("registrationEvent", "a registration event", {
      id: "The unique identifier of the registration event",
      registration: "The registration associated with the event",
      blockNumber: "The block number of the event",
      transactionID: "The transaction ID associated with the event",
    }),
    ...generateTypeDocSetWithTypeName("nameRegistered", "a name registered event", {
      id: "The unique identifier of the NameRegistered event",
      registration: "The registration associated with the event",
      blockNumber: "The block number of the event",
      transactionID: "The transaction ID associated with the event",
      registrant: "The account that registered the name",
      expiryDate: "The expiry date of the registration",
    }),
    ...generateTypeDocSetWithTypeName("nameRenewed", "a name renewed event", {
      id: "The unique identifier of the NameRenewed event",
      registration: "The registration associated with the event",
      blockNumber: "The block number of the event",
      transactionID: "The transaction ID associated with the event",
      expiryDate: "The new expiry date of the registration",
    }),
    ...generateTypeDocSetWithTypeName("nameTransferred", "a name transferred event", {
      id: "The ID of the event",
      registration: "The registration associated with the event",
      blockNumber: "The block number of the event",
      transactionID: "The transaction ID of the event",
      newOwner: "The new owner of the domain",
    }),
    ...generateTypeDocSetWithTypeName("wrappedDomain", "a wrapped domain", {
      id: "The unique identifier for each instance of the WrappedDomain entity",
      domain: "The domain that is wrapped by this WrappedDomain",
      domainId: "The domain that is wrapped by this WrappedDomain",
      expiryDate: "The expiry date of the wrapped domain",
      fuses: "The number of fuses remaining on the wrapped domain",
      owner: "The account that owns this WrappedDomain",
      ownerId: "The account that owns this WrappedDomain",
      name: "The name of the wrapped domain",
    }),
    ...generateTypeDocSetWithTypeName("account", "an account", {
      id: "The unique identifier for the account",
      domains: "The domains owned by the account",
      wrappedDomains: "The WrappedDomains owned by the account",
      registrations: "The Registrations made by the account",
    }),
    ...generateTypeDocSetWithTypeName("resolver", "a resolver", {
      id: "The unique identifier for this resolver, which is a concatenation of the domain namehash and the resolver address",
      domain: "The domain that this resolver is associated with",
      domainId: "The domain that this resolver is associated with",
      address: "The address of the resolver contract",
      addr: "The current value of the 'addr' record for this resolver, as determined by the associated events",
      addrId:
        "The current value of the 'addr' record for this resolver, as determined by the associated events",
      contentHash: "The content hash for this resolver, in binary format",
      texts: "The set of observed text record keys for this resolver",
      coinTypes: "The set of observed SLIP-44 coin types for this resolver",
      events: "The events associated with this resolver",
      // resolver-records.schema.ts additional properties
      name: "the value of the reverse-resolution name() record for this resolver",
    }),
    ...generateTypeDocSetWithTypeName("resolverEvent", "a resolver event", {
      id: "Concatenation of block number and log ID",
      resolver: "Used to derive relationships to Resolvers",
      blockNumber: "The block number that the event occurred on",
      transactionID: "The transaction hash of the event",
    }),
    ...generateTypeDocSetWithTypeName("addrChanged", "an address changed event", {
      id: "Unique identifier for this event",
      resolver: "The resolver associated with this event",
      blockNumber: "The block number at which this event occurred",
      transactionID: "The transaction ID for the transaction in which this event occurred",
      addr: "The new address associated with the resolver",
    }),
    ...generateTypeDocSetWithTypeName("multicoinAddrChanged", "a multicoin address changed event", {
      id: "Unique identifier for the event",
      resolver: "Resolver associated with this event",
      blockNumber: "Block number in which this event was emitted",
      transactionID: "Transaction ID in which this event was emitted",
      coinType: "The coin type of the changed address",
      addr: "The new address value for the given coin type",
    }),
    ...generateTypeDocSetWithTypeName("nameChanged", "a name changed event", {
      id: "Concatenation of block number and log ID",
      resolver: "Used to derive relationships to Resolvers",
      blockNumber: "Block number where event occurred",
      transactionID: "Unique transaction ID where event occurred",
      name: "New ENS name value",
    }),
    ...generateTypeDocSetWithTypeName("abiChanged", "an ABI changed event", {
      id: "Concatenation of block number and log ID",
      resolver: "Used to derive relationships to Resolvers",
      blockNumber: "The block number at which the event was emitted",
      transactionID: "The transaction hash of the transaction in which the event was emitted",
      contentType: "The content type of the ABI change",
    }),
    ...generateTypeDocSetWithTypeName("pubkeyChanged", "a pubkey changed event", {
      id: "Concatenation of block number and log ID",
      resolver: "Used to derive relationships to Resolvers",
      blockNumber: "Block number of the Ethereum block where the event occurred",
      transactionID: "Transaction hash of the Ethereum transaction where the event occurred",
      x: "The x-coordinate of the new public key",
      y: "The y-coordinate of the new public key",
    }),
    ...generateTypeDocSetWithTypeName("textChanged", "a text changed event", {
      id: "Concatenation of block number and log ID",
      resolver: "Used to derive relationships to Resolvers",
      blockNumber: "Block number of the Ethereum block in which the event occurred",
      transactionID: "Hash of the Ethereum transaction in which the event occurred",
      key: "The key of the text record that was changed",
      value: "The new value of the text record that was changed",
    }),
    ...generateTypeDocSetWithTypeName("contenthashChanged", "a content hash changed event", {
      id: "Concatenation of block number and log ID",
      resolver: "Used to derive relationships to Resolvers",
      blockNumber: "The block number where the event occurred",
      transactionID: "The ID of the transaction where the event occurred",
      hash: "The new content hash for the domain",
    }),
    ...generateTypeDocSetWithTypeName("interfaceChanged", "an interface changed event", {
      id: "Concatenation of block number and log ID",
      resolver: "Used to derive relationships to Resolvers",
      blockNumber: "The block number in which the event occurred",
      transactionID: "The transaction ID for the transaction in which the event occurred",
      interfaceID: "The ID of the EIP-1820 interface that was changed",
      implementer: "The address of the contract that implements the interface",
    }),
    ...generateTypeDocSetWithTypeName("authorisationChanged", "an authorisation changed event", {
      id: "Unique identifier for this event",
      resolver: "The resolver associated with this event",
      blockNumber: "The block number at which the event occurred",
      transactionID: "The transaction hash associated with the event",
      owner: "The owner of the authorisation",
      target: "The target of the authorisation",
      isAuthorized: "Whether the authorisation was added or removed",
    }),
    ...generateTypeDocSetWithTypeName("versionChanged", "a version changed event", {
      id: "Unique identifier for this event",
      resolver: "The resolver associated with this event",
      blockNumber: "The block number at which the event occurred",
      transactionID: "The transaction hash associated with the event",
      version: "The new version number of the resolver",
    }),
    /**
     * The following is documentation for packages/ensnode-schema/src/resolver-records.schema.ts
     */
    ...generateTypeDocSetWithTypeName(
      "ext_resolverAddressRecords",
      "address records in a Resolver for a Node",
      {
        id: "Unique identifier for this address record",
        coinType: "SLIP-44 coinType for this address record",
        address: "Value of the address record",
      },
    ),
    ...generateTypeDocSetWithTypeName(
      "ext_resolverTextRecords",
      "text records in a Resolver for a Node",
      {
        id: "Unique identifier for this text record",
        key: "Key of the text record",
        value: "Value of the text record",
      },
    ),
    /**
     * The following is documentation for packages/ensnode-schema/src/efp.schema.ts
     */
    ...generateTypeDocSetWithTypeName("efp_listToken", "EFP List Token", {
      id: "Unique token ID for an EFP List Token",
      owner: "The address of the current owner of the EFP List Token  (always lowercase)",
      lslId:
        "Value of `EncodedLsl` type (optional, lowercase if present). Stores the ID of the List Storage Location. If the List Storage Location was never created or not in a recognized format, this field value will be `null`.",
    }),
    ...generateTypeDocSetWithTypeName("efp_listStorageLocation", "EFP List Storage Location", {
      id: "ListStorageLocation ID, an `EncodedLsl` value (always lowercase).",
      chainId:
        "EVM chain ID of the chain where the EFP list records are stored, an `EFPDeploymentChainId` value.",
      listRecordsAddress:
        "Contract address on chainId where the EFP list records are stored  (always lowercase).",
      slot: "A unique identifier within the List Storage Location, distinguishes between multiple EFP lists stored in the same `EFPListRecords` smart contract by serving as the key in mappings for list operations and metadata.",
    }),
  });
};
