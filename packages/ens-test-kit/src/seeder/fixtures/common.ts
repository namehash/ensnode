import { accounts, addresses, fixtures } from "@ensnode/datasources/devnet";

import type { Fixture } from "../types";
import { abiRecord } from "./abi";
import { contenthashRecord } from "./contenthash";
import { interfaceRecord } from "./interface-record";
import { multicoinAddressRecord } from "./multicoin-address";
import { pubkeyRecord } from "./pubkey";
import { reverseName } from "./reverse-name";
import { textRecord } from "./text-record";

export const canonicalFixtures: Fixture[] = [
  reverseName({
    id: "reverse-name-owner-test-eth",
    address: accounts.owner.address,
    chainId: 1,
    name: "test.eth",
  }),
  textRecord({
    id: "text-record-test-eth-avatar",
    name: "test.eth",
    key: "avatar",
    value: "https://example.com/avatar.png",
  }),
  textRecord({
    id: "text-record-test-eth-com-twitter",
    name: "test.eth",
    key: "com.twitter",
    value: "ensdomains",
  }),
  textRecord({
    id: "text-record-test-eth-com-github",
    name: "test.eth",
    key: "com.github",
    value: "ensdomains",
  }),
  textRecord({
    id: "text-record-test-eth-url",
    name: "test.eth",
    key: "url",
    value: "https://ens.domains",
  }),
  textRecord({
    id: "text-record-test-eth-email",
    name: "test.eth",
    key: "email",
    value: "test@ens.domains",
  }),
  textRecord({
    id: "text-record-test-eth-description",
    name: "test.eth",
    key: "description",
    value: "test.eth",
  }),
  multicoinAddressRecord({
    id: "multicoin-address-test-eth-0",
    name: "test.eth",
    coinType: 0,
    value: fixtures.bitcoinAddress,
  }),
  multicoinAddressRecord({
    id: "multicoin-address-test-eth-2",
    name: "test.eth",
    coinType: 2,
    value: fixtures.litecoinAddress,
  }),
  contenthashRecord({
    id: "contenthash-test-eth",
    name: "test.eth",
    value: fixtures.contenthash,
  }),
  pubkeyRecord({
    id: "pubkey-test-eth",
    name: "test.eth",
    x: fixtures.publicKeyX,
    y: fixtures.publicKeyY,
  }),
  abiRecord({
    id: "abi-test-eth-content-type-1",
    name: "test.eth",
    contentType: 1,
    value: fixtures.abiBytes,
  }),
  interfaceRecord({
    id: "interface-record-test-eth-0x11100111",
    name: "test.eth",
    interfaceId: fixtures.fourBytesInterface,
    value: addresses.one,
  }),
];
