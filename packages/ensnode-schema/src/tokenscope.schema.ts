import schema from "ponder:schema";
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
    blockNumber: t.integer().notNull(),

    /**
     * The log index position of the sale event within blockNumber.
     */
    logIndex: t.integer().notNull(),

    /**
     * The EVM transaction hash on chainId associated with the sale.
     */
    transactionHash: t.hex().notNull(),

    /**
     * The order hash of the sale order within contractAddress.
     */
    orderHash: t.hex().notNull(),

    /**
     * The address of the contract on chainId that manages tokenId.
     */
    contractAddress: t.hex().notNull(),

    /**
     * The tokenId managed by contractAddress that was sold.
     *
     * Combined with `chainId` and `contractAddress`, creates unique NFT identifier
     * for the domain being transferred.
     *
     * Interpretation depends on 'tokenType':
     * - ERC721: Unique token within contract
     * - ERC1155: Token type identifier (multiple copies may exist)
     *
     * The tokenId is formatted as a hex string representing a uint256.
     */
    tokenId: t.text().notNull(),

    /**
     * The type of token that was sold (ERC721 or ERC1155).
     */
    tokenType: t.text().notNull(),

    /**
     * Unique and deterministic identifier of token that was sold.
     *
     * Composite key format: "{chainId}-{contractAddress}-{tokenId}"
     */
    tokenRef: t.text().notNull(),

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
    timestamp: t.integer().notNull(),
  }),
  (t) => ({
    idx_domainId: index().on(t.domainId),
    idx_tokenRef: index().on(t.tokenRef),
    idx_buyer: index().on(t.buyer),
    idx_seller: index().on(t.seller),
    idx_timestamp: index().on(t.timestamp),
  }),
);
