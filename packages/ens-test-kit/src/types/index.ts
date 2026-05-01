import type { Hex as ViemHex } from "viem";

export type Hex = ViemHex;
export type ChainId = number;
export type NormalizedName = string;
export type ResolverId = string;

export interface Registration {
  name: NormalizedName;
  registrant: Hex | null;
  registrationDate: string | null;
  expiryDate: string | null;
}

export interface Domain {
  name: NormalizedName;
  namehash: Hex;
  owner: Hex | null;
  resolverId: ResolverId | null;
  registration: Registration | null;
  parentName: NormalizedName | null;
}

export interface Account {
  address: Hex;
  domains: Domain[];
  primaryNames?: Partial<Record<ChainId, NormalizedName | null>>;
}

export interface Resolver {
  id: ResolverId;
  address: Hex;
  domainNames: NormalizedName[];
}

export interface Connection<T> {
  items: T[];
  totalCount: number;
}

export interface DomainsWhere {
  owner?: Hex;
  parentName?: NormalizedName;
  resolverId?: ResolverId;
  nameContains?: string;
}

export interface RecordsSelection {
  name?: boolean;
  addresses?: ChainId[];
  texts?: string[];
  contenthash?: boolean;
  pubkey?: boolean;
  abi?: boolean;
  interfaceIds?: Hex[];
}

export interface ResolvedRecords {
  name?: NormalizedName | null;
  addresses?: Partial<Record<ChainId, Hex | null>>;
  texts?: Record<string, string | null>;
  contenthash?: string | null;
  pubkey?: {
    x: Hex;
    y: Hex;
  } | null;
  abi?: string | null;
  interfaces?: Record<Hex, Hex | null>;
}
