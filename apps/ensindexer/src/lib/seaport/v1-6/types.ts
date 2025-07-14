export type OfferItem = {
  itemType: ItemType;
  token: string;
  identifierOrCriteria: string;
  startAmount: string;
  endAmount: string;
};

export type ConsiderationItem = {
  itemType: ItemType;
  token: string;
  identifierOrCriteria: string;
  startAmount: string;
  endAmount: string;
  recipient: string;
};

export type Item = OfferItem | ConsiderationItem;

export type OrderParameters = {
  offerer: string;
  zone: string;
  orderType: OrderType;
  startTime: BigNumberish;
  endTime: BigNumberish;
  zoneHash: string;
  salt: string;
  offer: OfferItem[];
  consideration: ConsiderationItem[];
  totalOriginalConsiderationItems: BigNumberish;
  conduitKey: string;
};

export type OrderComponents = OrderParameters & { counter: BigNumberish };

export type Order = {
  parameters: OrderParameters;
  signature: string;
};

export type AdvancedOrder = Order & {
  numerator: bigint;
  denominator: bigint;
  extraData: string;
};

export type BasicErc721Item = {
  itemType: ItemType.ERC721;
  token: string;
  identifier: string;
};

export type Erc721ItemWithCriteria = {
  itemType: ItemType.ERC721;
  token: string;
  amount?: string;
  endAmount?: string;
  // Used for criteria based items i.e. offering to buy 5 NFTs for a collection
} & ({ identifiers: string[] } | { criteria: string });

type Erc721Item = BasicErc721Item | Erc721ItemWithCriteria;

export type BasicErc1155Item = {
  itemType: ItemType.ERC1155;
  token: string;
  identifier: string;
  amount: string;
  endAmount?: string;
};

export type Erc1155ItemWithCriteria = {
  itemType: ItemType.ERC1155;
  token: string;
  amount: string;
  endAmount?: string;
} & ({ identifiers: string[] } | { criteria: string });

type Erc1155Item = BasicErc1155Item | Erc1155ItemWithCriteria;

export type CurrencyItem = {
  token?: string;
  amount: string;
  endAmount?: string;
};

export type CreateInputItem = Erc721Item | Erc1155Item | CurrencyItem;

export type ConsiderationInputItem = CreateInputItem & { recipient?: string };

export type TipInputItem = CreateInputItem & { recipient: string };

export type Fee = {
  recipient: string;
  basisPoints: number;
};

export type CreateOrderInput = {
  conduitKey?: string;
  zone?: string;
  zoneHash?: string;
  startTime?: BigNumberish;
  endTime?: BigNumberish;
  offer: readonly CreateInputItem[];
  consideration: readonly ConsiderationInputItem[];
  counter?: BigNumberish;
  fees?: readonly Fee[];
  allowPartialFills?: boolean;
  restrictedByZone?: boolean;
  domain?: string;
  salt?: BigNumberish;
};

export type InputCriteria = {
  identifier: string;
  proof: string[];
};

export type OrderStatus = {
  isValidated: boolean;
  isCancelled: boolean;
  totalFilled: bigint;
  totalSize: bigint;
};

export type OrderWithCounter = {
  parameters: OrderComponents;
  signature: string;
};
