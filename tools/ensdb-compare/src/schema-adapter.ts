/**
 * Schema adapter to work with ensnode-schema definitions
 * This file provides a bridge between Ponder schemas and our comparison tool
 */

import { pgTable, text, integer, bigint, boolean, index } from 'drizzle-orm/pg-core';

// Define the table schemas manually based on ensnode-schema
// This is our "brute force" solution to avoid Ponder dependencies

export const domainSchema = pgTable('domains', {
  id: text('id').primaryKey(),
  name: text('name'),
  labelName: text('labelName'),
  labelhash: text('labelhash'),
  parentId: text('parentId'),
  subdomainCount: integer('subdomainCount').notNull().default(0),
  resolvedAddressId: text('resolvedAddressId'),
  resolverId: text('resolverId'),
  ttl: bigint('ttl', { mode: 'bigint' }),
  isMigrated: boolean('isMigrated').notNull().default(false),
  createdAt: bigint('createdAt', { mode: 'bigint' }).notNull(),
  ownerId: text('ownerId').notNull(),
  registrantId: text('registrantId'),
  wrappedOwnerId: text('wrappedOwnerId'),
  expiryDate: bigint('expiryDate', { mode: 'bigint' }),
});

export const accountSchema = pgTable('accounts', {
  id: text('id').primaryKey(),
});

export const resolverSchema = pgTable('resolvers', {
  id: text('id').primaryKey(),
  domainId: text('domainId').notNull(),
  address: text('address').notNull(),
  addr: text('addr'),
  contenthash: text('contenthash'),
  texts: text('texts').array(),
  coinTypes: integer('coinTypes').array(),
});

export const registrationSchema = pgTable('registrations', {
  id: text('id').primaryKey(),
  domainId: text('domainId').notNull(),
  registrationDate: bigint('registrationDate', { mode: 'bigint' }).notNull(),
  expiryDate: bigint('expiryDate', { mode: 'bigint' }).notNull(),
  cost: bigint('cost', { mode: 'bigint' }),
  registrantId: text('registrantId').notNull(),
  labelName: text('labelName'),
});

export const resolverAddressRecordSchema = pgTable('resolver_address_records', {
  id: text('id').primaryKey(),
  resolverId: text('resolverId').notNull(),
  coinType: integer('coinType').notNull(),
  addr: text('addr').notNull(),
});

export const resolverTextRecordSchema = pgTable('resolver_text_records', {
  id: text('id').primaryKey(),
  resolverId: text('resolverId').notNull(),
  key: text('key').notNull(),
  value: text('value').notNull(),
});

export const referralSchema = pgTable('ext_registration_referral', {
  id: text('id').primaryKey(),
  referrerId: text('referrerId').notNull(),
  domainId: text('domainId').notNull(),
  refereeId: text('refereeId').notNull(),
  baseCost: bigint('baseCost', { mode: 'bigint' }).notNull(),
  premium: bigint('premium', { mode: 'bigint' }).notNull(),
  total: bigint('total', { mode: 'bigint' }).notNull(),
  chainId: integer('chainId').notNull(),
  transactionHash: text('transactionHash').notNull(),
  timestamp: bigint('timestamp', { mode: 'bigint' }).notNull(),
});

// Table registry for iteration
export const tableSchemas = {
  domains: domainSchema,
  accounts: accountSchema,
  resolvers: resolverSchema,
  registrations: registrationSchema,
  resolver_address_records: resolverAddressRecordSchema,
  resolver_text_records: resolverTextRecordSchema,
  ext_registration_referral: referralSchema,
} as const;

export type TableName = keyof typeof tableSchemas;
export const tableNames = Object.keys(tableSchemas) as TableName[];

// Helper to get table info
export function getTableInfo(tableName: TableName) {
  const schema = tableSchemas[tableName];
  return {
    name: tableName,
    schema,
    // We can add more metadata here as needed
  };
} 
