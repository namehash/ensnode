import {index, onchainTable} from "ponder";

const sharedEventColumns = (t: any) => ({
    id: t.text().primaryKey(),
    blockNumber: t.integer().notNull(),
    transactionID: t.hex().notNull(),
});

export const currency = onchainTable("currency", (t) => ({
    id: t.hex().primaryKey(),
    name: t.text(),
    symbol: t.text(),
    decimals: t.integer().notNull(),
    contractAddress: t.hex().notNull(),
    chainId: t.integer().notNull(),
}));

export const nameSold = onchainTable(
    "name_sold",
    (t) => ({
        ...sharedEventColumns(t),
        fromOwnerId: t.hex().notNull(),
        newOwnerId: t.hex().notNull(),
        currencyId: t.hex().notNull(),
        price: t.bigint().notNull(),
        chainId: t.integer().notNull(),
        orderHash: t.hex().notNull(),
    }),
    (t) => ({
        idx_from: index().on(t.fromOwnerId),
        idx_to: index().on(t.newOwnerId),
        idx_currency: index().on(t.currencyId),
        idx_compound: index().on(t.fromOwnerId, t.id),
    }),
);
