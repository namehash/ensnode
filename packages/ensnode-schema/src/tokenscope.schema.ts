import { index, onchainTable } from "ponder";

const sharedEventColumns = (t: any) => ({
  /**
   * The unique identifier of the event
   * This is a composite key made up of:
   * - chainId
   * - blockNumber
   * - logIndex
   * e.g. 1-1234-5
   */
  id: t.text().primaryKey(),
  /**
   * The block number of the event
   */
  blockNumber: t.integer().notNull(),
  /**
   * The log index of the event
   */
  logIndex: t.integer().notNull(),
  /**
   * The transaction hash of the event
   */
  transactionID: t.hex().notNull(),
  /**
   * The chain ID of the event
   */
  chainId: t.integer().notNull(),
});

export const nameSold = onchainTable(
  "name_sold",
  (t) => ({
    ...sharedEventColumns(t),
    /**
     * The account that sold the name
     */
    fromOwnerId: t.hex().notNull(),
    /**
     * The account that received the name
     */
    newOwnerId: t.hex().notNull(),
    /**
     * Currency address of the payment
     */
    currencyAddress: t.hex().notNull(),
    /**
     * The amount of the payment
     */
    price: t.bigint().notNull(),
    /**
     * The unique hash identifier of the fulfilled order.
     * Used to track and reference specific orders on-chain.
     */
    orderHash: t.hex().notNull(),
    /**
     * The ID of the token being sold
     */
    tokenId: t.text().notNull(),
    /**
     * The contract address of the token being sold
     */
    contractAddress: t.hex().notNull(),
    /**
     * The namehash of the name
     */
    domainId: t.hex().notNull(),
    /**
     * The time when the order was created
     */
    createdAt: t.bigint().notNull(),
    /**
     * The type of token being sold
     * can either be ERC721 or ERC1155
     */
    tokenType: t.text().notNull(),
  }),
  (t) => ({
    idx_from: index().on(t.fromOwnerId),
    idx_to: index().on(t.newOwnerId),
    idx_domain: index().on(t.domainId),
    idx_compound: index().on(t.fromOwnerId, t.id),
    idx_created: index().on(t.createdAt),
  }),
);
