import { and, eq } from "drizzle-orm";
import {
  asLiteralName,
  bigintToCoinType,
  type CoinType,
  ETH_COIN_TYPE,
  makeResolverRecordsId,
} from "enssdk";

import { ResolverABI } from "@ensnode/datasources";
import { PluginName } from "@ensnode/ensnode-sdk";

import { parseDnsTxtRecordArgs } from "@/lib/dns-helpers";
import { addOnchainEventListener, ensIndexerSchema } from "@/lib/indexing-engines/ponder";
import { namespaceContract } from "@/lib/plugin-helpers";
import {
  ensureResolverAndRecords,
  handleResolverAddressRecordUpdate,
  handleResolverContenthashUpdate,
  handleResolverDnszonehashUpdate,
  handleResolverNameUpdate,
  handleResolverPubkeyUpdate,
  handleResolverTextRecordUpdate,
} from "@/lib/protocol-acceleration/resolver-db-helpers";

const pluginName = PluginName.ProtocolAcceleration;

/**
 * Handlers for Resolver contracts in the Protocol Acceleration plugin.
 * - indexes all Resolver Records described by protocol-acceleration.schema.ts
 */
export default function () {
  addOnchainEventListener(
    namespaceContract(pluginName, "Resolver:AddrChanged"),
    async ({ context, event }) => {
      const key = await ensureResolverAndRecords(context, event);
      // Resolver#AddrChanged is Resolver#AddressChanged with implicit coinType ETH
      await handleResolverAddressRecordUpdate(context, key, ETH_COIN_TYPE, event.args.a);
    },
  );

  addOnchainEventListener(
    namespaceContract(pluginName, "Resolver:AddressChanged"),
    async ({ context, event }) => {
      const { coinType: _coinType, newAddress } = event.args;

      // all well-known CoinTypes fit into number, so we coerce here
      let coinType: CoinType;
      try {
        coinType = bigintToCoinType(_coinType);
      } catch {
        return; // ignore if bigint can't be coerced to known CoinType
      }

      const key = await ensureResolverAndRecords(context, event);
      await handleResolverAddressRecordUpdate(context, key, coinType, newAddress);
    },
  );

  addOnchainEventListener(
    namespaceContract(pluginName, "Resolver:NameChanged"),
    async ({ context, event }) => {
      const key = await ensureResolverAndRecords(context, event);
      await handleResolverNameUpdate(context, key, asLiteralName(event.args.name));
    },
  );

  addOnchainEventListener(
    namespaceContract(
      PluginName.ProtocolAcceleration,
      "Resolver:TextChanged(bytes32 indexed node, string indexed indexedKey, string key)",
    ),
    async ({ context, event }) => {
      const { node, key: textKey } = event.args;

      // this is a LegacyPublicResolver (DefaultPublicResolver3) event which does not emit `value`,
      // so we fetch it here if possible
      // default record value as 'null' which will be interpreted as deletion/non-existence of record
      let value: string | null = null;
      try {
        value = await context.client.readContract({
          abi: ResolverABI,
          address: event.log.address,
          functionName: "text",
          args: [node, textKey],
        });
      } catch {} // no-op if readContract throws for whatever reason

      const recordsKey = await ensureResolverAndRecords(context, event);
      await handleResolverTextRecordUpdate(context, recordsKey, textKey, value);
    },
  );

  addOnchainEventListener(
    namespaceContract(
      PluginName.ProtocolAcceleration,
      "Resolver:TextChanged(bytes32 indexed node, string indexed indexedKey, string key, string value)",
    ),
    async ({ context, event }) => {
      const { key: textKey, value } = event.args;
      const recordsKey = await ensureResolverAndRecords(context, event);
      await handleResolverTextRecordUpdate(context, recordsKey, textKey, value);
    },
  );

  // ens-contracts' IDNSRecordResolver#DNSRecordChanged
  // https://github.com/ensdomains/ens-contracts/blob/85ddeb9f/contracts/resolvers/profiles/IDNSRecordResolver.sol#L6
  addOnchainEventListener(
    namespaceContract(
      PluginName.ProtocolAcceleration,
      "Resolver:DNSRecordChanged(bytes32 indexed node, bytes name, uint16 resource, bytes record)",
    ),
    async ({ context, event }) => {
      const { key: textKey, value } = parseDnsTxtRecordArgs(event.args);
      if (textKey === null) return; // no key to operate over? args were malformed, ignore event

      const recordsKey = await ensureResolverAndRecords(context, event);
      await handleResolverTextRecordUpdate(context, recordsKey, textKey, value);
    },
  );

  // 3DNS' IDNSRecordResolver#DNSRecordChanged (includes `ttl` parameter)
  addOnchainEventListener(
    namespaceContract(
      PluginName.ProtocolAcceleration,
      "Resolver:DNSRecordChanged(bytes32 indexed node, bytes name, uint16 resource, uint32 ttl, bytes record)",
    ),
    async ({ context, event }) => {
      const { key: textKey, value } = parseDnsTxtRecordArgs(event.args);
      if (textKey === null) return; // no key to operate over? args were malformed, ignore event

      const recordsKey = await ensureResolverAndRecords(context, event);
      await handleResolverTextRecordUpdate(context, recordsKey, textKey, value);
    },
  );

  addOnchainEventListener(
    namespaceContract(pluginName, "Resolver:DNSRecordDeleted"),
    async ({ context, event }) => {
      const { key: textKey } = parseDnsTxtRecordArgs(event.args);
      if (textKey === null) return; // no key to operate over? args were malformed, ignore event

      const recordsKey = await ensureResolverAndRecords(context, event);
      await handleResolverTextRecordUpdate(context, recordsKey, textKey, null);
    },
  );

  // NOTE: ABIChanged and InterfaceChanged are intentionally NOT registered.
  // - ABIChanged event omits data (would require a follow-up readContract per event).
  // - InterfaceChanged has an ERC-165 fallback that cannot be replicated offline.
  // Both remain selectable via the Resolution API but are always resolved via RPC.
  // Protocol Acceleration support can be added as desired.

  addOnchainEventListener(
    namespaceContract(pluginName, "Resolver:ContenthashChanged"),
    async ({ context, event }) => {
      const key = await ensureResolverAndRecords(context, event);
      await handleResolverContenthashUpdate(context, key, event.args.hash);
    },
  );

  addOnchainEventListener(
    namespaceContract(pluginName, "Resolver:PubkeyChanged"),
    async ({ context, event }) => {
      const { x, y } = event.args;
      const key = await ensureResolverAndRecords(context, event);
      await handleResolverPubkeyUpdate(context, key, x, y);
    },
  );

  addOnchainEventListener(
    namespaceContract(pluginName, "Resolver:DNSZonehashChanged"),
    async ({ context, event }) => {
      const key = await ensureResolverAndRecords(context, event);
      await handleResolverDnszonehashUpdate(context, key, event.args.zonehash);
    },
  );

  // IVersionableResolver VersionChanged: delete all child records for (chainId, address, node)
  // and reset scalar columns. Uses raw drizzle via `context.ensDb.sql` to bulk-delete —
  // this flushes ponder's in-memory cache to Postgres, accepted because VersionChanged is rare.
  addOnchainEventListener(
    namespaceContract(pluginName, "Resolver:VersionChanged"),
    async ({ context, event }) => {
      const { chainId, address, node } = await ensureResolverAndRecords(context, event);

      await context.ensDb.sql
        .delete(ensIndexerSchema.resolverAddressRecord)
        .where(
          and(
            eq(ensIndexerSchema.resolverAddressRecord.chainId, chainId),
            eq(ensIndexerSchema.resolverAddressRecord.address, address),
            eq(ensIndexerSchema.resolverAddressRecord.node, node),
          ),
        );

      await context.ensDb.sql
        .delete(ensIndexerSchema.resolverTextRecord)
        .where(
          and(
            eq(ensIndexerSchema.resolverTextRecord.chainId, chainId),
            eq(ensIndexerSchema.resolverTextRecord.address, address),
            eq(ensIndexerSchema.resolverTextRecord.node, node),
          ),
        );

      await context.ensDb
        .update(ensIndexerSchema.resolverRecords, {
          id: makeResolverRecordsId({ chainId, address }, node),
        })
        .set({
          name: null,
          contenthash: null,
          pubkeyX: null,
          pubkeyY: null,
          dnszonehash: null,
          version: event.args.newVersion,
        });
    },
  );
}
