/**
 * This file is loaded by ponder as part of ponder dev & ponder start. In here we conditionally
 * execute each enabled plugin's handler functions in order to
 */

import config from "@/config";

import { PluginName } from "@ensnode/ensnode-sdk";

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

// REQUIRED ORDER: NodeMigration → Unigraph → ProtocolAcceleration
//
// 1. NodeMigration runs first so that `nodeIsMigrated` is populated before either plugin's
//    Old-registry guards consult it.
// 2. Unigraph runs before ProtocolAcceleration so its `handleBridgedResolverChange` can read the
//    PREVIOUS Domain-Resolver Relation from the index — ProtocolAcceleration's NewResolver /
//    ResolverUpdated handlers overwrite that row, so reading MUST happen first.
// 3. ProtocolAcceleration's resolver handlers then write the new DRR.
//
// Note: NodeMigration is gated on ProtocolAcceleration but the Unigraph plugin has
// ProtocolAcceleration as a hard requirement, so checking ProtocolAcceleration is sufficient
// to cover both plugins' needs.

if (config.plugins.includes(PluginName.ProtocolAcceleration)) {
  attach_NodeMigrationHandlers();
}

if (config.plugins.includes(PluginName.Unigraph)) {
  attach_UnigraphHandlers();
}

if (config.plugins.includes(PluginName.ProtocolAcceleration)) {
  attach_protocolAccelerationHandlers();
}
