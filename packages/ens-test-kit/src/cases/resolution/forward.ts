import { accounts, addresses, fixtures } from "@ensnode/datasources/devnet";

import type { ResolutionsApi } from "../../interfaces/resolutions";
import {
  abiRecord,
  contenthashRecord,
  interfaceRecord,
  multicoinAddressRecord,
  pubkeyRecord,
  textRecord,
} from "../../seeder";
import type { TestCase } from "../types";

const textAvatar = textRecord({
  id: "resolution-forward-text-avatar",
  name: "test.eth",
  key: "avatar",
  value: "https://example.com/avatar.png",
});
const textTwitter = textRecord({
  id: "resolution-forward-text-com-twitter",
  name: "test.eth",
  key: "com.twitter",
  value: "ensdomains",
});
const textGithub = textRecord({
  id: "resolution-forward-text-com-github",
  name: "test.eth",
  key: "com.github",
  value: "ensdomains",
});
const textUrl = textRecord({
  id: "resolution-forward-text-url",
  name: "test.eth",
  key: "url",
  value: "https://ens.domains",
});
const textEmail = textRecord({
  id: "resolution-forward-text-email",
  name: "test.eth",
  key: "email",
  value: "test@ens.domains",
});
const textDescription = textRecord({
  id: "resolution-forward-text-description",
  name: "test.eth",
  key: "description",
  value: "test.eth",
});
const btcAddress = multicoinAddressRecord({
  id: "resolution-forward-address-btc",
  name: "test.eth",
  coinType: 0,
  value: fixtures.bitcoinAddress,
});
const ltcAddress = multicoinAddressRecord({
  id: "resolution-forward-address-ltc",
  name: "test.eth",
  coinType: 2,
  value: fixtures.litecoinAddress,
});
const testEthContenthash = contenthashRecord({
  id: "resolution-forward-contenthash",
  name: "test.eth",
  value: fixtures.contenthash,
});
const testEthPubkey = pubkeyRecord({
  id: "resolution-forward-pubkey",
  name: "test.eth",
  x: fixtures.publicKeyX,
  y: fixtures.publicKeyY,
});
const testEthAbi = abiRecord({
  id: "resolution-forward-abi-content-type-1",
  name: "test.eth",
  contentType: 1,
  value: fixtures.abiBytes,
});
const testEthInterface = interfaceRecord({
  id: "resolution-forward-interface-record",
  name: "test.eth",
  interfaceId: fixtures.fourBytesInterface,
  value: addresses.one,
});

export const forwardResolutionCases: TestCase<ResolutionsApi>[] = [
  {
    id: "resolution.forward.text-avatar",
    description: "resolves avatar text record for test.eth",
    fixtures: [textAvatar],
    call: (api) => api.resolveRecords("test.eth", { texts: [textAvatar.key] }),
    expected: { texts: { [textAvatar.key]: textAvatar.value } },
  },
  {
    id: "resolution.forward.text-unset",
    description: "returns null for unset text record on test.eth",
    fixtures: [],
    call: (api) => api.resolveRecords("test.eth", { texts: ["nonexistent.key"] }),
    expected: { texts: { "nonexistent.key": null } },
  },
  {
    id: "resolution.forward.multicoin-selection",
    description: "resolves selected multicoin addresses for test.eth",
    fixtures: [btcAddress, ltcAddress],
    call: (api) => api.resolveRecords("test.eth", { addresses: [0, 2, 777777] }),
    expected: {
      addresses: {
        [btcAddress.coinType]: btcAddress.value,
        [ltcAddress.coinType]: ltcAddress.value,
        777777: null,
      },
    },
  },
  {
    id: "resolution.forward.combined-supported-records",
    description: "resolves all supported record types for test.eth",
    fixtures: [
      textAvatar,
      textTwitter,
      textGithub,
      textUrl,
      textEmail,
      textDescription,
      btcAddress,
      ltcAddress,
      testEthContenthash,
      testEthPubkey,
      testEthAbi,
      testEthInterface,
    ],
    call: (api) =>
      api.resolveRecords("test.eth", {
        addresses: [60, btcAddress.coinType, ltcAddress.coinType],
        texts: [
          textAvatar.key,
          textDescription.key,
          textUrl.key,
          textEmail.key,
          textTwitter.key,
          textGithub.key,
        ],
        contenthash: true,
        pubkey: true,
        abi: true,
        interfaceIds: [testEthInterface.interfaceId],
      }),
    expected: {
      addresses: {
        60: accounts.owner.address,
        [btcAddress.coinType]: btcAddress.value,
        [ltcAddress.coinType]: ltcAddress.value,
      },
      texts: {
        [textAvatar.key]: textAvatar.value,
        [textDescription.key]: textDescription.value,
        [textUrl.key]: textUrl.value,
        [textEmail.key]: textEmail.value,
        [textTwitter.key]: textTwitter.value,
        [textGithub.key]: textGithub.value,
      },
      contenthash: testEthContenthash.value,
      pubkey: {
        x: testEthPubkey.x,
        y: testEthPubkey.y,
      },
      abi: {
        contentType: String(testEthAbi.contentType),
        data: testEthAbi.value,
      },
      interfaces: {
        [testEthInterface.interfaceId]: testEthInterface.value,
      },
    },
  },
];
