import { ponder } from "ponder:registry";

import { bigintToCoinType, type CoinType, ETH_COIN_TYPE, PluginName } from "@ensnode/ensnode-sdk";

import { parseDnsTxtRecordArgs } from "@/lib/dns-helpers";
import { namespaceContract } from "@/lib/plugin-helpers";
import {
  ensureResolverAndResolverRecords,
  handleResolverAddressRecordUpdate,
  handleResolverNameUpdate,
  handleResolverTextRecordUpdate,
  makeResolverRecordsCompositeKey,
} from "@/lib/protocol-acceleration/resolver-records-db-helpers";

/**
 * Handlers for Resolver contracts in the Protocol Acceleration plugin.
 * - indexes all Resolver Records described by protocol-acceleration.schema.ts
 */
export default function () {
  ponder.on(
    namespaceContract(PluginName.ProtocolAcceleration, "Resolver:AddrChanged"),
    async ({ context, event }) => {
      const { a: address } = event.args;

      const resolverRecordsKey = makeResolverRecordsCompositeKey(context, event);
      await ensureResolverAndResolverRecords(context, resolverRecordsKey);

      // the Resolver#AddrChanged event is just Resolver#AddressChanged with implicit coinType of ETH
      await handleResolverAddressRecordUpdate(context, resolverRecordsKey, ETH_COIN_TYPE, address);
    },
  );

  ponder.on(
    namespaceContract(PluginName.ProtocolAcceleration, "Resolver:AddressChanged"),
    async ({ context, event }) => {
      const { coinType: _coinType, newAddress } = event.args;

      // all well-known CoinTypes fit into number, so we coerce here
      let coinType: CoinType;
      try {
        coinType = bigintToCoinType(_coinType);
      } catch {
        return; // ignore if bigint can't be coerced to known CoinType
      }

      const resolverRecordsKey = makeResolverRecordsCompositeKey(context, event);
      await ensureResolverAndResolverRecords(context, resolverRecordsKey);
      await handleResolverAddressRecordUpdate(context, resolverRecordsKey, coinType, newAddress);
    },
  );

  ponder.on(
    namespaceContract(PluginName.ProtocolAcceleration, "Resolver:NameChanged"),
    async ({ context, event }) => {
      const { name } = event.args;

      const resolverRecordsKey = makeResolverRecordsCompositeKey(context, event);
      await ensureResolverAndResolverRecords(context, resolverRecordsKey);
      await handleResolverNameUpdate(context, resolverRecordsKey, name);
    },
  );

  ponder.on(
    namespaceContract(
      PluginName.ProtocolAcceleration,
      "Resolver:TextChanged(bytes32 indexed node, string indexed indexedKey, string key)",
    ),
    async ({ context, event }) => {
      const { node, key } = event.args;

      // this is a LegacyPublicResolver (DefaultPublicResolver1) event which does not emit `value`,
      // so we fetch it here if possible

      // default record value as 'null' which will be interpreted as deletion/non-existence of record
      let value: string | null = null;
      try {
        value = await context.client.readContract({
          abi: context.contracts.Resolver.abi,
          address: event.log.address,
          functionName: "text",
          args: [node, key],
        });
      } catch {} // no-op if readContract throws for whatever reason

      const resolverRecordsKey = makeResolverRecordsCompositeKey(context, event);
      await ensureResolverAndResolverRecords(context, resolverRecordsKey);
      await handleResolverTextRecordUpdate(context, resolverRecordsKey, key, value);
    },
  );

  ponder.on(
    namespaceContract(
      PluginName.ProtocolAcceleration,
      "Resolver:TextChanged(bytes32 indexed node, string indexed indexedKey, string key, string value)",
    ),
    async ({ context, event }) => {
      const { key, value } = event.args;

      const resolverRecordsKey = makeResolverRecordsCompositeKey(context, event);
      await ensureResolverAndResolverRecords(context, resolverRecordsKey);
      await handleResolverTextRecordUpdate(context, resolverRecordsKey, key, value);
    },
  );

  // ens-contracts' IDNSRecordResolver#DNSRecordChanged
  // https://github.com/ensdomains/ens-contracts/blob/85ddeb9f/contracts/resolvers/profiles/IDNSRecordResolver.sol#L6
  ponder.on(
    namespaceContract(
      PluginName.ProtocolAcceleration,
      "Resolver:DNSRecordChanged(bytes32 indexed node, bytes name, uint16 resource, bytes record)",
    ),
    async ({ context, event }) => {
      const { key, value } = parseDnsTxtRecordArgs(event.args);
      if (key === null) return; // no key to operate over? args were malformed, ignore event

      const resolverRecordsKey = makeResolverRecordsCompositeKey(context, event);
      await ensureResolverAndResolverRecords(context, resolverRecordsKey);
      await handleResolverTextRecordUpdate(context, resolverRecordsKey, key, value);
    },
  );

  // 3DNS' IDNSRecordResolver#DNSRecordChanged (includes `ttl` parameter)
  ponder.on(
    namespaceContract(
      PluginName.ProtocolAcceleration,
      "Resolver:DNSRecordChanged(bytes32 indexed node, bytes name, uint16 resource, uint32 ttl, bytes record)",
    ),
    async ({ context, event }) => {
      const { key, value } = parseDnsTxtRecordArgs(event.args);
      if (key === null) return; // no key to operate over? args were malformed, ignore event

      const resolverRecordsKey = makeResolverRecordsCompositeKey(context, event);
      await ensureResolverAndResolverRecords(context, resolverRecordsKey);
      await handleResolverTextRecordUpdate(context, resolverRecordsKey, key, value);
    },
  );

  ponder.on(
    namespaceContract(PluginName.ProtocolAcceleration, "Resolver:DNSRecordDeleted"),
    async ({ context, event }) => {
      const { key } = parseDnsTxtRecordArgs(event.args);
      if (key === null) return; // no key to operate over? args were malformed, ignore event

      const resolverRecordsKey = makeResolverRecordsCompositeKey(context, event);
      await ensureResolverAndResolverRecords(context, resolverRecordsKey);
      await handleResolverTextRecordUpdate(context, resolverRecordsKey, key, null);
    },
  );
}
