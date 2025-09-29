import { ponder } from "ponder:registry";
import { parseDnsTxtRecordArgs } from "@/lib/dns-helpers";
import { namespaceContract } from "@/lib/plugin-helpers";
import {
  ensureResolverRecords,
  handleResolverAddressRecordUpdate,
  handleResolverNameUpdate,
  handleResolverTextRecordUpdate,
} from "@/plugins/protocol-acceleration/lib/protocol-acceleration-db-helpers";
import { ETH_COIN_TYPE, PluginName } from "@ensnode/ensnode-sdk";

/**
 * Handlers for Resolver contracts in the Protocol Acceleration plugin. These handlers ensure that
 * the relevant Resolver Records are indexed in order to power Protocol Acceleration.
 */
export default function () {
  ponder.on(
    namespaceContract(PluginName.ProtocolAcceleration, "Resolver:AddrChanged"),
    async ({ context, event }) => {
      const { a: address } = event.args;

      // AddrChanged is just AddressChanged with implicit coinType of ETH
      const id = await ensureResolverRecords(context, event);
      await handleResolverAddressRecordUpdate(context, id, BigInt(ETH_COIN_TYPE), address);
    },
  );

  ponder.on(
    namespaceContract(PluginName.ProtocolAcceleration, "Resolver:AddressChanged"),
    async ({ context, event }) => {
      const { coinType, newAddress } = event.args;

      const id = await ensureResolverRecords(context, event);
      await handleResolverAddressRecordUpdate(context, id, coinType, newAddress);
    },
  );

  ponder.on(
    namespaceContract(PluginName.ProtocolAcceleration, "Resolver:NameChanged"),
    async ({ context, event }) => {
      const { name } = event.args;

      const id = await ensureResolverRecords(context, event);
      await handleResolverNameUpdate(context, id, name);
    },
  );

  ponder.on(
    namespaceContract(
      PluginName.ProtocolAcceleration,
      "Resolver:TextChanged(bytes32 indexed node, string indexed indexedKey, string key)",
    ),
    async ({ context, event }) => {
      const { node, key } = event.args;

      const id = await ensureResolverRecords(context, event);

      let value: string | null = null;
      try {
        // this is a LegacyPublicResolver (DefaultPublicResolver1) event which does not emit `value`,
        // so we fetch it here if possible
        value = await context.client.readContract({
          abi: context.contracts.Resolver.abi,
          address: event.log.address,
          functionName: "text",
          args: [node, key],
        });
      } catch {
        // readContract threw, record value as 'null' which will be interpreted as deletion
      }

      await handleResolverTextRecordUpdate(context, id, key, value);
    },
  );

  ponder.on(
    namespaceContract(
      PluginName.ProtocolAcceleration,
      "Resolver:TextChanged(bytes32 indexed node, string indexed indexedKey, string key, string value)",
    ),
    async ({ context, event }) => {
      const { key, value } = event.args;

      const id = await ensureResolverRecords(context, event);
      await handleResolverTextRecordUpdate(context, id, key, value);
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

      // no key to operate over? no-op
      if (key === null) return;

      const id = await ensureResolverRecords(context, event);
      await handleResolverTextRecordUpdate(context, id, key, value);
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

      // no key to operate over? no-op
      if (key === null) return;

      const id = await ensureResolverRecords(context, event);
      await handleResolverTextRecordUpdate(context, id, key, value);
    },
  );

  ponder.on(
    namespaceContract(PluginName.ProtocolAcceleration, "Resolver:DNSRecordDeleted"),
    async ({ context, event }) => {
      const { key } = parseDnsTxtRecordArgs(event.args);

      // no key to operate over? no-op
      if (key === null) return;

      const id = await ensureResolverRecords(context, event);
      await handleResolverTextRecordUpdate(context, id, key, null);
    },
  );
}
