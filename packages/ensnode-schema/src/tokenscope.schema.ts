import {index, onchainTable} from "ponder";
import schema from "ponder:schema";

export const TokenTypes = {
    ERC721: "ERC721",
    ERC1155: "ERC1155",
} as const;

export type TokenType = typeof TokenTypes[keyof typeof TokenTypes];

const sharedEventColumns = (t: any) => ({
    /**
     * The unique identifier of the event.
     *
     * Composite key format: "{chainId}-{blockNumber}-{logIndex}" (e.g., "1-1234567-5")
     */
    id: t.text().primaryKey(),

    /**
     * The block number where this event was emitted.
     */
    blockNumber: t.integer().notNull(),

    /**
     * The log index position of this event within its containing block.
     * Determines event ordering when multiple events occur in the same block.
     */
    logIndex: t.integer().notNull(),

    /**
     * The transaction hash that generated this event.
     */
    transactionID: t.hex().notNull(),

    /**
     * The blockchain network identifier where this event occurred.
     */
    chainId: t.integer().notNull(),
});

export const nameSold = onchainTable(
    "name_sold",
    (t) => ({
        ...sharedEventColumns(t),

        /**
         * The account that previously owned and sold the domain.
         *
         * Must have been the verified owner of the domain (domainId) and NFT (contractAddress + tokenId)
         * before this sale. Received the payment specified by 'price' + 'currency' from newOwnerId.
         */
        fromOwnerId: t.hex().notNull(),

        /**
         * The account that purchased and now owns the domain.
         *
         * Became the new owner of the domain (domainId) and its NFT representation (contractAddress + tokenId)
         * after paying the amount specified by 'price' + 'currency' to fromOwnerId.
         */
        newOwnerId: t.hex().notNull(),

        /**
         * Currency address of the payment (ETH, USDC, WETH, or DAI).
         *
         * Works in conjunction with 'price' field to define the complete payment amount.
         * Currency contract address varies by chainId - same token has different addresses on different chains.
         */
        currency: t.text().notNull(),

        /**
         * The payment amount denominated in the smallest unit of the currency specified in 'currency' field.
         *
         * Amount interpretation depends on currency:
         * - ETH/WETH: Amount in wei (1 ETH = 10^18 wei)
         * - USDC: Amount in micro-units (1 USDC = 10^6 units)
         * - DAI: Amount in wei-equivalent (1 DAI = 10^18 units)
         *
         * This value MUST be read together with 'currency' to determine actual payment value.
         */
        price: t.bigint().notNull(),

        /**
         * Seaport protocol order hash identifying this specific sale order.
         * Generated from order components (considerations, offers, etc.) to create unique order reference.
         */
        orderHash: t.hex().notNull(),

        /**
         * The ID of the token being sold within the contractAddress.
         *
         * Combined with 'contractAddress', creates unique NFT identifier for the domain being transferred.
         * Interpretation depends on 'tokenType':
         * - ERC721: Unique token within contract
         * - ERC1155: Token type identifier (multiple copies may exist)
         */
        tokenId: t.text().notNull(),

        /**
         * The contract address of the token being sold.
         *
         * Works with 'tokenId' to uniquely identify the NFT representing the domain.
         * Contract type must match 'tokenType' field (ERC721 or ERC1155).
         * Address validity depends on 'chainId' where transaction occurred.
         */
        contractAddress: t.hex().notNull(),

        /**
         * The namehash of the ENS domain being sold.
         *
         * Links this sale to the specific ENS domain.
         */
        domainId: t.hex().notNull(),

        /**
         * Unix timestamp of when the domain sale occurred (block timestamp).
         *
         * Corresponds to the timestamp of the block identified by 'blockNumber' + 'chainId'.
         */
        timestamp: t.bigint().notNull(),

        /**
         * The type of token being sold (ERC721 or ERC1155).
         */
        tokenType: t.text().notNull().$type<TokenType>(),
    }),
    (t) => ({
        idx_from: index().on(t.fromOwnerId),
        idx_to: index().on(t.newOwnerId),
        idx_domain: index().on(t.domainId),
        idx_compound: index().on(t.fromOwnerId, t.id),
        idx_created: index().on(t.timestamp),
    }),
);

export type NameSoldInsert = typeof schema.nameSold.$inferInsert;
export type NameSold = typeof schema.nameSold.$inferSelect;