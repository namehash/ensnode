/**
 * This file is loaded by ponder as part of ponder dev & ponder start. In here we conditionally
 * execute each enabled plugin's handler functions in order to
 */

import config from "@/config";

import { PluginName } from "@ensnode/ensnode-sdk";

import attach_EFPHandlers from "@/plugins/efp/event-handlers";
import attach_protocolAccelerationHandlers from "@/plugins/protocol-acceleration/event-handlers";
import attach_NodeMigrationHandlers from "@/plugins/protocol-acceleration/handlers/node-migration";
import attach_RegistrarsHandlers from "@/plugins/registrars/event-handlers";
import attach_BasenamesHandlers from "@/plugins/subgraph/plugins/basenames/event-handlers";
import attach_LineanamesHandlers from "@/plugins/subgraph/plugins/lineanames/event-handlers";
import attach_SubgraphHandlers from "@/plugins/subgraph/plugins/subgraph/event-handlers";
import attach_ThreeDNSHandlers from "@/plugins/subgraph/plugins/threedns/event-handlers";
import attach_TokenscopeHandlers from "@/plugins/tokenscope/event-handlers";
import attach_UnigraphHandlers from "@/plugins/unigraph/event-handlers";

// Subgraph Plugin
if (config.plugins.includes(PluginName.Subgraph)) {
  attach_SubgraphHandlers();
}

// Basenames Plugin
if (config.plugins.includes(PluginName.Basenames)) {
  attach_BasenamesHandlers();
}

// Lineanames Plugin
if (config.plugins.includes(PluginName.Lineanames)) {
  attach_LineanamesHandlers();
}

// ThreeDNS Plugin
if (config.plugins.includes(PluginName.ThreeDNS)) {
  attach_ThreeDNSHandlers();
}

// Registrars Plugin
if (config.plugins.includes(PluginName.Registrars)) {
  attach_RegistrarsHandlers();
}

// TokenScope Plugin
if (config.plugins.includes(PluginName.TokenScope)) {
  attach_TokenscopeHandlers();
}

// EFP Plugin
if (config.plugins.includes(PluginName.EFP)) {
  attach_EFPHandlers();
}

// IMPORTANT: the order of these attach_*() calls does NOT control the order Ponder dispatches
// handlers. Ponder orders events by checkpoint (chainId, blockNumber, transactionIndex, logIndex).
// Two handlers registered against the SAME log (e.g. Unigraph and ProtocolAcceleration both on
// `ENSv1Registry:NewResolver`) receive IDENTICAL checkpoints, and Ponder's tie-break is not
// deterministic — so NO ordering between same-log handlers can be relied upon. Handlers must
// therefore be independent of each other's same-event writes (see `handleBridgedResolverChange`,
// which reads the Domain's own `subregistryId` rather than ProtocolAcceleration's Domain-Resolver
// Relation for exactly this reason).
//
// Cross-log ordering (different contracts/logs) IS deterministic by checkpoint. NodeMigration
// relies only on that: it writes `nodeIsMigrated` on `ENSv1Registry:NewOwner` (the new Registry),
// and the Old-registry guards read it on `ENSv1RegistryOld:*` events — different logs, so a node's
// migration is always processed before any stale Old-registry event that consults it.
//
// Note: NodeMigration is gated on ProtocolAcceleration but the Unigraph plugin has
// ProtocolAcceleration as a hard requirement, so checking ProtocolAcceleration is sufficient
// to cover both plugins' needs.
//
// In the future, we may abstract the NodeMigration logic further, or unify the ProtocolAcceleration
// and Unigraph plugins to avoid this ordering concern.

if (config.plugins.includes(PluginName.ProtocolAcceleration)) {
  attach_NodeMigrationHandlers();
}

if (config.plugins.includes(PluginName.Unigraph)) {
  attach_UnigraphHandlers();
}

if (config.plugins.includes(PluginName.ProtocolAcceleration)) {
  attach_protocolAccelerationHandlers();
}
