import { index, onchainTable } from "ponder";

export const nameSales = onchainTable(
  "ext_name_sales",
  (t) => ({
    /**
     * Unique and deterministic identifier of the onchain event associated with the sale.
     *
     * Composite key format: "{chainId}-{blockNumber}-{logIndex}" (e.g., "1-1234567-5")
     */
    id: t.text().primaryKey(),

    /**
     * The chain where the sale occurred.
     */
    chainId: t.integer().notNull(),

    /**
     * The block number on chainId where the sale occurred.
     */
    blockNumber: t.bigint().notNull(),

    /**
     * The log index position of the sale event within blockNumber.
     */
    logIndex: t.integer().notNull(),

    /**
     * The EVM transaction hash on chainId associated with the sale.
     */
    transactionHash: t.hex().notNull(),

    /**
     * The Seaport order hash.
     */
    orderHash: t.hex().notNull(),

    /**
     * The address of the contract on chainId that manages tokenId.
     */
    contractAddress: t.hex().notNull(),

    /**
     * The tokenId managed by contractAddress that was sold.
     *
     * Interpretation depends on 'assetNamespace':
     * - erc721: Unique token within contract
     * - erc1155: Token type identifier (multiple copies may exist)
     */
    tokenId: t.bigint().notNull(),

    /**
     * The CAIP-19 Asset Namespace of the token that was sold. Either `erc721` or `erc1155`.
     *
     * @see https://chainagnostic.org/CAIPs/caip-19
     */
    assetNamespace: t.text().notNull(),

    /**
     * The CAIP-19 Asset ID of token that was sold. This is a globally unique reference to the
     * specific asset in question.
     *
     * @see https://chainagnostic.org/CAIPs/caip-19
     */
    assetId: t.text().notNull(),

    /**
     * The namehash of the ENS domain that was sold.
     */
    domainId: t.hex().notNull(),

    /**
     * The account that bought the token controlling ownership of domainId from
     * the seller for the amount of currency associated with the sale.
     */
    buyer: t.hex().notNull(),

    /**
     * The account that sold the token controlling ownership of domainId to
     * buyer for the amount of currency associated with the sale.
     */
    seller: t.hex().notNull(),

    /**
     * Currency of the payment (ETH, USDC or DAI) from buyer to seller in exchange for tokenId.
     */
    currency: t.text().notNull(),

    /**
     * The amount of currency paid from buyer to seller in exchange for tokenId.
     *
     * Denominated in the smallest unit of currency.
     *
     * Amount interpretation depends on currency:
     * - ETH/WETH: Amount in wei (1 ETH = 10^18 wei)
     * - USDC: Amount in micro-units (1 USDC = 10^6 units)
     * - DAI: Amount in wei-equivalent (1 DAI = 10^18 units)
     */
    amount: t.bigint().notNull(),

    /**
     * Unix timestamp of the block timestamp when the sale occurred.
     */
    timestamp: t.bigint().notNull(),
  }),
  (t) => ({
    idx_domainId: index().on(t.domainId),
    idx_assetId: index().on(t.assetId),
    idx_buyer: index().on(t.buyer),
    idx_seller: index().on(t.seller),
    idx_timestamp: index().on(t.timestamp),
  }),
);

export const nameTokens = onchainTable(
  "ext_name_tokens",
  (t) => ({
    /**
     * The CAIP-19 Asset ID of the token.
     *
     * This is a globally unique reference to the token.
     *
     * @see https://chainagnostic.org/CAIPs/caip-19
     */
    id: t.text().primaryKey(),

    /**
     * The chain that manages the token.
     */
    chainId: t.integer().notNull(),

    /**
     * The address of the contract on chainId that manages the token.
     */
    contractAddress: t.hex().notNull(),

    // TODO: For erc1155 this is Token type identifier (multiple copies may exist)
    // but for tokenscope we want to guarantee the tokenId is unique for the
    // chainId and contractAddress. Advice appreciated.
    /**
     * The tokenId of the token managed by contractAddress.
     */
    tokenId: t.bigint().notNull(),

    /**
     * The CAIP-19 Asset Namespace of the token. Either `erc721` or `erc1155`.
     *
     * @see https://chainagnostic.org/CAIPs/caip-19
     */
    assetNamespace: t.text().notNull(),

    /**
     * The namehash (Node) of the ENS name associated with the token.
     */
    domainId: t.hex().notNull(),

    /**
     * The account that owns the token.
     *
     * Never zeroAddress.
     */
    owner: t.hex().notNull(),
  }),
  (t) => ({
    idx_domainId: index().on(t.domainId),
    idx_owner: index().on(t.owner),
  }),
);
