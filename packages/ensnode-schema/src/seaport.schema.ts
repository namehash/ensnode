import { index, onchainTable } from "ponder";

const sharedEventColumns = (t: any) => ({
  id: t.text().primaryKey(),
  blockNumber: t.integer().notNull(),
  transactionID: t.hex().notNull(),
  chainId: t.integer().notNull(),
});

export const nameSold = onchainTable(
  "name_sold",
  (t) => ({
    ...sharedEventColumns(t),
    fromOwnerId: t.hex().notNull(),
    newOwnerId: t.hex().notNull(),
    currencyAddress: t.hex().notNull(),
    price: t.bigint().notNull(),
    orderHash: t.hex().notNull(),
    tokenId: t.text().notNull(),
    contractAddress: t.hex().notNull(),
    domainId: t.hex().notNull(),
    createdAt: t.bigint().notNull(),
    itemType: t.text().notNull(), // can be either ERC721, ERC1155
  }),
  (t) => ({
    idx_from: index().on(t.fromOwnerId),
    idx_to: index().on(t.newOwnerId),
    idx_domain: index().on(t.domainId),
    idx_compound: index().on(t.fromOwnerId, t.id),
    idx_created: index().on(t.createdAt),
  }),
);
